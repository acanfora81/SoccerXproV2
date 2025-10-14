import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Payment() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [paying, setPaying] = useState(false);
  const [planDetails, setPlanDetails] = useState(null);

  const plan = params.get("plan") || "PLAYERS";
  const teamId = params.get("teamId");

  // Carica dettagli del piano
  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/plans/${plan}`);
        if (response.ok) {
          const data = await response.json();
          setPlanDetails(data.plan);
        }
      } catch (error) {
        console.error('Errore caricamento piano:', error);
      }
    };
    
    if (plan) {
      fetchPlanDetails();
    }
  }, [plan]);

  const handlePay = async () => {
    try {
      setPaying(true);
      await fetch("http://localhost:3001/api/subscription/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          teamId,
          plan: plan,
          // TODO: recuperare planId e modules dal team o dal piano selezionato
        })
      });
      navigate("/login?paid=success", { replace: true });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111827] to-[#1e1b4b] text-white px-6 py-16">
      <div className="max-w-xl mx-auto p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur">
        <h1 className="text-2xl font-bold mb-2">Pagamento abbonamento</h1>
        <p className="text-white/70 mb-6">Piano selezionato: <span className="font-semibold text-blue-300">{plan}</span></p>

        <div className="space-y-2 text-sm text-white/80 mb-6">
          <div className="flex justify-between"><span>Team</span><span className="text-white/90">{teamId || '—'}</span></div>
          <div className="flex justify-between"><span>Totale</span><span className="font-semibold">
            {planDetails && planDetails.price_monthly != null
              ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(planDetails.price_monthly) + '/mese'
              : '—'}
          </span></div>
        </div>

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transition-all disabled:opacity-60"
        >
          {paying ? "Elaborazione pagamento…" : "Procedi al pagamento"}
        </button>

        <p className="text-xs text-white/50 mt-4">Simulazione pagamento. Collega Stripe per il checkout reale.</p>
      </div>
    </div>
  );
}



