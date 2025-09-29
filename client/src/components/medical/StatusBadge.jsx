import React from 'react';

export default function StatusBadge({ status, type = 'default', icon, children }) {
  const getBadgeClass = (status, type) => {
    switch (type) {
      case 'success':
        return 'badge-success';
      case 'warning':
        return 'badge-warning';
      case 'danger':
        return 'badge-danger';
      case 'info':
        return 'badge-info';
      case 'neutral':
        return 'badge-neutral';
      default:
        // Auto-detect based on status
        if (status?.toLowerCase().includes('success') || status?.toLowerCase().includes('active') || status?.toLowerCase().includes('completed')) {
          return 'badge-success';
        }
        if (status?.toLowerCase().includes('warning') || status?.toLowerCase().includes('pending') || status?.toLowerCase().includes('expired')) {
          return 'badge-warning';
        }
        if (status?.toLowerCase().includes('error') || status?.toLowerCase().includes('failed') || status?.toLowerCase().includes('blocked')) {
          return 'badge-danger';
        }
        if (status?.toLowerCase().includes('info') || status?.toLowerCase().includes('processing')) {
          return 'badge-info';
        }
        return 'badge-neutral';
    }
  };

  const getStatusIcon = (status) => {
    if (icon) return icon;
    
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('success') || statusLower.includes('active') || statusLower.includes('completed')) {
      return '✅';
    }
    if (statusLower.includes('warning') || statusLower.includes('pending')) {
      return '⚠️';
    }
    if (statusLower.includes('error') || statusLower.includes('failed') || statusLower.includes('blocked')) {
      return '❌';
    }
    if (statusLower.includes('info') || statusLower.includes('processing')) {
      return 'ℹ️';
    }
    return '';
  };

  return (
    <span className={getBadgeClass(status, type)}>
      {getStatusIcon(status)}
      {children || status}
    </span>
  );
}

export function MedicalStatusBadge({ severity, status }) {
  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'minor':
        return { class: 'badge-medical-success', icon: '🟢', label: 'Minor' };
      case 'moderate':
        return { class: 'badge-medical-warning', icon: '🟡', label: 'Moderate' };
      case 'major':
        return { class: 'badge-medical-warning', icon: '🟠', label: 'Major' };
      case 'severe':
        return { class: 'badge-medical-danger', icon: '🔴', label: 'Severe' };
      default:
        return { class: 'badge-neutral', icon: '⚪', label: severity || 'Unknown' };
    }
  };

  const severityInfo = getSeverityBadge(severity);
  
  return (
    <span className={severityInfo.class}>
      <span>{severityInfo.icon}</span>
      <span>{severityInfo.label}</span>
    </span>
  );
}

export function ConsentStatusBadge({ status }) {
  const getConsentBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'granted':
        return { class: 'badge-success', icon: '✅', label: 'Concesso' };
      case 'pending':
        return { class: 'badge-warning', icon: '⏳', label: 'In Attesa' };
      case 'refused':
        return { class: 'badge-danger', icon: '❌', label: 'Rifiutato' };
      case 'withdrawn':
        return { class: 'badge-warning', icon: '🔄', label: 'Revocato' };
      case 'expired':
        return { class: 'badge-danger', icon: '⏰', label: 'Scaduto' };
      default:
        return { class: 'badge-neutral', icon: '❓', label: status || 'Sconosciuto' };
    }
  };

  const consentInfo = getConsentBadge(status);
  
  return (
    <span className={consentInfo.class}>
      <span>{consentInfo.icon}</span>
      <span>{consentInfo.label}</span>
    </span>
  );
}



