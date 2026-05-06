# Technical Development Log: Invoice Extraction Pipeline

This log documents the architecture, edge cases encountered, and the engineering decisions made during the development of this extraction engine.

---

## 1. GSTIN Field Differentiation
**Problem:** Invoices often contain multiple 15-digit GSTINs (Seller and Buyer). Standard extraction patterns frequently conflate the two, leading to incorrect customer records.
**Resolution:** 
- Configured specific extraction paths to distinguish between "Seller GSTIN" (Header/Logo proximity) and "Buyer GSTIN" (Billing/Consignee section proximity).
- Segregated schema into `sellerGstin` (Invoice metadata) and `buyerGstin` (Customer profile).

## 2. Spreadsheet Summary Charges (CGST, SGST, IGST)
**Problem:** Spreadsheet data is frequently non-tabular at the footer level. Summary-level taxes (CGST, SGST, IGST) and adjustments (Round Off, Discount) often appear in arbitrary columns beneath the main product rows, causing them to be missed by standard parsers.
**Resolution:**
- Developed a multi-pass row scanner.
- Implemented keyword-based detection (CGST, SGST, Discount, Fee) to identify "Floating Charges" across all columns.
- Introduced an `isCharge` flag to separate these line items from physical inventory in the UI.

## 3. Customer Identity Merging
**Problem:** Recipient fields often contain both an individual contact name and a legal entity name. Simple extraction usually picks one, leading to data loss in the CRM.
**Resolution:**
- Implemented a consolidation rule that concatenates "Individual Name" and "Company Name" when both are present.
- This ensures full traceability for both person-of-contact and the billing entity.

## 4. Metadata Padding in Excel
**Problem:** Real-world Excel files rarely start on Row 1. Metadata (Addresses, Instructions) in the first few rows shifts the header index, breaking standard imports.
**Resolution:**
- Integrated a header discovery algorithm that scans the first 10 rows for high-probability tokens (Invoice, Qty, Total).
- The system dynamically initializes the data frame starting at the identified header index.

## 5. Human-in-the-Loop Mapping
**Problem:** Total automation on heterogeneous spreadsheet structures leads to a percentage of field-mapping errors. 
**Resolution:**
- Built an interactive Header Mapping interface.
- Before final processing, the system presents a mapping modal for column verification and manual correction.

## 6. Batch Spreadsheet Processing
**Problem:** Batch uploads containing multiple spreadsheets were being processed with a shared mapping context, or mapping was only applied to the first file.
**Resolution:**
- Created a sequential mapping queue in the frontend.
- Each spreadsheet is handled as a distinct event, ensuring unique mapping integrity for every file in a batch.

## 7. Numerical Normalization Logic
**Problem:** Inconsistent data formats (Percentage vs. Absolute values) across different invoice issuers.
**Resolution:**
- Implemented a normalization layer with a triple-logic fallback:
  - Calculation of tax amounts from line-total/unit-price deltas.
  - Expansion of split-percentage tax rates (6, 9, 14) into absolute currency values.
  - Final mathematical validation to ensure all row-level data sums precisely to the invoice total.
