# Swipe Invoice Parser

A React application for automated extraction, processing, and management of invoice data from various file formats. The app organizes extracted data into three synchronized sections — **Invoices**, **Products**, and **Customers** — with real-time updates powered by Redux.

Built with **FastAPI**, **React 18 (Redux Toolkit)**, **Google Gemini 1.5 Flash**, and **Llama 3.3 (via Groq)**.

## Features

### AI-Powered Data Extraction
- **PDF & Image OCR**: Extracts structured data from invoices, receipts, and handwritten documents using Gemini 1.5 Flash.
- **Dynamic Spreadsheet Mapping**: Automated column-header mapping for non-standard Excel/CSV files using Llama 3.3.
- **Human-in-the-Loop Verification**: Interactive mapping modal for manual column verification before final processing.

### Data Normalization
- **Multi-Logic Tax Calculation**: Handles percentage-based rates, absolute values, and split taxes (CGST + SGST).
- **Floating Charge Detection**: Identifies non-tabular charges (CGST, SGST, Shipping, Discount) via keyword scanning and tags them with an `isCharge` flag.
- **Identity Consolidation**: Merges individual contact names and company entities into unified customer records.
- **Smart Header Discovery**: Scans the first 10 rows of spreadsheets for financial keywords to locate the actual header row, bypassing metadata noise.

### Cross-Tab Real-Time Sync
- Changes made in any tab (Invoices, Products, Customers) are **automatically reflected across all other tabs** in real time via Redux.
- Editing a Customer Name in the Customers tab updates the corresponding entries in both the Invoices and Products tabs instantly.

### Validation & Missing Field Highlighting
- Missing or absent fields are visually flagged with an orange **"Missing"** badge across all tabs.
- Each extracted object carries a `_missing` array identifying fields genuinely absent from the source document.

### Financial Integrity
- **Bank Detail Capture**: Extraction of Bank Names, Account Numbers, and IFSC codes from seller payment sections.
- **GSTIN Tracking**: Differentiation between Seller GSTIN (invoice header) and Buyer GSTIN (consignee section).
- **Currency Cleaning**: Automatic removal of symbols (₹, $, €) for data consistency.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18+, Redux Toolkit, Vanilla CSS, Lucide-React |
| Backend | FastAPI, Python 3.9+, Pandas |
| AI Models | Gemini 1.5 Flash (PDF/Image extraction), Llama 3.3 via Groq (Header mapping) |

## Installation

### Prerequisites
Create a `.env` file in the `backend/` directory:
```
gemini_key_paid=your_gemini_api_key
gemini_key=your_backup_gemini_key
groq_key=your_groq_api_key
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Test Cases

The `/snapshots` directory contains visual extraction results for all 5 assignment test cases:

### Test Case 1: Invoice PDFs
**Invoices:**
![Invoices Tab](snapshots/testcase%201/invoices_tab.png)
**Products & Charges:**
![Products Tab](snapshots/testcase%201/products_tab.png)
**Customers:**
![Customers Tab](snapshots/testcase%201/customers_tab.png)

### Test Case 2: Invoice PDFs + Image
**Invoices:**
![Invoices Tab](snapshots/testcase%202/Invoice_tab.png)
**Products & Charges:**
![Products Tab](snapshots/testcase%202/Product_tab.png)
**Customers:**
![Customers Tab](snapshots/testcase%202/Customer_tab.png)

### Test Case 3: Excel File
**Invoices:**
![Invoices Tab](snapshots/testcase%203/invoice_tab.png)
**Products & Charges:**
![Products Tab](snapshots/testcase%203/products_tab.png)
**Customers:**
![Customers Tab](snapshots/testcase%203/customer_tab.png)

### Test Case 4: Excel Files
**Invoices:**
![Invoices Tab](snapshots/testcase%204/Invoice_tab.png)
**Products & Charges:**
![Products Tab](snapshots/testcase%204/products_tab.png)
**Customers:**
![Customers Tab](snapshots/testcase%204/Customers.png)

### Test Case 5: All File Types (PDFs + Images + Excel)
**Invoices:**
![Invoices Tab](snapshots/testcase%205/invoice_tab.png)
**Products & Charges:**
![Products Tab](snapshots/testcase%205/Product_tab.png)
**Customers:**
![Customers Tab](snapshots/testcase%205/Customers_tab.png)

## License
MIT
