import React, { useEffect, useState, useMemo } from "react";
import { UserPlus, Loader2, Lock, Plus, UploadCloud } from "lucide-react";
import apiFetch from "@/utils/apiFetch";

/**
 * PlayerCreateDialog – versione "PRO Edition"
 * - Tab multipli (Generali / Contratto / Allegati)
 * - Se Contratti non abilitato, mostra messaggio premium
 * - Se Contratti attivo, mostra toggle "Crea subito contratto"
 * - Redirect automatico a /contracts/new?playerId=... dopo salvataggio
 */

async function detectContractsAvailable() {
  try {
    const res = await apiFetch("/contracts/health");
    return !!res;
  } catch {
    const flag = import.meta.env.VITE_FEATURE_CONTRACTS;
    return String(flag).toLowerCase() === "true";
  }
}

function LockedTab({ title, description, upgradeUrl }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-gray-50">
      <div className="rounded-full bg-blue-100 p-3 mb-3">
        <Lock className="h-5 w-5 text-blue-600" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 max-w-sm">
        {description}
      </p>
      <a
        href={upgradeUrl}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
      >
        Scopri i piani PRO
      </a>
    </div>
  );
}

export default function PlayerCreateDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [contractsEnabled, setContractsEnabled] = useState(false);
  const [createContractAfter, setCreateContractAfter] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // campi generali
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [dateOfBirth, setDob] = useState("");
  const [nationality, setNat] = useState("");
  const [shirtNumber, setShirt] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [preferredFoot, setFoot] = useState("");

  const canSave = useMemo(
    () => firstName.trim() && lastName.trim() && position.trim(),
    [firstName, lastName, position]
  );

  useEffect(() => {
    (async () => {
      const ok = await detectContractsAvailable();
      setContractsEnabled(ok);
    })();
  }, []);

  const reset = () => {
    setFirstName("");
    setLastName("");
    setPosition("");
    setDob("");
    setNat("");
    setShirt("");
    setHeight("");
    setWeight("");
    setFoot("");
    setCreateContractAfter(false);
    setError("");
    setActiveTab("general");
  };

  const onSubmit = async () => {
    if (!canSave) {
      setError("Compila Nome, Cognome e Ruolo.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        firstName,
        lastName,
        position,
        dateOfBirth,
        nationality,
        shirtNumber: shirtNumber ? Number(shirtNumber) : null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        preferredFoot
      };

      const res = await apiFetch("/players", {
        method: "POST",
        body: payload
      });

      const created = res.data || res;
      onCreated?.(created);
      setOpen(false);
      reset();

      if (createContractAfter && contractsEnabled && created?.id) {
        window.location.href = `/app/dashboard/contracts/new?playerId=${created.id}`;
      }
    } catch (e) {
      setError(e.message || "Errore salvataggio giocatore");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
      >
        <UserPlus className="h-4 w-4" />
        <span className="hidden sm:inline">Aggiungi</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => setOpen(false)}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Nuovo giocatore</h2>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === "general"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Dati Generali
            </button>
            <button
              onClick={() => setActiveTab("contract")}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === "contract"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Contratto
            </button>
            <button
              onClick={() => setActiveTab("attachments")}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === "attachments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Allegati
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* TAB DATI GENERALI */}
          {activeTab === "general" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Cognome *"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Ruolo (es. Difensore) *"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  placeholder="Data di nascita"
                  value={dateOfBirth}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Nazionalità"
                  value={nationality}
                  onChange={(e) => setNat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Numero maglia"
                  value={shirtNumber}
                  onChange={(e) => setShirt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Altezza (cm)"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Peso (kg)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={preferredFoot}
                  onChange={(e) => setFoot(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2"
                >
                  <option value="">Piede preferito</option>
                  <option value="LEFT">Sinistro</option>
                  <option value="RIGHT">Destro</option>
                  <option value="BOTH">Entrambi</option>
                </select>
              </div>

              {contractsEnabled && (
                <div className="mt-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="scale-110"
                      checked={createContractAfter}
                      onChange={(e) => setCreateContractAfter(e.target.checked)}
                    />
                    Crea subito un contratto dopo il salvataggio
                  </label>
                  <div className="text-xs text-gray-600 mt-1">
                    Dopo il salvataggio verrai reindirizzato alla pagina "Nuovo Contratto".
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTRATTO */}
          {activeTab === "contract" && (
            <div>
              {contractsEnabled ? (
                <div className="text-sm text-gray-600 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  I dati contrattuali verranno gestiti direttamente nel modulo Contratti,
                  dove potrai definire durata, stipendio, clausole e bonus.
                </div>
              ) : (
                <LockedTab
                  title="Modulo Contratti non attivo"
                  description="Gestisci stipendi, bonus e scadenze dei giocatori con il modulo Contratti PRO."
                  upgradeUrl="/pricing?feature=contracts"
                />
              )}
            </div>
          )}

          {/* TAB ALLEGATI */}
          {activeTab === "attachments" && (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-gray-200 rounded-lg bg-gray-50">
              <UploadCloud className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-sm text-gray-600">
                Caricamento foto profilo e documenti disponibile nella scheda del giocatore dopo il salvataggio.
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-4">
            <div className="text-red-600 text-sm border border-red-200 rounded-lg p-2 bg-red-50">
              {error}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSave || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Aggiungi
          </button>
        </div>
      </div>
    </div>
  );
}
