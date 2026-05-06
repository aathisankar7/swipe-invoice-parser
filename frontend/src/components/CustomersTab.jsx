import { useSelector, useDispatch } from 'react-redux';
import { updateCustomer } from '../store/invoiceSlice';
import { AlertCircle } from 'lucide-react';

function MissingCell({ value, children }) {
  const missing = value == null || value === '' || value === 'null' || (typeof value === 'number' && isNaN(value));
  return (
    <td className={missing ? 'cell-missing' : ''}>
      {missing ? (
        <span className="missing-badge">
          <AlertCircle size={12} /> Missing
        </span>
      ) : (
        children
      )}
    </td>
  );
}

export default function CustomersTab() {
  const customers = useSelector((s) => s.invoice.customers);
  const dispatch = useDispatch();

  if (customers.length === 0) {
    return <p className="empty-msg">No customers yet. Upload files to get started.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table" id="customers-table">
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Phone Number</th>
            <th>Buyer GSTIN</th>
            <th>Total Purchase Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, i) => (
            <tr key={i}>
              <MissingCell value={c.name}>
                <input
                  className="cell-input"
                  value={c.name || ''}
                  onChange={(e) =>
                    dispatch(updateCustomer({ index: i, field: 'name', value: e.target.value }))
                  }
                />
              </MissingCell>
              <MissingCell value={c.phone}>
                <input
                  className="cell-input"
                  value={c.phone || ''}
                  onChange={(e) =>
                    dispatch(updateCustomer({ index: i, field: 'phone', value: e.target.value }))
                  }
                />
              </MissingCell>
              <MissingCell value={c.buyerGstin}>{c.buyerGstin}</MissingCell>
              <MissingCell value={c.totalPurchaseAmount}>
                {c.totalPurchaseAmount != null
                  ? `₹${Number(c.totalPurchaseAmount).toLocaleString('en-IN')}`
                  : null}
              </MissingCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
