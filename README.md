# Invoice AI: Automated Data Extraction Engine

A high-performance pipeline for extracting structured data from unstructured invoices (PDFs, Images) and complex spreadsheets (Excel, CSV).

The system integrates **FastAPI**, **React (Redux Toolkit)**, **Google Gemini 1.5**, and **Llama 3.3** for high-precision financial data management.

## Features

### Automated Extraction
- **Visual OCR**: High-precision extraction for PDFs and Images, including hand-written notes and complex layouts.
- **Dynamic Spreadsheet Mapping**: Automated mapping of non-standard Excel/CSV headers to a unified schema.
- **Human-in-the-Loop Verification**: Interactive mapping modal for column verification and manual correction before final data processing.

### Data Normalization
- **Multi-Logic Tax Calculation**: 
  - Automated calculation of tax amounts from unit prices and line totals.
  - Expansion of tax percentages (5%, 12%, 18%, 28%) into currency values.
  - Validation of net values against tax amounts for mathematical accuracy.
- **Floating Charge Detection**: Scans rows for service-based line items (CGST, SGST, Shipping, Round Off), automatically tagging them as non-inventory charges.
- **Identity Consolidation**: Concatenation of individual and company names to maintain comprehensive customer records.

### Financial Integrity
- **Bank Detail Capture**: Extraction of Bank Names, Account Numbers, and IFSC codes.
- **GSTIN Tracking**: Identification of 15-digit GSTINs for both Seller and Buyer.
- **Currency Cleaning**: Automatic removal of symbols (₹, $, €) and formatting for data consistency.

## Technology Stack

- **Frontend**: 
  - React 18+ / Redux Toolkit.
  - Vanilla CSS / Lucide-React.
- **Backend**: 
  - FastAPI / Python 3.9+.
  - Pandas.
- **Extraction Models**:
  - Gemini 1.5 Flash.
  - Llama 3.3 (via Groq).

## Installation

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

## Snapshots

The `/snapshots` directory contains visual extraction results for various scenarios:

### Test Case 1: Standard PDF Invoice
**Invoices:**
![Invoices Tab](snapshots/testcase%201/invoices_tab.png)
**Products & Charges:**
![Products Tab](snapshots/testcase%201/products_tab.png)
**Customers:**
![Customers Tab](snapshots/testcase%201/customers_tab.png)

### Test Case 2: Image/Receipt Capture
**Invoices:**
![Invoices Tab](snapshots/testcase%202/Invoice_tab.png)
**Products & Charges:**
![Products Tab](snapshots/testcase%202/Product_tab.png)
**Customers:**
![Customers Tab](snapshots/testcase%202/Customer_tab.png)

### Test Case 3: Complex Spreadsheet
**Invoices:**
![Invoices Tab](snapshots/testcase%203/invoice_tab.png)
**Products & Charges:**
![Products Tab](snapshots/testcase%203/products_tab.png)
**Customers:**
![Customers Tab](snapshots/testcase%203/customer_tab.png)

### Test Case 4: Floating Charges & Non-Standard Headers
**Invoices:**
![Invoices Tab](snapshots/testcase%204/Invoice_tab.png)
**Products & Charges:**
![Products Tab](snapshots/testcase%204/products_tab.png)
**Customers:**
![Customers Tab](snapshots/testcase%204/Customers.png)

### Test Case 5: Batch Spreadsheet Upload
**Invoices:**
![Invoices Tab](snapshots/testcase%205/invoice_tab.png)
**Products & Charges:**
![Products Tab](snapshots/testcase%205/Product_tab.png)
**Customers:**
![Customers Tab](snapshots/testcase%205/Customers_tab.png)

## License
MIT
