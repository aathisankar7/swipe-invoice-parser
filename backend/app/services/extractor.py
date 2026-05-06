from google import genai
from dotenv import load_dotenv
import os 
import base64
import pandas as pd
import json
import re
import io

load_dotenv()

GEMINI_KEYS = [os.getenv("gemini_key_paid"), os.getenv("gemini_key")]
GEMINI_CLIENTS = [genai.Client(api_key=k) for k in GEMINI_KEYS if k]

from groq import Groq
groq_client = Groq(api_key=os.getenv("groq_key"))

def extractor_gemini(file_bytes, mime_type):
    prompt = """
    You are an expert invoice parser. Extract ALL possible data from this invoice.
    
    EXTRACTION RULES:
    - Serial Number: Look for "Invoice No", "Bill No", "Receipt No", "Order ID", "#", or any alphanumeric ID
    - Date: Look for any date format (DD/MM/YYYY, MM-DD-YYYY, "Jan 5 2024", etc.)
    - Customer Name: Extract the full recipient details. If both an individual name (e.g., "Shounak") and a company name (e.g., "NextSpeed Technologies") are present, combine them: "Individual Name, Company Name". Priority: Consignee/Buyer name.
    - Phone: Scan ENTIRE document - headers, footers, stamps - for +91, 91-, 0XX-XXXXXXXX, 9/8/7XXXXXXXX
    - Tax: Check for GST, IGST, CGST, SGST, VAT, TAX columns or rows. If multiple, SUM them.
    - Total: Look for "Grand Total", "Net Amount", "Amount Due", "Total Payable"
    - Unit Price: "Rate", "MRP", "Price", "Unit Cost" - the per-item price BEFORE tax
    - priceWithTax: The line-total INCLUDING tax for that item
    - GSTIN: Look for 15-digit alphanumeric strings (e.g., 29AABCT1332L000). 
      * Seller GSTIN: Found near the company logo/header (labels: "GSTIN", "Seller GST", "From:").
      * Buyer GSTIN: Found near "Bill To", "Consignee", "Buyer", "Party Name", "GSTIN/UIN" of the recipient.
    - Bank Details: Extract Bank Name, Account Number, IFSC Code, Branch, and Beneficiary Name if found in the document.
    
    MISSING DATA RULES:
    - If a field cannot be found ANYWHERE in the document, use null
    - NEVER guess or fabricate values
    - If tax % is found (like 18%), keep it as 18 (not 0.18)
    - If only CGST (9%) + SGST (9%) found, report tax as 18
    - Include ALL line items, even "Subtotal", "Discount", "Delivery", "Handling", "Making Charges" rows as products.
    - Categorize: Set "isCharge": true for service-based line items like shipping, making charges, or fees.
    
    Return ONLY this JSON, no explanation:
    {
      "invoice": {
        "serialNumber": null,
        "customerName": null,
        "date": null,
        "totalAmount": null,
        "tax": null,
        "sellerGstin": null,
        "bankDetails": {
          "bankName": null,
          "accountNumber": null,
          "ifscCode": null,
          "branch": null,
          "beneficiaryName": null
        },
        "_missing": []
      },
      "products": [
        {
          "name": null,
          "customerName": null,
          "quantity": null,
          "unitPrice": null,
          "tax": null,
          "priceWithTax": null,
          "isCharge": false,
          "_missing": []
        }
      ],
      "customer": {
        "name": null,
        "phone": null,
        "buyerGstin": null,
        "totalPurchaseAmount": null,
        "_missing": []
      }
    }
    
    For each object, populate "_missing" with field names that are genuinely absent from the document.
    Example: "_missing": ["phone", "date", "bankDetails"]
    """
    
    last_error = "No Gemini clients available"
    for client in GEMINI_CLIENTS:
        try:
            response = client.models.generate_content(
                model="gemini-flash-latest", 
                contents=[
                    prompt, 
                    {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(file_bytes).decode("utf-8")}}
                ]
            )
            return clean_json(response.text)
        except Exception as e:
            last_error = str(e)
            if "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
                print(f"Gemini client failed (429/Quota). Trying next... Error: {last_error}")
                continue
            else:
                return {"error": f"Gemini failed: {last_error}"}
                
    return {"error": f"All Gemini clients failed or exhausted: {last_error}"}

def clean_json(text):
    try:
        text = re.sub(r"```json|```", "", text).strip()
        return json.loads(text)
    except Exception:
        return {"error": "Invalid JSON"}

def safe_float(val):
    if val is None:
        return None
    if hasattr(val, "iloc"):
        val = val.iloc[0] if not val.empty else None
    
    if val is None or pd.isna(val):
        return None
        
    try:
        clean_val = str(val).replace(",", "").replace("₹", "").replace("%", "").strip()
        clean_val = re.findall(r"[-+]?\d*\.?\d+", clean_val)
        if clean_val:
            return float(clean_val[0])
        return None
    except (ValueError, TypeError):
        return None

def map_headers_with_groq(raw_headers):
    """Use Groq to map unknown Excel/CSV headers to our standard schema."""
    prompt = f"""
    An invoice spreadsheet has these headers: {raw_headers}
    Map them to standard fields: [customer, invoice_id, product, quantity, unit_price, tax, total]
    Return ONLY a JSON object where keys are our standard fields and values are the matching raw header names from the list above.
    If a field doesn't exist, use null.
    Example: {{"customer": "Party Name", "total": "Grand Total"}}
    """
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Groq Header Mapping failed: {e}")
        return {}

def normalize(data):
    if "error" in data:
        return data
        
    invoice = data.get("invoice", {})
    invoice["totalAmount"] = safe_float(invoice.get("totalAmount"))
    invoice["tax"] = safe_float(invoice.get("tax"))

    for p in data.get("products", []):
        qty = safe_float(p.get("quantity")) or 1.0
        p["quantity"] = qty
        p["unitPrice"] = safe_float(p.get("unitPrice"))
        p["priceWithTax"] = safe_float(p.get("priceWithTax"))
        
        extracted_tax = safe_float(p.get("tax"))
        
        if (extracted_tax is None or extracted_tax == 0) and p.get("priceWithTax") and p.get("unitPrice"):
            calc_tax = round(p["priceWithTax"] - (qty * p["unitPrice"]), 2)
            p["tax"] = max(0, calc_tax) # Set to calculated value, at least 0
        
        elif extracted_tax is not None and extracted_tax in [5, 6, 9, 12, 14, 18, 28] and p.get("unitPrice"):
            p["tax"] = round(qty * p["unitPrice"] * (extracted_tax / 100), 2)
            if p.get("priceWithTax") is None:
                p["priceWithTax"] = round(qty * p["unitPrice"] + p["tax"], 2)
        
        elif p.get("priceWithTax") is None and p.get("unitPrice") and extracted_tax is not None:
            p["priceWithTax"] = round(qty * p["unitPrice"] + extracted_tax, 2)
        
        charge_keywords = ["shipping", "delivery", "handling", "charge", "fee", "making", "debit card", "cgst", "sgst", "igst", "round off", "discount", "cess", "total", "net amount"]
        if not p.get("isCharge") and p.get("name"):
            name_lower = str(p["name"]).lower()
            if any(k in name_lower for k in charge_keywords):
                p["isCharge"] = True

    if invoice.get("totalAmount") is None:
        invoice["totalAmount"] = sum((p.get("priceWithTax") or 0) for p in data.get("products", []))
    if invoice.get("tax") is None:
        invoice["tax"] = sum((p.get("tax") or 0) for p in data.get("products", []))

    return data

def get_excel_headers(file_bytes, filename):
    """Inspect Excel to return headers and suggested mapping."""
    try:
        if filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        else:
            df_full = pd.read_excel(io.BytesIO(file_bytes), header=None)
            header_row = 0
            keywords = ["invoice", "customer", "party", "date", "product", "item", "qty", "rate", "total", "amount", "gstin"]
            for i in range(min(10, len(df_full))):
                row = df_full.iloc[i]
                non_empty = [str(x) for x in row if pd.notnull(x) and str(x).strip()]
                if any(any(k in str(val).lower() for k in keywords) for val in non_empty):
                    header_row = i
                    break
            df = pd.read_excel(io.BytesIO(file_bytes), header=header_row)
        
        headers = df.columns.astype(str).str.strip().tolist()
        column_map = get_standard_column_map()
        
        def find_col(possible_names):
            for name in possible_names:
                for col in headers:
                    if name.lower() == str(col).lower().strip(): return col
            for name in possible_names:
                for col in headers:
                    if name.lower() in str(col).lower(): return col
            return None

        suggestions = {key: find_col(names) for key, names in column_map.items()}
        
        if any(v is None for v in suggestions.values()):
            ai_map = map_headers_with_groq(headers)
            for k, v in ai_map.items():
                if k in suggestions and suggestions[k] is None:
                    suggestions[k] = v

        return {
            "headers": headers,
            "suggestions": suggestions,
            "filename": filename
        }
    except Exception as e:
        return {"error": f"Failed to inspect Excel: {str(e)}"}

def get_standard_column_map():
    return {
        "customer": ["customer name", "party name", "party company name", "client", "buyer", "bill to", "consignee"],
        "invoice_id": ["serial number", "invoice no", "invoice number", "invoice id", "invoice"],
        "date": ["invoice date", "date", "billing date"],
        "product": ["product name", "item name", "product", "item", "description", "making charges", "shipping charges"],
        "quantity": ["qty", "quantity", "quantity (kg/pcs/mtr)"],
        "unit_price": ["unit price", "rate", "price", "unit rate"],
        "tax": ["tax amount", "tax (%)", "tax", "gst", "igst", "cgst", "sgst"],
        "total": ["total amount", "price with tax", "net amount", "grand total", "total", "amount", "net value"],
        "gstin": ["gstin", "gst no", "gst number", "tax id", "seller gstin"],
        "buyer_gstin": ["buyer gstin", "customer gstin", "consignee gstin"],
        "phone": ["phone", "mobile", "contact", "tel"],
        "bank_name": ["bank name", "bank"],
        "acc_no": ["account number", "account no", "acc no", "acc number"],
        "ifsc": ["ifsc", "ifsc code"],
    }

def excel_extract(file_bytes, filename, custom_map=None):
    try:
        if filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        else:
            df_full = pd.read_excel(io.BytesIO(file_bytes), header=None)
            header_row = 0
            for i in range(min(10, len(df_full))):
                row = df_full.iloc[i]
                non_empty = [str(x) for x in row if pd.notnull(x) and str(x).strip()]
                keywords = ["invoice", "customer", "party", "date", "product", "item", "qty", "rate", "total", "amount", "gstin"]
                if any(any(k in str(val).lower() for k in keywords) for val in non_empty):
                    header_row = i
                    break
            
            df = pd.read_excel(io.BytesIO(file_bytes), header=header_row)
            
        df.columns = df.columns.astype(str).str.strip()
        df = df.where(pd.notnull(df), None)
        
        column_map = get_standard_column_map()

        def find_col(possible_names):
            for name in possible_names:
                for col in df.columns:
                    if name.lower() == str(col).lower().strip():
                        return col
            for name in possible_names:
                for col in df.columns:
                    if name.lower() in str(col).lower():
                        return col
            return None

        if custom_map:
            cols = custom_map
        else:
            cols = {key: find_col(names) for key, names in column_map.items()}

            if any(v is None for v in cols.values()):
                ai_map = map_headers_with_groq(df.columns.tolist())
                for target, raw in ai_map.items():
                    if target in cols and cols[target] is None and raw in df.columns:
                        cols[target] = raw

        if cols["customer"] is None: cols["customer"] = df.columns[0]
        
        inv_col = cols["invoice_id"]
        if inv_col and inv_col in df.columns:
            grouped = df.groupby(inv_col)
        else:
            grouped = [("single_invoice", df)]

        results = []

        for inv_id, group in grouped:
            raw_customer = group.iloc[0].get(cols["customer"]) if cols["customer"] in df.columns and cols["customer"] else "Unknown Customer"
            customer_name = str(raw_customer.iloc[0] if hasattr(raw_customer, "iloc") else raw_customer)
            
            invoice_date = None
            if cols["date"] in df.columns and cols["date"]:
                raw_date = group.iloc[0].get(cols["date"])
                invoice_date = str(raw_date.iloc[0] if hasattr(raw_date, "iloc") else raw_date) if raw_date is not None else None

            products = []
            for _, row in group.iterrows():
                p_name = row.get(cols["product"]) if cols["product"] in df.columns and cols["product"] else None
                p_name = str(p_name.iloc[0] if hasattr(p_name, "iloc") else p_name) if p_name else None
                
                if not p_name or str(p_name).lower() == "nan":
                    charge_keywords = ["cgst", "sgst", "igst", "round off", "discount", "tax", "cess"]
                    for cell in row:
                        if any(k in str(cell).lower() for k in charge_keywords):
                            p_name = str(cell)
                            break

                if not p_name or str(p_name).lower() == "nan": continue

                products.append({
                    "name": p_name,
                    "customerName": customer_name,
                    "quantity": safe_float(row.get(cols["quantity"])),
                    "unitPrice": safe_float(row.get(cols["unit_price"])),
                    "tax": safe_float(row.get(cols["tax"])),
                    "priceWithTax": safe_float(row.get(cols["total"]))
                })

            total_amount = sum((p["priceWithTax"] or 0) for p in products)
            
            def get_val(col_key):
                col = cols.get(col_key)
                if not col or col not in df.columns: return None
                val = group.iloc[0].get(col)
                return str(val.iloc[0] if hasattr(val, "iloc") else val) if val is not None else None

            result = normalize({
                "invoice": {
                    "serialNumber": str(inv_id) if inv_id != "single_invoice" else "N/A",
                    "customerName": customer_name,
                    "date": invoice_date,
                    "totalAmount": total_amount,
                    "tax": sum((p["tax"] or 0) for p in products),
                    "sellerGstin": get_val("gstin"),
                    "bankDetails": {
                        "bankName": get_val("bank_name"),
                        "accountNumber": get_val("acc_no"),
                        "ifscCode": get_val("ifsc"),
                        "branch": None,
                        "beneficiaryName": None
                    }
                },
                "products": products,
                "customer": {
                    "name": customer_name,
                    "phone": get_val("phone"),
                    "buyerGstin": get_val("buyer_gstin"),
                    "totalPurchaseAmount": total_amount
                }
            })
            results.append(result)

        return results

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"EXCEL ERROR: {str(e)}")
        return [{"error": f"Excel parsing failed: {str(e)}"}]

def get_file_type(filename):
    ext = filename.lower()
    if ext.endswith(".pdf"):
        return "pdf"
    elif ext.endswith((".jpg", ".png", ".jpeg")):
        return "image"
    elif ext.endswith((".xls", ".xlsx", ".csv")):
        return "excel" # Treat CSV as Excel for processing
    return "unknown"

def process_file(file):
    try:
        file_bytes = file.file.read()
        file_type = get_file_type(file.filename)

        if file_type == "excel":
            return excel_extract(file_bytes, file.filename)
        
        if file_type in ["pdf", "image"]:
            data = extractor_gemini(file_bytes, file.content_type)
            return normalize(data)
        else:
            return {"error": "Unsupported file type"}
    except Exception as e:
        return {"error": f"File processing failed: {str(e)}"}

def process_files(files):
    all_results = []
    for file in files:
        result = process_file(file)
        if isinstance(result, list):
            all_results.extend(result)
        else:
            all_results.append(result)
    return merge_results(all_results)

def merge_results(results):
    merged = {
        "invoices": [],
        "products": [],
        "customers": [],
        "errors": []
    }

    for r in results:
        if isinstance(r, dict) and "error" in r:
            merged["errors"].append(r["error"])
            continue

        if r.get("invoice"):
            merged["invoices"].append(r.get("invoice"))
        if r.get("products"):
            merged["products"].extend(r.get("products"))
        if r.get("customer"):
            merged["customers"].append(r.get("customer"))

    return merged