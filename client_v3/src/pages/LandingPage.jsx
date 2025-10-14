import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, Zap, BarChart3, Shield, Users, Building2 } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("CLUB"); // CLUB o INDIVIDUAL

  const handleChoosePlan = (planCode) => {
    // Salta wizard: vai direttamente alla registrazione con piano e tipo scelti
    navigate(`/onboarding/setup?plan=${planCode}&type=${userType}`);
  };

  const plans = [
    {
      code: "PLAYERS",
      name: "Players",
      price: "4,99€ / mese",
      description: "Gestione anagrafiche e schede giocatori.",
      status: "active",
      features: [
        "Gestione completa dei giocatori",
        "Foto, ruoli, anagrafiche, note",
        "Adatto a Team e Professionisti",
      ],
      icon: <Users className="w-8 h-8 text-blue-400" />,
    },
    {
      code: "PERFORMANCE",
      name: "Performance",
      price: "12,99€ / mese",
      description: "Dashboard GPS, carichi e trend.",
      status: "active",
      features: [
        "Analisi carichi ACWR e Monotony",
        "Integrazione GPS",
        "Dashboard grafiche per giocatori",
      ],
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
    },
    {
      code: "CONTRACTS",
      name: "Contracts",
      price: "11,99€ / mese",
      description: "Gestione contratti, IRPEF e bonus.",
      status: "active",
      features: [
        "Gestione contratti e scadenze",
        "Calcolo netto/lordo automatico",
        "Supporto L.207/24 e bonus",
      ],
      icon: <Building2 className="w-8 h-8 text-green-400" />,
    },
    {
      code: "FULL",
      name: "Full Access",
      price: "49€ / mese",
      description: "Tutti i moduli, inclusi quelli in arrivo.",
      status: "active",
      features: [
        "Accesso completo a tutti i moduli",
        "Dashboard unificata",
        "Aggiornamenti inclusi",
      ],
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
    },
    {
      code: "MEDICAL",
      name: "Medical",
      price: "7,99€ / mese",
      description: "Area medica e cartelle cliniche.",
      status: "coming",
      features: ["Referti clinici", "GDPR Log", "Statistiche sanitarie"],
      icon: <Shield className="w-8 h-8 text-red-400" />,
    },
    {
      code: "SCOUTING",
      name: "Scouting",
      price: "4,99€ / mese",
      description: "Analisi e schede talenti.",
      status: "coming",
      features: ["Target giocatori", "Report scouting", "Analisi performance"],
      icon: <Users className="w-8 h-8 text-orange-400" />,
    },
    {
      code: "MARKET",
      name: "Market",
      price: "9,99€ / mese",
      description: "Gestione budget e trattative.",
      status: "coming",
      features: ["Gestione offerte", "Analisi economiche", "Dashboard mercato"],
      icon: <Shield className="w-8 h-8 text-green-400" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111827] to-[#1e1b4b] text-white px-6 py-20">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-6">
          Soccer X Pro — La piattaforma modulare per il calcio professionale
        </h1>
        <p className="text-lg text-white/70 max-w-3xl mx-auto">
          Che tu sia un <span className="text-blue-400 font-semibold">Team</span> o un{" "}
          <span className="text-purple-400 font-semibold">Professionista</span>, scegli i moduli che ti servono e costruisci la tua piattaforma personalizzata.
        </p>
      </div>

      {/* SWITCH tipo utente */}
      <div className="flex justify-center mb-10">
        <div className="bg-white/10 border border-white/20 rounded-full flex gap-4 p-2">
          <button
            onClick={() => setUserType("CLUB")}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              userType === "CLUB" ? "bg-blue-600" : "hover:bg-white/10"
            }`}
          >
            Team / Club
          </button>
          <button
            onClick={() => setUserType("INDIVIDUAL")}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              userType === "INDIVIDUAL" ? "bg-purple-600" : "hover:bg-white/10"
            }`}
          >
            Professionista
          </button>
        </div>
      </div>

      {/* LISTA PIANI */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((p) => (
          <div
            key={p.code}
            className={`relative p-6 rounded-2xl border backdrop-blur-md transition-all ${
              p.status === "active"
                ? "border-white/20 hover:border-blue-400/50 bg-white/5 hover:bg-white/10"
                : "border-white/10 bg-white/5 opacity-50"
            }`}
          >
            <div className="mb-4 flex justify-center">{p.icon}</div>
            <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
            <p className="text-blue-400 font-semibold mb-1">{p.price}</p>
            <p className="text-white/70 mb-4">{p.description}</p>
            <ul className="space-y-2 text-sm text-white/70 mb-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-400 w-4 h-4" /> {f}
                </li>
              ))}
            </ul>
            {p.status === "active" ? (
              <button
                onClick={() => handleChoosePlan(p.code)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full font-semibold hover:scale-105 transition-transform"
              >
                {userType === "CLUB" ? "Attiva per il mio Club" : "Attiva per me"}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3 bg-gray-600/50 rounded-full font-semibold cursor-not-allowed"
              >
                🚧 In sviluppo
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



