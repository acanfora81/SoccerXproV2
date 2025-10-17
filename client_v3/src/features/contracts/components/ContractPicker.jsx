// Percorso: client_v3/src/features/contracts/components/ContractPicker.jsx
import { useEffect, useState } from 'react';
import { listContracts } from '@/features/contracts/api/contractsApi';

export default function ContractPicker({ value, onChange }) {
  const [items, setItems] = useState([]);
  useEffect(() => { listContracts().then(({ data }) => setItems(data.data || [])); }, []);
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">— Seleziona contratto —</option>
      {items.map(c => <option key={c.id} value={c.id}>{c.title || c.id}</option>)}
    </select>
  );
}





















