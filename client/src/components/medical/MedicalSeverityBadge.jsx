// client/src/components/medical/MedicalSeverityBadge.jsx
import React from 'react';
import { InjurySeverity } from '../../utils/enums';

const map = {
  [InjurySeverity.MINOR]: { cls: 'success', label: '🟢 Minor' },
  [InjurySeverity.MODERATE]: { cls: 'warning', label: '🟡 Moderate' },
  [InjurySeverity.MAJOR]: { cls: 'orange', label: '🟠 Major' },
  [InjurySeverity.SEVERE]: { cls: 'danger', label: '🔴 Severe' },
};

export default function MedicalSeverityBadge({ severity }) {
  const m = map[severity] || { cls: 'warning', label: severity };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}
