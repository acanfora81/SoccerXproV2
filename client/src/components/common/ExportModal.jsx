import React from 'react';
import '../../styles/export-modal.css';

const ExportModal = ({ 
  show, 
  exportFormat, 
  setExportFormat, 
  onConfirm, 
  onCancel 
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content export-modal">
        <div className="modal-header">
          <h3 className="modal-title">Esporta Dati</h3>
          <button 
            type="button"
            className="modal-close"
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="export-options">
            <label className="export-option">
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <span className="radio-custom"></span>
              <div className="option-content">
                <div className="option-title">CSV (.csv)</div>
                <div className="option-description">Formato semplice, compatibile con Excel</div>
              </div>
            </label>
            <label className="export-option">
              <input
                type="radio"
                name="exportFormat"
                value="excel"
                checked={exportFormat === 'excel'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <span className="radio-custom"></span>
              <div className="option-content">
                <div className="option-title">Excel (.xlsx)</div>
                <div className="option-description">Formato nativo Excel con formattazione</div>
              </div>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            type="button"
            className="btn-cancel"
            onClick={onCancel}
          >
            Annulla
          </button>
          <button 
            type="button"
            className="btn-export"
            onClick={onConfirm}
          >
            Esporta
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
