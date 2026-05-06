import React, { useState } from 'react';
import { Table, Check, AlertCircle, X } from 'lucide-react';

const STANDARD_FIELDS = [
  { key: 'customer', label: 'Customer Name' },
  { key: 'invoice_id', label: 'Invoice Serial Number' },
  { key: 'date', label: 'Invoice Date' },
  { key: 'product', label: 'Product/Item Name' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit_price', label: 'Unit Price/Rate' },
  { key: 'tax', label: 'Tax Amount/Percent' },
  { key: 'total', label: 'Total Amount' },
  { key: 'gstin', label: 'Seller GSTIN' },
  { key: 'buyer_gstin', label: 'Buyer GSTIN' },
];

export default function HeaderMapper({ data, onConfirm, onCancel }) {
  const { headers, suggestions, filename } = data;
  const [mapping, setMapping] = useState(suggestions || {});

  const handleSelect = (fieldKey, headerValue) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: headerValue === '' ? null : headerValue,
    }));
  };

  return (
    <div className="mapper-overlay">
      <div className="mapper-card">
        <div className="mapper-header">
          <div className="mapper-title">
            <Table size={20} className="text-blue" />
            <div>
              <h3>Map Excel Columns</h3>
              <p>{filename}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="mapper-body">
          <div className="mapper-info">
            <AlertCircle size={16} />
            <span>We've suggested some mappings based on your headers. Please verify or correct them below.</span>
          </div>

          <div className="mapping-grid">
            {STANDARD_FIELDS.map((field) => (
              <div key={field.key} className="mapping-row">
                <div className="field-info">
                  <label>{field.label}</label>
                  <span className="field-key">{field.key}</span>
                </div>
                <div className="select-wrapper">
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => handleSelect(field.key, e.target.value)}
                    className={mapping[field.key] ? 'select-active' : ''}
                  >
                    <option value="">-- Not Found --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  {mapping[field.key] && <Check size={14} className="check-icon" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mapper-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => onConfirm(mapping)}>
            Confirm & Extract Data
          </button>
        </div>
      </div>
    </div>
  );
}
