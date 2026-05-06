import { useSelector, useDispatch } from 'react-redux';
import { updateInvoice } from '../store/invoiceSlice';
import { AlertCircle } from 'lucide-react';

function fmt(val) {
  if (val == null || val === '') return null;
  return typeof val === 'number' ? val.toLocaleString('en-IN') : val;
}

function MissingCell({ value, children }) {
  const missing = value == null || value === '' || value === 'null';
  return (
    <td className={missing ? 'cell-missing' : ''}>
      {missing ? (
        <span className="missing-badge">
          <AlertCircle size={12} /> Missing
        </span>
      ) : (
        children || fmt(value)
      )}
    </td>
  );
}

export default function InvoicesTab() {
  const invoices = useSelector((s) => s.invoice.invoices);
  const products = useSelector((s) => s.invoice.products);
  const dispatch = useDispatch();

  if (invoices.length === 0) {
    return <p className="empty-msg">No invoices yet. Upload files to get started.</p>;
  }

  const getProductsForInvoice = (inv) => {
    return products.filter(
      (p) =>
        p.customerName === inv.customerName ||
        p.invoiceSerial === inv.serialNumber
    );
  };

  return (
    <div className="table-wrapper">
      <table className="data-table" id="invoices-table">
        <thead>
          <tr>
            <th>Serial Number</th>
            <th>Customer Name</th>
            <th>Product Name</th>
            <th>Qty</th>
            <th>Date</th>
            <th>Seller GSTIN</th>
            <th>Bank Details</th>
            <th>Total Amount (₹)</th>
            <th>Tax (₹)</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => {
            const invProducts = getProductsForInvoice(inv);
            const nonChargeProducts = invProducts.filter((p) => !p.isCharge);
            const productName =
              nonChargeProducts.length > 0
                ? nonChargeProducts.length === 1
                  ? nonChargeProducts[0].name
                  : `${nonChargeProducts[0].name} (+${nonChargeProducts.length - 1} more)`
                : invProducts.length > 0
                ? invProducts[0].name
                : null;
            const totalQty = invProducts.reduce(
              (sum, p) => sum + (Number(p.quantity) || 0),
              0
            );

            return (
              <tr key={i}>
                <MissingCell value={inv.serialNumber}>{inv.serialNumber}</MissingCell>
                <MissingCell value={inv.customerName}>
                  <input
                    className="cell-input"
                    value={inv.customerName || ''}
                    onChange={(e) =>
                      dispatch(updateInvoice({ index: i, field: 'customerName', value: e.target.value }))
                    }
                  />
                </MissingCell>
                <MissingCell value={productName}>{productName}</MissingCell>
                <MissingCell value={totalQty > 0 ? totalQty : null}>
                  {totalQty > 0 ? totalQty : null}
                </MissingCell>
                <MissingCell value={inv.date}>{inv.date}</MissingCell>
                <MissingCell value={inv.sellerGstin}>{inv.sellerGstin}</MissingCell>
                <MissingCell value={inv.bankDetails?.bankName}>
                  {inv.bankDetails?.bankName && (
                    <div className="bank-pill">
                      <strong>{inv.bankDetails.bankName}</strong>
                      <br />
                      <small>
                        A/C: {inv.bankDetails.accountNumber}
                        {inv.bankDetails.ifscCode && ` • IFSC: ${inv.bankDetails.ifscCode}`}
                      </small>
                    </div>
                  )}
                </MissingCell>
                <MissingCell value={inv.totalAmount}>
                  {inv.totalAmount != null ? `₹${Number(inv.totalAmount).toLocaleString('en-IN')}` : null}
                </MissingCell>
                <MissingCell value={inv.tax}>
                  {inv.tax != null ? `₹${Number(inv.tax).toLocaleString('en-IN')}` : null}
                </MissingCell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

