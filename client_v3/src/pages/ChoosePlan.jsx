import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

const plans = [
  { 
    code: "BASIC", 
    name: "Basic", 
    price: "Gratis", 
    features: ["Dashboard base", "Gestione giocatori", "Contratti base", "Statistiche essenziali", "Supporto community"] 
  },
  { 
    code: "PROFESSIONAL", 
    name: "Professional", 
    price: "29€/mese", 
    features: ["Analytics avanzate", "Report personalizzati", "Performance tracking", "Supporto prioritario", "Integrazione GPS"] 
  },
  { 
    code: "PREMIUM", 
    name: "Premium", 
    price: "59€/mese", 
    features: ["Analytics predittive", "Report avanzati", "API accesso", "Training AI insights"] 
  },
  { 
    code: "ENTERPRISE", 
    name: "Enterprise", 
    price: "Custom", 
    features: ["API completa", "Supporto dedicato", "White-label option", "SLA garantito"] 
  },
];

export default function ChoosePlan() {
  const [selected, setSelected] = useState("BASIC");
  const navigate = useNavigate();

  const goNext = () => navigate(`/onboarding/payment?plan=${selected}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111827] to-[#1e1b4b] text-white flex flex-col items-center justify-center px-6 py-20">
      <h2 className="text-4xl font-bold mb-8 text-blue-400">Scegli il tuo piano</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl">
        {plans.map((p) => (
          <div
            key={p.code}
            onClick={() => setSelected(p.code)}
            className={`cursor-pointer border-2 rounded-2xl p-6 text-center transition-all duration-300 backdrop-blur-lg ${
              selected === p.code
                ? "border-blue-500 bg-blue-500/10 scale-105"
                : "border-white/20 hover:border-blue-400/70"
            }`}
          >
            <h3 className="text-2xl font-semibold text-blue-400 mb-2">{p.name}</h3>
            <p className="text-lg font-bold mb-4">{p.price}</p>
            <ul className="space-y-2 text-sm text-white/80">
              {p.features.map((f) => (
                <li key={f} className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="text-green-400 w-4 h-4" /> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <button
        onClick={goNext}
        className="mt-12 btn btn-primary bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:scale-105 transition-transform"
      >
        Procedi al pagamento
      </button>
    </div>
  );
}
