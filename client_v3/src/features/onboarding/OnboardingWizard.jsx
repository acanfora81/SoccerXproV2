import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import useAuthStore from "@/store/authStore";

// 🔹 Piani specifici per tipo utente
const PLANS = {
  TEAM: [
    { code: "BASIC", name: "Basic Team", price: "Gratis", features: ["25 giocatori", "Contratti base", "Statistiche essenziali"] },
    { code: "PROFESSIONAL", name: "Pro Team", price: "29€/mese", features: ["GPS tracking", "Report avanzati", "Supporto prioritario"] },
    { code: "PREMIUM", name: "Premium Team", price: "59€/mese", features: ["Analytics predittive", "Video analysis", "API"] },
    { code: "ENTERPRISE", name: "Enterprise", price: "Custom", features: ["White-label", "SLA 99.9%", "Account manager"] },
  ],
  PROFESSIONAL: [
    { code: "BASIC", name: "Basic Pro", price: "Gratis", features: ["Profilo atleta", "Statistiche essenziali"] },
    { code: "PROFESSIONAL", name: "Pro", price: "19€/mese", features: ["Piani allenamento", "Report PDF", "Supporto"] },
    { code: "PREMIUM", name: "Premium", price: "39€/mese", features: ["Insights AI", "Video breakdown", "Export dati"] },
  ],
  AGENCY: [
    { code: "PROFESSIONAL", name: "Agency Pro", price: "49€/mese", features: ["Multi-atleta", "Report negoziazione", "Documenti"] },
    { code: "PREMIUM", name: "Agency Premium", price: "79€/mese", features: ["Pipeline trattative", "API", "Report avanzati"] },
  ],
};

function PlanCard({ plan, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(plan.code)}
      className={`text-left p-5 rounded-2xl border transition-all backdrop-blur-lg w-full ${
        selected === plan.code ? "border-blue-500 bg-blue-500/10 scale-[1.02]" : "border-white/15 hover:border-blue-400/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-blue-300">{plan.name}</h3>
        <span className="text-lg font-semibold">{plan.price}</span>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" /> {f}
          </li>
        ))}
      </ul>
    </button>
  );
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isAuthenticated, logout } = useAuthStore();
  const rawType = (params.get("type") || "").toUpperCase();
  const initialType =
    rawType === "CLUB"
      ? "TEAM"
      : ["TEAM", "PROFESSIONAL", "AGENCY"].includes(rawType)
      ? rawType
      : null;
  const [step, setStep] = useState(initialType ? 2 : 1);
  const [userType, setUserType] = useState(initialType);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const availablePlans = [];

  const goToSetup = () => {
    if (!userType) return;
    navigate(`/onboarding/setup?type=${userType}`);
  };

  // Assicura contesto "guest" per onboarding (evita accesso con sessioni precedenti)
  useEffect(() => {
    if (isAuthenticated) {
      logout();
    }
  }, [isAuthenticated, logout]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111827] to-[#1e1b4b] text-white px-6 py-12 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold">Inizia in 60 secondi</h1>
          <p className="text-white/70 mt-2">Scegli chi sei → seleziona un piano → paga → registrati. Tutto qui.</p>
        </header>

        {/* STEP 1 — Tipo utente */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["TEAM", "PROFESSIONAL", "AGENCY"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setUserType(t);
                  setStep(2);
                }}
                className="p-6 border border-white/15 rounded-2xl hover:border-blue-400/60 hover:scale-[1.01] transition-all"
              >
                <div className="text-xl font-semibold mb-1">
                  {t === "TEAM" ? "Team" : t === "PROFESSIONAL" ? "Professionista" : "Agenzia"}
                </div>
                <div className="text-white/70 text-sm">
                  {t === "TEAM"
                    ? "Per società e club sportivi."
                    : t === "PROFESSIONAL"
                    ? "Per atleti, coach e preparatori."
                    : "Per agenzie e procuratori."}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2 — Selezione piano */}
        {step === 2 && userType && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {userType === "TEAM"
                  ? "Scegli un piano per il tuo Team"
                  : userType === "PROFESSIONAL"
                  ? "Scegli un piano da Professionista"
                  : "Scegli un piano per la tua Agenzia"}
              </h2>
              <button
                onClick={() => {
                  setUserType(null);
                  setSelectedPlan(null);
                  setStep(1);
                }}
                className="text-white/60 hover:text-white text-sm"
              >
                ← Cambia tipo
              </button>
            </div>

            {/* Eliminata lista piani: scelta diretta nel setup */}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                disabled={false}
                onClick={goToSetup}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 ${
                  selectedPlan
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105"
                    : "bg-white/10 opacity-60 cursor-not-allowed"
                }`}
              >
                Vai alla registrazione <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
