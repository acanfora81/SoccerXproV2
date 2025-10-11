import React, { useEffect, useState, useMemo } from "react";
import {
  UserPlus,
  Loader2,
  Lock,
  UploadCloud,
  ChevronDown,
} from "lucide-react";
import Button from "@/design-system/ds/Button";
import { formatItalianCurrency } from "@/lib/utils/italianNumbers";
import apiFetch from "@/utils/apiClient";

/**
 * PlayerCreateDialog – WOW & PRO Edition
 * Dark UI premium, tab multipli, logica Contratti PRO, upload foto, badge ruolo.
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
    <div className="flex flex-col items-center justify-center py-16 text-center bg-[#111827]/80 border border-[#1f2937] rounded-2xl">
      <div className="rounded-full bg-[#2563eb]/10 p-3 mb-3">
        <Lock className="h-6 w-6 text-[#3b82f6]" />
      </div>
      <h3 className="text-base font-semibold mb-1 text-gray-100">{title}</h3>
      <p className="text-sm text-gray-400 mb-4 max-w-sm">{description}</p>
      <a
        href={upgradeUrl}
        className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-sm shadow-md transition-colors"
      >
        Scopri i piani PRO
      </a>
    </div>
  );
}

export default function PlayerCreateDialog({ player = null, onCreated, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [contractsEnabled, setContractsEnabled] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  // campi giocatore
  const [firstName, setFirstName] = useState(player?.firstName || "");
  const [lastName, setLastName] = useState(player?.lastName || "");
  const [position, setPosition] = useState(player?.position || "");
  const [dateOfBirth, setDob] = useState(player?.dateOfBirth || "");
  const [nationality, setNat] = useState(player?.nationality || "");
  const [shirtNumber, setShirt] = useState(player?.shirtNumber || "");
  const [height, setHeight] = useState(player?.height || "");
  const [weight, setWeight] = useState(player?.weight || "");
  const [preferredFoot, setFoot] = useState(player?.preferredFoot || "");
  const [marketValue, setMarketValue] = useState(player?.marketValue || "");

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

  useEffect(() => {
    if (player) {
      setFirstName(player.firstName || "");
      setLastName(player.lastName || "");
      setPosition(player.position || "");
      setDob(player.dateOfBirth?.split("T")[0] || "");
      setNat(player.nationality || "");
      setShirt(player.shirtNumber || "");
      setHeight(player.height || "");
      setWeight(player.weight || "");
      setFoot(player.preferredFoot || "");
      setMarketValue(player.marketValue || "");
      setOpen(true); // Apri automaticamente la modale quando c'è un player
    }
  }, [player]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

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
    setMarketValue("");
    setPhotoPreview(null);
    setError("");
    setActiveTab("general");
  };

  // Mappatura ruoli italiano -> inglese per il backend
  const mapPositionToBackend = (italianPosition) => {
    const positionMap = {
      'Portiere': 'GOALKEEPER',
      'Difensore': 'DEFENDER', 
      'Centrocampista': 'MIDFIELDER',
      'Attaccante': 'FORWARD'
    };
    return positionMap[italianPosition] || italianPosition;
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
        position: mapPositionToBackend(position), // Converti ruolo per il backend
        dateOfBirth,
        nationality,
        shirtNumber: shirtNumber ? Number(shirtNumber) : null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        preferredFoot,
        marketValue: marketValue ? Number(marketValue) : null,
      };

      let result;
      if (player) {
        // Modifica giocatore esistente
        const res = await apiFetch(`/players/${player.id}`, {
          method: "PUT",
          body: payload,
        });
        result = res.data || res;
        onUpdated?.(result);
      } else {
        // Crea nuovo giocatore
        const res = await apiFetch("/players", {
          method: "POST",
          body: payload,
        });
        result = res.data || res;
        onCreated?.(result);
      }

      setOpen(false);
      reset();
    } catch (e) {
      setError(e.message || "Errore salvataggio giocatore");
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = (role) => {
    const colorMap = {
      Portiere: "bg-green-700",
      Difensore: "bg-blue-700",
      Centrocampista: "bg-yellow-600",
      Attaccante: "bg-red-700",
    };
    return (
      <span
        className={`text-xs text-white px-2 py-0.5 rounded-md ${
          colorMap[role] || "bg-gray-600"
        }`}
      >
        {role}
      </span>
    );
  };

  return (
    <>
      {/* Bottone trigger solo per modalità creazione */}
      {!player && !open && (
        <Button
          variant="primary"
          onClick={() => setOpen(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Aggiungi Giocatore
        </Button>
      )}

      {/* Modale */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => {
          setOpen(false);
          if (player && onUpdated) {
            onUpdated();
          }
        }}
      />
      
      {/* Dialog */}
      <div className="relative bg-[#0b0f19]/95 border border-[#1f2937] shadow-xl rounded-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f2937]">
          <h2 className="text-lg font-semibold text-gray-100">
            {player ? "Modifica Giocatore" : "Nuovo Giocatore"}
          </h2>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 border-b border-[#1f2937]">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === "general"
                  ? "border-[#3b82f6] text-[#3b82f6]"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Dati Generali
            </button>
            <button
              onClick={() => setActiveTab("contract")}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === "contract"
                  ? "border-[#3b82f6] text-[#3b82f6]"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Contratto
            </button>
            <button
              onClick={() => setActiveTab("attachments")}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === "attachments"
                  ? "border-[#3b82f6] text-[#3b82f6]"
                  : "border-transparent text-gray-400 hover:text-gray-200"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-200">
                <input
                  type="text"
                  placeholder="Nome *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#111827] text-white border border-[#1f2937] rounded-lg h-10 px-3 placeholder-gray-400 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Cognome *"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#111827] text-white border border-[#1f2937] rounded-lg h-10 px-3 placeholder-gray-400 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                />

                <div className="relative">
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="appearance-none w-full bg-[#111827] text-white border border-[#1f2937] rounded-lg h-10 px-3 pr-8 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  >
                    <option value="">Seleziona ruolo *</option>
                    <option value="Portiere">Portiere</option>
                    <option value="Difensore">Difensore</option>
                    <option value="Centrocampista">Centrocampista</option>
                    <option value="Attaccante">Attaccante</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-[#111827] text-white border border-[#1f2937] rounded-lg h-10 px-3 placeholder-gray-400 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                />

                <input
                  type="text"
                  placeholder="Nazionalità"
                  value={nationality}
                  onChange={(e) => setNat(e.target.value)}
                  className="w-full bg-[#111827] text-white border border-[#1f2937] rounded-lg h-10 px-3 placeholder-gray-400 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Numero maglia"
                  value={shirtNumber}
                  onChange={(e) => setShirt(e.target.value)}
                  className="w-full bg-[#111827] text-white border border-[#1f2937] rounded-lg h-10 px-3 placeholder-gray-400 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                />

                <input
                  type="number"
                  placeholder="Altezza (cm)"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-[#111827] text-white border border-[#1f2937] rounded-lg h-10 px-3 placeholder-gray-400 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Peso (kg)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-[#111827] text-white border border-[#1f2937] rounded-lg h-10 px-3 placeholder-gray-400 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                />

                <div className="relative md:col-span-2">
                  <select
                    value={preferredFoot}
                    onChange={(e) => setFoot(e.target.value)}
                    className="appearance-none w-full bg-[#111827] text-white border border-[#1f2937] rounded-lg h-10 px-3 pr-8 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  >
                    <option value="">Piede preferito</option>
                    <option value="LEFT">Sinistro</option>
                    <option value="RIGHT">Destro</option>
                    <option value="BOTH">Entrambi</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                <input
                  type="number"
                  placeholder="Valore di mercato (€)"
                  value={marketValue}
                  onChange={(e) => setMarketValue(e.target.value)}
                  className="w-full bg-[#111827] text-white border border-[#1f2937] rounded-lg h-10 px-3 placeholder-gray-400 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent md:col-span-2"
                />

                {position && (
                  <div className="md:col-span-2 flex items-center gap-2">
                    <span className="text-sm text-gray-300">Ruolo selezionato:</span>
                    {roleBadge(position)}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB CONTRATTO */}
          {activeTab === "contract" && (
            <div>
              {contractsEnabled ? (
                player ? (
                  // Modalità modifica: mostra contratto esistente
                  (() => {
                    // Trova il contratto attivo dall'array di contratti
                    const activeContract = player.contracts?.find(c => c.status === 'ACTIVE') || player.contracts?.[0];
                    
                    // Helper per tradurre tipo contratto
                    const translateContractType = (type) => {
                      const map = { PERMANENT:'Permanente', PROFESSIONAL:'Professionale', LOAN:'Prestito', TRIAL:'Prova', YOUTH:'Giovanile', AMATEUR:'Dilettante', PART_TIME:'Part-time', APPRENTICESHIP:'Apprendistato' };
                      return map[type] || type || 'N/D';
                    };
                    
                    // Helper per tradurre stato contratto
                    const translateStatus = (status) => {
                      const map = { ACTIVE:'Attivo', EXPIRED:'Scaduto', TERMINATED:'Terminato', DRAFT:'Bozza', RENEWED:'Rinnovato', PENDING:'In attesa' };
                      return map[status] || status || 'N/D';
                    };
                    
                    return activeContract ? (
                    <div className="rounded-md border border-[#1f2937] bg-[#111827]/60 p-4 text-sm text-gray-300">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-semibold text-[#3b82f6]">Contratto Attivo</h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            activeContract.status === 'ACTIVE' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {translateStatus(activeContract.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          {/* Colonna Sinistra: Date e Tipo */}
                          <div className="space-y-2">
                            <div><span className="opacity-70">Tipo:</span> {translateContractType(activeContract.contractType)}</div>
                            <div><span className="opacity-70">Inizio:</span> {activeContract.startDate ? new Date(activeContract.startDate).toLocaleDateString('it-IT') : 'N/D'}</div>
                            <div><span className="opacity-70">Scadenza:</span> {activeContract.endDate ? new Date(activeContract.endDate).toLocaleDateString('it-IT') : 'N/D'}</div>
                          </div>
                          
                          {/* Colonna Destra: Importi (Netto, Lordo, Costo) con allineamento € */}
                          <div className="space-y-2">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="opacity-70">Stipendio Netto:</span>
                              {activeContract.netSalary != null ? (
                                <span className="font-semibold text-green-400">
                                  <span className="inline-block w-3 text-right">€</span>{' '}
                                  <span>{Number(activeContract.netSalary).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400">N/D</span>
                              )}
                            </div>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="opacity-70">Stipendio Lordo:</span>
                              {activeContract.salary != null ? (
                                <span className="font-semibold text-blue-400">
                                  <span className="inline-block w-3 text-right">€</span>{' '}
                                  <span>{Number(activeContract.salary).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400">N/D</span>
                              )}
                            </div>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="opacity-70">Costo Aziendale:</span>
                              {activeContract.socialContributions != null ? (
                                <span className="font-semibold text-red-400">
                                  <span className="inline-block w-3 text-right">€</span>{' '}
                                  <span>{(Number(activeContract.salary || 0) + Number(activeContract.socialContributions)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400">N/D</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {player.contracts.length > 1 && (
                          <div className="mt-3 pt-3 border-t border-[#1f2937] text-xs text-gray-400">
                            + {player.contracts.length - 1} {player.contracts.length === 2 ? 'altro contratto' : 'altri contratti'} nello storico
                          </div>
                        )}
                        <div className="mt-3 flex gap-2">
                          <a 
                            href={`/app/dashboard/contracts/${activeContract.id}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded text-xs transition-colors"
                            title="Apre in una nuova scheda per non perdere i dati del giocatore"
                          >
                            Visualizza Dettagli ↗
                          </a>
                          <a 
                            href="/app/dashboard/contracts" 
                            className="px-3 py-1.5 border border-[#1f2937] hover:bg-[#1f2937] text-gray-300 rounded text-xs transition-colors"
                            title="Vai alla sezione Contratti"
                          >
                            Gestisci Contratti
                          </a>
                        </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm border border-[#1f2937] rounded-md p-4 bg-[#111827]/60">
                        <p className="mb-3">Nessun contratto associato a questo giocatore.</p>
                        <a 
                          href={`/app/dashboard/contracts?playerId=${player.id}`}
                          className="inline-block px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded text-xs transition-colors"
                        >
                          + Aggiungi Contratto
                        </a>
                    </div>
                    );
                  })()
                ) : (
                  // Modalità creazione: mostra messaggio informativo
                  <div className="text-sm text-gray-300 border border-[#1f2937] rounded-md p-4 bg-[#111827]/60">
                    <p className="mb-3">I dati contrattuali verranno gestiti nel modulo Contratti.</p>
                    <p className="text-xs text-gray-400">
                      Dopo aver creato il giocatore, potrai assegnargli un contratto dalla sezione Contratti.
                    </p>
                  </div>
                )
              ) : (
                // Modulo Contratti non attivo
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1f2937] bg-[#111827]/80 px-6 py-12 text-center">
                  <div className="mb-3 rounded-full bg-[#2563eb]/10 p-3">
                    <Lock className="h-6 w-6 text-[#3b82f6]" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-gray-100">Modulo Contratti non attivo</h3>
                  <p className="mb-4 max-w-sm text-sm text-gray-400">
                    Gestisci stipendi, bonus e scadenze dei giocatori con il modulo Contratti PRO.
                  </p>
                  <a href="/pricing?feature=contracts"
                     className="rounded-md bg-[#2563eb] px-4 py-2 text-sm text-white shadow-md transition hover:bg-[#1d4ed8]">
                    Scopri i piani PRO
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB ALLEGATI */}
          {activeTab === "attachments" && (
            <div className="flex flex-col items-center justify-center p-6 text-center border border-[#1f2937] rounded-lg bg-[#111827]/60">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover mb-3 border border-[#3b82f6]/50"
                />
              ) : (
                <UploadCloud className="h-6 w-6 text-[#3b82f6] mb-2" />
              )}
              <p className="text-sm text-gray-300 mb-3">
                Carica la foto profilo del giocatore
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#3b82f6] file:text-white hover:file:bg-[#1d4ed8]"
              />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-4">
            <div className="text-red-500 text-sm border border-red-500/30 rounded-lg p-2 bg-red-500/10">
              {error}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1f2937] flex justify-end gap-3">
          <button
            onClick={() => {
              setOpen(false);
              if (player && onUpdated) {
                onUpdated();
              }
            }}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-[#374151] hover:bg-[#4b5563] rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSave || saving}
            className="inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2 text-white shadow-md transition hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {player ? "Aggiorna" : "Aggiungi"}
          </button>
        </div>
      </div>
      </div>
      )}
    </>
  );
}