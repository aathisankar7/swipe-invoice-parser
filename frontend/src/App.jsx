import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FileText, Package, Users, AlertTriangle, Sparkles } from 'lucide-react';
import { clearData } from './store/invoiceSlice';
import FileUpload from './components/FileUpload';
import InvoicesTab from './components/InvoicesTab';
import ProductsTab from './components/ProductsTab';
import CustomersTab from './components/CustomersTab';
import swipeLogo from './assets/swipe-logo.svg';
import './App.css';

const TABS = [
  { id: 'invoices', label: 'Invoices', icon: <FileText size={16} /> },
  { id: 'products', label: 'Products', icon: <Package size={16} /> },
  { id: 'customers', label: 'Customers', icon: <Users size={16} /> },
];

function App() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('invoices');
  const errors = useSelector((s) => s.invoice.errors);
  const invoices = useSelector((s) => s.invoice.invoices);
  const products = useSelector((s) => s.invoice.products);
  const customers = useSelector((s) => s.invoice.customers);

  return (
    <div className="app">
      {}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <img src={swipeLogo} alt="Swipe" style={{ height: '32px' }} />
          </div>
          <div className="header-stats">
            <span className="stat">
              <FileText size={14} /> {invoices.length} Invoices
            </span>
            <span className="stat">
              <Package size={14} /> {products.length} Products
            </span>
            <span className="stat">
              <Users size={14} /> {customers.length} Customers
            </span>
            {(invoices.length > 0 || products.length > 0) && (
              <button className="btn-clear" onClick={() => dispatch(clearData())}>
                <AlertTriangle size={14} /> Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {}
        <div className="content-header">
          <div className="badge">
            <Sparkles size={14} />
            <span>AI-Powered Extraction</span>
          </div>
          <h1 className="main-title">Automated Data Extraction</h1>
          <p className="main-subtitle">
            Upload your invoices, receipts, and spreadsheets to magically organize your financial data into structured, editable tabs.
          </p>
        </div>

        {}
        <FileUpload />

        {}
        {errors.length > 0 && (
          <div className="errors-bar">
            <AlertTriangle size={16} />
            <span>{errors.length} error(s): {errors[0]}</span>
          </div>
        )}

        {}
        <nav className="tab-bar" id="data-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              className={`tab-btn ${activeTab === t.id ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        {}
        <section className="tab-content">
          {activeTab === 'invoices' && <InvoicesTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'customers' && <CustomersTab />}
        </section>
      </main>
    </div>
  );
}

export default App;
