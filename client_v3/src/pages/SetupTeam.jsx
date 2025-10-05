import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Building2, Save, AlertCircle } from "lucide-react";
import useAuthStore from "@/store/authStore";

export default function SetupTeam() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { registerWithTeam } = useAuthStore();
  
  const plan = params.get("plan") || "BASIC";
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log('🔵 [SETUP TEAM] Invio dati registrazione...');

    try {
      await registerWithTeam({ 
        email, 
        password, 
        firstName, 
        lastName, 
        teamName, 
        plan 
      });

      console.log('🟢 [SETUP TEAM] Registrazione completata - redirect a dashboard');
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      console.log('🔴 [SETUP TEAM] Errore:', err.message);
      setError(err.message || "Errore durante la creazione del team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#111827] to-[#1e1b4b] text-white px-6">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="text-blue-400 w-7 h-7" />
          <h2 className="text-2xl font-bold">Crea la tua Squadra ({plan})</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Nome del Team"
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-blue-400 placeholder:text-white/50"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email amministratore"
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-blue-400 placeholder:text-white/50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-blue-400 placeholder:text-white/50"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nome"
              required
              className="px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-blue-400 placeholder:text-white/50"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Cognome"
              required
              className="px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-blue-400 placeholder:text-white/50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 py-3 rounded-full font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Creazione in corso...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Crea Team
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
