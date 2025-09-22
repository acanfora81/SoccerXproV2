import React from 'react';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Conferma", 
  message, 
  confirmText = "Conferma", 
  cancelText = "Annulla",
  type = "warning", // warning, danger, info, success
  children
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={24} className="confirm-icon danger" />;
      case 'info':
        return <AlertTriangle size={24} className="confirm-icon info" />;
      case 'success':
        return <CheckCircle size={24} className="confirm-icon success" />;
      default:
        return <AlertTriangle size={24} className="confirm-icon warning" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn-danger';
      case 'info':
        return 'btn-primary';
      case 'success':
        return 'btn-success';
      default:
        return 'btn-warning';
    }
  };

  return (
    <div className="confirm-overlay" onClick={handleOverlayClick}>
      <div className="confirm-dialog">
        <div className="confirm-header">
          <div className="confirm-title">
            {getIcon()}
            <span>{title}</span>
          </div>
          <button className="confirm-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="confirm-body">
          {children ? (
            children
          ) : (
            <p className="confirm-message">{message}</p>
          )}
        </div>
        
        <div className="confirm-actions">
          {cancelText && (
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}
          <button 
            className={`btn ${getButtonClass()}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
