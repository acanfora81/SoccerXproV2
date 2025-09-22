import React, { useMemo, useState } from 'react';
import { Building2, Save } from 'lucide-react';

export default function SetupTeam() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const plan = params.get('plan') || 'BASIC';
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setOk(false);
    if (!teamName || !email) { setError('Inserisci nome team ed email'); return; }
    try {
      setLoading(true);
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, teamName, plan, firstName, lastName })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Errore onboarding');
      setOk(true);
      // redirect alla dashboard
      setTimeout(()=>{ window.location.href = '/dashboard'; }, 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="statistics-container">
      <div className="import-wizard-header">
        <div className="header-content">
          <div className="header-title">
            <Building2 size={28} color="#3B82F6" />
            <div>
              <h1>Crea la tua Squadra</h1>
              <p>Attiva il piano {plan} creando il tuo Team</p>
            </div>
          </div>
        </div>
      </div>
      <div className="upload-step-container">
        <div className="upload-card">
          <form onSubmit={submit} style={{ display:'grid', gap:12 }}>
            <div className="input-group">
              <label>Nome Team</label>
              <input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Es. Vis Pesaro" />
            </div>
            <div className="input-group">
              <label>Email amministratore</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@team.it" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="input-group">
                <label>Nome</label>
                <input value={firstName} onChange={e=>setFirstName(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Cognome</label>
                <input value={lastName} onChange={e=>setLastName(e.target.value)} />
              </div>
            </div>
            {error && <div className="upload-error">{error}</div>}
            {ok && <div className="headers-preview"><div className="headers-summary"><strong>Team creato! Reindirizzamento...</strong></div></div>}
            <div className="upload-actions">
              <button className="btn btn-primary" disabled={loading}><Save size={16}/> Crea Team</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



