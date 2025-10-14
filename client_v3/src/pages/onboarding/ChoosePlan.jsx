import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

const plans = [
  {
    code: "PLAYERS",
    name: "Players",
    price: "4,99€/mese",
    features: ["Gestione completa dei giocatori", "Ruoli, anagrafiche, note"],
  },
  {
    code: "PERFORMANCE",
    name: "Performance",
    price: "12,99€/mese",
    features: ["Dashboard GPS e carichi", "Analisi ACWR, trend, freshness"],
  },
  {
    code: "CONTRACTS",
    name: "Contracts",
    price: "11,99€/mese",
    features: ["Gestione contratti", "IRPEF e bonus automatici"],
  },
  {
    code: "FULL",
    name: "Full Access",
    price: "49€/mese",
    features: ["Tutti i moduli (anche in arrivo)", "Aggiornamenti inclusi"],
  },
];

export default function ChoosePlan() {
  const [selected, setSelected] = useState("PLAYERS");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const type = params.get("type") || "CLUB";

  const goNext = () => {
    navigate(`/onboarding/payment?plan=${selected}&type=${type}`);
  };

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
        className="mt-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:scale-105 transition-transform"
      >
        {type === "CLUB" ? "Procedi come Team" : "Procedi come Professionista"}
      </button>
    </div>
  );
}




