import React from 'react';
import { BodyPart } from '../../utils/enums';

const parts = Object.keys(BodyPart);

export default function BodyPartSelector({ value, onChange }) {
  return (
    <select className="select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">Parte del corpo…</option>
      {parts.map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
  );
}
