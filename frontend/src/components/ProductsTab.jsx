import { useSelector, useDispatch } from 'react-redux';
import { updateProduct } from '../store/invoiceSlice';
import { AlertCircle } from 'lucide-react';

function MissingCell({ value, children }) {
  const missing = value == null || value === '' || value === 'null';
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

export default function ProductsTab() {
  const products = useSelector((s) => s.invoice.products);
  const dispatch = useDispatch();

  if (products.length === 0) {
    return <p className="empty-msg">No products yet. Upload files to get started.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table" id="products-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Customer</th>
            <th>Quantity</th>
            <th>Unit Price (₹)</th>
            <th>Tax (₹)</th>
            <th>Price with Tax (₹)</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={i}>
              <MissingCell value={p.name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    className="cell-input"
                    value={p.name || ''}
                    onChange={(e) =>
                      dispatch(updateProduct({ index: i, field: 'name', value: e.target.value }))
                    }
                  />
                  {p.isCharge && <span className="charge-badge">Charge</span>}
                </div>
              </MissingCell>
              <MissingCell value={p.customerName}>
                <span className="customer-chip">{p.customerName || 'Unknown'}</span>
              </MissingCell>
              <MissingCell value={p.quantity}>
                <input
                  className="cell-input cell-input--num"
                  type="number"
                  value={p.quantity ?? ''}
                  onChange={(e) =>
                    dispatch(updateProduct({ index: i, field: 'quantity', value: Number(e.target.value) }))
                  }
                />
              </MissingCell>
              <MissingCell value={p.unitPrice}>
                {p.unitPrice != null ? `₹${Number(p.unitPrice).toLocaleString('en-IN')}` : null}
              </MissingCell>
              <MissingCell value={p.tax}>
                {p.tax != null ? (typeof p.tax === 'string' ? p.tax : `₹${Number(p.tax).toLocaleString('en-IN')}`) : null}
              </MissingCell>
              <MissingCell value={p.priceWithTax}>
                {p.priceWithTax != null ? `₹${Number(p.priceWithTax).toLocaleString('en-IN')}` : null}
              </MissingCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
