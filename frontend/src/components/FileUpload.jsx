import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, FileText, Image, Table, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { setLoading, setData } from '../store/invoiceSlice';

import HeaderMapper from './HeaderMapper';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const fileIcons = {
  pdf: <FileText size={20} />,
  image: <Image size={20} />,
  excel: <Table size={20} />,
};

function getFileType(name) {
  const ext = name.toLowerCase();
  if (ext.endsWith('.pdf')) return 'pdf';
  if (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png')) return 'image';
  if (ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.csv')) return 'excel';
  return 'unknown';
}

export default function FileUpload() {
  const dispatch = useDispatch();
  const loading = useSelector((s) => s.invoice.loading);
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState(null); 
  const [mappingData, setMappingData] = useState(null); 
  const [processedResults, setProcessedResults] = useState({ invoices: [], products: [], customers: [], errors: [] });
  const [excelQueue, setExcelQueue] = useState([]); 

  const onDrop = useCallback((accepted) => {
    setFiles((prev) => [...prev, ...accepted]);
    setStatus(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
  });

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    dispatch(setLoading(true));
    setStatus(null);
    setProcessedResults({ invoices: [], products: [], customers: [], errors: [] });

    const excels = files.filter(f => getFileType(f.name) === 'excel');
    const others = files.filter(f => getFileType(f.name) !== 'excel');

    if (excels.length > 0) {
      setExcelQueue(excels);
      await startNextExcelMapping(excels[0]);
    } else {
      await processOtherFiles(others);
    }
  };

  const startNextExcelMapping = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API_URL}/inspect-excel`, formData);
      setMappingData(res.data);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleManualMapConfirm = async (confirmedMapping) => {
    dispatch(setLoading(true));
    const currentExcel = excelQueue[0];
    setMappingData(null);
    
    try {
      const formData = new FormData();
      formData.append('file', currentExcel);
      formData.append('mapping', JSON.stringify(confirmedMapping));

      const res = await axios.post(`${API_URL}/upload-excel-with-map`, formData);
      const data = Array.isArray(res.data) ? res.data : [res.data];
      
      const newResults = { ...processedResults };
      data.forEach(r => {
        if (r.invoice) newResults.invoices.push(r.invoice);
        if (r.products) newResults.products.push(...r.products);
        if (r.customer) newResults.customers.push(r.customer);
        if (r.error) newResults.errors.push(r.error);
      });
      setProcessedResults(newResults);

      const nextQueue = excelQueue.slice(1);
      setExcelQueue(nextQueue);

      if (nextQueue.length > 0) {
        await startNextExcelMapping(nextQueue[0]);
      } else {
        
        const others = files.filter(f => getFileType(f.name) !== 'excel');
        await processOtherFiles(others, newResults);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      dispatch(setLoading(false));
    }
  };

  const processOtherFiles = async (others, existingResults = null) => {
    const finalData = existingResults || { invoices: [], products: [], customers: [], errors: [] };
    
    try {
      if (others.length > 0) {
        const formData = new FormData();
        others.forEach(f => formData.append('files', f));
        const res = await axios.post(`${API_URL}/upload-multiple`, formData);
        
        finalData.invoices.push(...(res.data.invoices || []));
        finalData.products.push(...(res.data.products || []));
        finalData.customers.push(...(res.data.customers || []));
        finalData.errors.push(...(res.data.errors || []));
      }

      dispatch(setData(finalData));
      setStatus('success');
      setFiles([]);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="upload-section">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone--active' : ''}`}
        id="file-dropzone"
      >
        <input {...getInputProps()} />
        <Upload size={36} strokeWidth={1.5} className="dropzone-icon" />
        <p className="dropzone-title">
          {isDragActive ? 'Drop files here…' : 'Drag & drop invoices here'}
        </p>
        <p className="dropzone-hint">PDF, Images (JPG / PNG), Excel (XLSX / XLS)</p>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div key={i} className="file-chip">
              {fileIcons[getFileType(f.name)] || <FileText size={16} />}
              <span className="file-chip-name">{f.name}</span>
              <button className="file-chip-remove" onClick={() => removeFile(i)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        id="upload-btn"
        className="btn-upload"
        onClick={handleUpload}
        disabled={files.length === 0 || loading}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="spin" /> Processing…
          </>
        ) : (
          <>
            <Upload size={18} /> Extract Data ({files.length} file{files.length !== 1 ? 's' : ''})
          </>
        )}
      </button>

      {status === 'success' && (
        <div className="status-msg status-success">
          <CheckCircle2 size={16} /> Data extracted successfully!
        </div>
      )}
      {status === 'error' && (
        <div className="status-msg status-error">
          <AlertCircle size={16} /> Upload failed. Check console for details.
        </div>
      )}

      {mappingData && (
        <HeaderMapper
          data={mappingData}
          onConfirm={handleManualMapConfirm}
          onCancel={() => setMappingData(null)}
        />
      )}
    </div>
  );
}
