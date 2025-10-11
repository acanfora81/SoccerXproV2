// Percorso: client_v3/src/features/contracts/components/ContractMiniForm.jsx
import { useState } from 'react';
import { createContract } from '@/features/contracts/api/contractsApi';

export default function ContractMiniForm({ defaultValues = {}, onCreated, disabled }) {
  const [form, setForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    grossAmount: '',
    ...defaultValues
  });
  const onSubmit = async (e) => {
    e.preventDefault();
    const { data } = await createContract(form);
    onCreated?.(data.data);
  };
  const onChange = (k,v)=> setForm(s=>({ ...s, [k]: v }));
  return (
    <form onSubmit={onSubmit}>
      <input placeholder="Titolo" value={form.title} onChange={e=>onChange('title',e.target.value)} disabled={disabled}/>
      <input type="date" value={form.startDate} onChange={e=>onChange('startDate',e.target.value)} disabled={disabled}/>
      <input type="date" value={form.endDate} onChange={e=>onChange('endDate',e.target.value)} disabled={disabled}/>
      <input type="number" placeholder="Lordo annuo" value={form.grossAmount} onChange={e=>onChange('grossAmount',e.target.value)} disabled={disabled}/>
      <button type="submit" disabled={disabled}>Crea contratto</button>
    </form>
  );
}




