import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "@/store/authStore";

export default function SetupTeam() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const plan = params.get("plan") || "PLAYERS";

  const { registerUnified } = useAuthStore();

  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const isIndividual = params.get("type") === "INDIVIDUAL";
      const finalTeamName = isIndividual
        ? `${firstName} ${lastName}`
        : teamName;

      // Usa direttamente il piano reale (es. PLAYERS, PERFORMANCE, CONTRACTS, FULL)
      const serverPlan = plan;

      const res = await registerUnified({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        teamName: finalTeamName,
        plan: serverPlan,
        type: isIndividual ? "PERSONAL" : "CLUB",
        vatNumber,
        address,
        phone,
      });

      if (res?.redirect) {
        navigate(res.redirect, { replace: true });
      }
    } catch (err) {
      setError(err.message || "Errore durante la creazione del team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111827] to-[#1e1b4b] text-white px-6 py-16">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Completa registrazione</h1>
        <p className="text-white/70 mb-6">Piano selezionato: {plan}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {params.get("type") !== "INDIVIDUAL" && (
            <input
              type="text"
              placeholder="Nome del Team"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:border-blue-400 placeholder:text-white/50"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nome"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:border-blue-400 placeholder:text-white/50"
            />
            <input
              type="text"
              placeholder="Cognome"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:border-blue-400 placeholder:text-white/50"
            />
          </div>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:border-blue-400 placeholder:text-white/50"
          />

          {params.get("type") !== "INDIVIDUAL" && (
            <>
              <input
                type="text"
                placeholder="Partita IVA *"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:border-blue-400 placeholder:text-white/50"
              />

              <input
                type="text"
                placeholder="Indirizzo"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:border-blue-400 placeholder:text-white/50"
              />

              <input
                type="tel"
                placeholder="Telefono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:border-blue-400 placeholder:text-white/50"
              />
            </>
          )}

          <input
            type="password"
            placeholder="Password (min 6 caratteri)"
            value={password}
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:border-blue-400 placeholder:text-white/50"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.02] transition-all disabled:opacity-60"
          >
            {isLoading ? "Creazione in corso…" : "Crea account e procedi al pagamento"}
          </button>
        </form>
      </div>
    </div>
  );
}


