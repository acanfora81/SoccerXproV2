import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function ChoosePlan() {
  const [plans, setPlans] = useState(null);
  const [selected, setSelected] = useState('BASIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/onboarding/plans');
        const json = await res.json();
        if (!json.success) throw new Error('Errore caricamento piani');
        setPlans(json.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const goNext = () => {
    const params = new URLSearchParams({ plan: selected });
    window.location.href = `/onboarding/payment?${params.toString()}`;
  };

  if (loading) return <div className="statistics-container"><div className="upload-card">Caricamento piani...</div></div>;
  if (error) return <div className="statistics-container"><div className="upload-error">{error}</div></div>;

  return (
    <div className="statistics-container">
      <div className="import-wizard-header">
        <div className="header-content">
          <div className="header-title">
            <CheckCircle size={28} color="#3B82F6" />
            <div>
              <h1>Scegli il piano</h1>
              <p>Seleziona il pacchetto più adatto prima di procedere al pagamento</p>
            </div>
          </div>
        </div>
      </div>

      <div className="upload-step-container">
        <div className="upload-card">
          {!plans ? (
            <div>Caricamento...</div>
          ) : (
            <div style={{ display:'grid', gap:16 }}>
              {Object.entries(plans).map(([key, p]) => (
                <label key={key} style={{ border:'2px solid var(--border-color)', borderRadius:8, padding:16, display:'flex', alignItems:'center', gap:12 }}>
                  <input type="radio" name="plan" value={key} checked={selected===key} onChange={()=>setSelected(key)} />
                  <div>
                    <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{p.name} ({key})</div>
                    <div style={{ opacity:0.8 }}>{p.price}</div>
                    <div style={{ fontSize:12, opacity:0.7 }}>{(p.features||[]).join(' • ')}</div>
                  </div>
                </label>
              ))}
              <div className="upload-actions">
                <button className="btn btn-primary" onClick={goNext}><ArrowRight size={16}/> Procedi al pagamento</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


