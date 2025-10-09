import React, { useEffect, useState, useMemo } from "react";
import {
  UserPlus,
  Loader2,
  Lock,
  Plus,
  FileText,
  UploadCloud
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-muted/30">
      <div className="rounded-full bg-primary/10 p-3 mb-3">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {description}
      </p>
      <Button asChild size="sm">
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

      const created = await apiFetch("/players", {
        method: "POST",
        body: payload
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" /> Aggiungi Giocatore
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nuovo giocatore</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-3">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">Dati Generali</TabsTrigger>
            <TabsTrigger value="contract">Contratto</TabsTrigger>
            <TabsTrigger value="attachments">Allegati</TabsTrigger>
          </TabsList>

          {/* TAB DATI GENERALI */}
          <TabsContent value="general">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Nome" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
              <Input placeholder="Cognome" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
              <Input placeholder="Ruolo (es. Difensore)" value={position} onChange={(e)=>setPosition(e.target.value)} />
              <Input type="date" placeholder="Data di nascita" value={dateOfBirth} onChange={(e)=>setDob(e.target.value)} />
              <Input placeholder="Nazionalità" value={nationality} onChange={(e)=>setNat(e.target.value)} />
              <Input placeholder="Numero maglia" value={shirtNumber} onChange={(e)=>setShirt(e.target.value)} />
              <Input placeholder="Altezza (cm)" value={height} onChange={(e)=>setHeight(e.target.value)} />
              <Input placeholder="Peso (kg)" value={weight} onChange={(e)=>setWeight(e.target.value)} />
              <select className="border rounded-md h-9 bg-background px-3 md:col-span-2" value={preferredFoot} onChange={(e)=>setFoot(e.target.value)}>
                <option value="">Piede preferito</option>
                <option value="LEFT">Sinistro</option>
                <option value="RIGHT">Destro</option>
                <option value="BOTH">Entrambi</option>
              </select>
            </div>

            {contractsEnabled && (
              <div className="mt-4 border rounded-md p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="scale-110"
                         checked={createContractAfter}
                         onChange={e=>setCreateContractAfter(e.target.checked)} />
                  Crea subito un contratto dopo il salvataggio
                </label>
                <div className="text-xs opacity-70 mt-1">
                  Dopo il salvataggio verrai reindirizzato alla pagina "Nuovo Contratto".
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB CONTRATTO */}
          <TabsContent value="contract">
            {contractsEnabled ? (
              <div className="text-sm opacity-70 p-4 border rounded-md">
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
          </TabsContent>

          {/* TAB ALLEGATI */}
          <TabsContent value="attachments">
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-muted/20">
              <UploadCloud className="h-6 w-6 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">
                Caricamento foto profilo e documenti disponibile nella scheda del giocatore dopo il salvataggio.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-2 mt-2">
            {error}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={()=>setOpen(false)}>Annulla</Button>
          <Button onClick={onSubmit} disabled={!canSave || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Aggiungi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

