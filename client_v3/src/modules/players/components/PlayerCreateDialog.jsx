import React, { useEffect, useState, useMemo } from "react";
import {
  UserPlus,
  Loader2,
  Lock,
  UploadCloud,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiFetch from "@/utils/apiFetch";

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
      <Button
        asChild
        size="sm"
        className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md"
      >
        <a href={upgradeUrl}>Scopri i piani PRO</a>
      </Button>
    </div>
  );
}

export default function PlayerCreateDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [contractsEnabled, setContractsEnabled] = useState(false);
  const [createContractAfter, setCreateContractAfter] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // campi giocatore
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [dateOfBirth, setDob] = useState("");
  const [nationality, setNat] = useState("");
  const [shirtNumber, setShirt] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [preferredFoot, setFoot] = useState("");
  const [marketValue, setMarketValue] = useState("");

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
    setCreateContractAfter(false);
    setError("");
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
        preferredFoot,
        marketValue: marketValue ? Number(marketValue) : null,
      };
      const created = await apiFetch("/players", {
        method: "POST",
        body: payload,
      });

      onCreated?.(created);
      setOpen(false);
      reset();

      if (createContractAfter && contractsEnabled && created?.id) {
        window.location.href = `/contracts/new?playerId=${created.id}`;
      }
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md rounded-lg">
          <UserPlus className="h-4 w-4" /> Aggiungi Giocatore
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl bg-[#0b0f19]/95 border border-[#1f2937] shadow-xl rounded-2xl backdrop-blur-md transition-all duration-200">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <DialogHeader>
            <DialogTitle className="text-gray-100 text-lg font-semibold">
              Nuovo Giocatore
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-3">
            <TabsList className="grid grid-cols-3 border-b border-[#1f2937] mb-4">
              <TabsTrigger value="general">Dati Generali</TabsTrigger>
              <TabsTrigger value="contract">Contratto</TabsTrigger>
              <TabsTrigger value="attachments">Allegati</TabsTrigger>
            </TabsList>

            {/* TAB DATI GENERALI */}
            <TabsContent value="general">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-200">
                <Input
                  placeholder="Nome"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-[#111827] border border-[#1f2937] h-10 px-3 text-white placeholder-gray-400"
                />
                <Input
                  placeholder="Cognome"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-[#111827] border border-[#1f2937] h-10 px-3 text-white placeholder-gray-400"
                />

                <div className="relative">
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="appearance-none w-full bg-[#111827] text-white border border-[#1f2937] rounded-md h-10 px-3 pr-8"
                  >
                    <option value="">Seleziona ruolo</option>
                    <option value="Portiere">Portiere</option>
                    <option value="Difensore">Difensore</option>
                    <option value="Centrocampista">Centrocampista</option>
                    <option value="Attaccante">Attaccante</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>

                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDob(e.target.value)}
                  className="bg-[#111827] border border-[#1f2937] h-10 px-3 text-white placeholder-gray-400"
                />

                <Input
                  placeholder="Nazionalità"
                  value={nationality}
                  onChange={(e) => setNat(e.target.value)}
                  className="bg-[#111827] border border-[#1f2937] h-10 px-3 text-white placeholder-gray-400"
                />
                <Input
                  placeholder="Numero maglia"
                  value={shirtNumber}
                  onChange={(e) => setShirt(e.target.value)}
                  className="bg-[#111827] border border-[#1f2937] h-10 px-3 text-white placeholder-gray-400"
                />

                <Input
                  placeholder="Altezza (cm)"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="bg-[#111827] border border-[#1f2937] h-10 px-3 text-white placeholder-gray-400"
                />
                <Input
                  placeholder="Peso (kg)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-[#111827] border border-[#1f2937] h-10 px-3 text-white placeholder-gray-400"
                />

                <div className="relative md:col-span-2">
                  <select
                    value={preferredFoot}
                    onChange={(e) => setFoot(e.target.value)}
                    className="appearance-none w-full bg-[#111827] text-white border border-[#1f2937] rounded-md h-10 px-3 pr-8"
                  >
                    <option value="">Piede preferito</option>
                    <option value="LEFT">Sinistro</option>
                    <option value="RIGHT">Destro</option>
                    <option value="BOTH">Entrambi</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>

                <Input
                  placeholder="Valore di mercato (€)"
                  value={marketValue}
                  onChange={(e) => setMarketValue(e.target.value)}
                  className="bg-[#111827] border border-[#1f2937] h-10 px-3 text-white placeholder-gray-400 md:col-span-2"
                />

                {position && (
                  <div className="md:col-span-2">
                    Ruolo selezionato: {roleBadge(position)}
                  </div>
                )}
              </div>

              {contractsEnabled && (
                <div className="mt-4 border border-[#1f2937] rounded-md p-3 bg-[#111827]/60">
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      className="scale-110 accent-[#3b82f6]"
                      checked={createContractAfter}
                      onChange={(e) => setCreateContractAfter(e.target.checked)}
                    />
                    Crea subito un contratto dopo il salvataggio
                  </label>
                  <div className="text-xs text-gray-400 mt-1">
                    Dopo il salvataggio verrai reindirizzato alla pagina "Nuovo Contratto".
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB CONTRATTO */}
            <TabsContent value="contract">
              {contractsEnabled ? (
                <div className="text-sm text-gray-300 p-4 border border-[#1f2937] rounded-md bg-[#111827]/60">
                  I dati contrattuali verranno gestiti nel modulo Contratti,
                  dove potrai definire durata, stipendio, bonus e clausole.
                </div>
              ) : (
                <LockedTab
                  title="Modulo Contratti non attivo"
                  description="Gestisci stipendi, bonus e scadenze dei giocatori con il modulo Contratti PRO."
                  upgradeUrl="/pricing?feature=contracts"
                />
              )}
            </TabsContent>

            {/* TAB ALLEGATI */}
            <TabsContent value="attachments">
              <div className="flex flex-col items-center justify-center p-6 text-center border border-[#1f2937] rounded-md bg-[#111827]/60">
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
                  className="text-sm text-gray-400"
                />
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="text-red-500 text-sm border border-red-500/30 rounded-md p-2 mt-3">
              {error}
            </div>
          )}

          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              className="bg-[#374151] hover:bg-[#4b5563] text-gray-200"
            >
              Annulla
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!canSave || saving}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Aggiungi
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}