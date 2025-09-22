import React, { useMemo } from 'react';
import { CreditCard, Check } from 'lucide-react';

export default function PaymentSim() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const plan = params.get('plan') || 'BASIC';

  const simulate = () => {
    const ok = true; // simulazione pago OK
    if (!ok) return alert('Pagamento fallito (simulazione)');
    const q = new URLSearchParams({ plan });
    window.location.href = `/onboarding/setup-team?${q.toString()}`;
  };

  return (
    <div className="statistics-container">
      <div className="import-wizard-header">
        <div className="header-content">
          <div className="header-title">
            <CreditCard size={28} color="#3B82F6" />
            <div>
              <h1>Pagamento (simulazione)</h1>
              <p>Completa il pagamento per attivare il piano {plan}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="upload-step-container">
        <div className="upload-card" style={{ textAlign:'center' }}>
          <p>Qui ci sarà il provider di pagamento. Per ora clicca “Paga ora (simulato)”.</p>
          <button className="btn btn-primary" onClick={simulate}><Check size={16}/> Paga ora (simulato)</button>
        </div>
      </div>
    </div>
  );
}



