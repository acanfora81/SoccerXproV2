import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/design-system/ui/dialog";
import Button from "@/design-system/ds/Button";
import { useState as _useState } from 'react';
import useAuthStore from '@/store/authStore';
import { formatItalianCurrency } from '@/lib/utils/italianNumbers';
import ContractPicker from '@/features/contracts/components/ContractPicker';
import ContractMiniForm from '@/features/contracts/components/ContractMiniForm';
import { linkContractToPlayer, unlinkContractFromPlayer } from '@/features/contracts/api/contractsApi';
import PerformanceQuickPanel from '@/features/performance/components/PerformanceQuickPanel';

export default function PlayerFormModal({ open, onClose, player, onSave }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    contractType: "",
    age: "",
    nationality: "",
    height: "",
    weight: "",
  });

  useEffect(() => {
    if (player) {
      setFormData({
        firstName: player.firstName || "",
        lastName: player.lastName || "",
        role: player.role || "",
        contractType: player.contractType || "",
        age: player.age || "",
        nationality: player.nationality || "",
        height: player.height || "",
        weight: player.weight || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        role: "",
        contractType: "",
        age: "",
        nationality: "",
        height: "",
        weight: "",
      });
    }
  }, [player]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: player?.id });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-lg max-w-2xl w-full p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-900 dark:text-white">
            {player ? "Modifica Giocatore" : "Aggiungi Giocatore"}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 dark:bg-[#0f1424] dark:border-white/10 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cognome</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 dark:bg-[#0f1424] dark:border-white/10 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Ruolo</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 dark:bg-[#0f1424] dark:border-white/10 dark:text-white"
              >
                <option value="">Seleziona ruolo</option>
                <option value="GOALKEEPER">Portiere</option>
                <option value="DEFENDER">Difensore</option>
                <option value="MIDFIELDER">Centrocampista</option>
                <option value="FORWARD">Attaccante</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo Contratto</label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 dark:bg-[#0f1424] dark:border-white/10 dark:text-white"
              >
                <option value="">Seleziona tipo</option>
                <option value="PERMANENT">Permanente</option>
                <option value="LOAN">Prestito</option>
                <option value="TRIAL">Prova</option>
                <option value="YOUTH">Giovanile</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Età</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 dark:bg-[#0f1424] dark:border-white/10 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Altezza (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 dark:bg-[#0f1424] dark:border-white/10 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Peso (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 dark:bg-[#0f1424] dark:border-white/10 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nazionalità</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 dark:bg-[#0f1424] dark:border-white/10 dark:text-white"
              />
            </div>
          </form>

          {/* Sezione Contratto */}
          <div className="col-span-2 mt-4 p-3 border rounded-md dark:border-white/10">
            <h3 className="font-semibold mb-2">Contratto</h3>
            {(() => {
              const user = useAuthStore.getState()?.user;
              const canUseContracts = user?.modules?.includes('contracts') ?? true;
              
              // Trova il contratto attivo dall'array di contratti del giocatore
              const activeContract = player?.contracts?.find(c => c.status === 'ACTIVE') || player?.contracts?.[0];
              const initialContractId = activeContract?.id || '';
              
              const [selectedContractId, setSelectedContractId] = _useState(initialContractId);
              const [creatingNew, setCreatingNew] = _useState(false);
              const [saving, setSaving] = _useState(false);

              // Aggiorna selectedContractId quando player cambia
              useEffect(() => {
                const active = player?.contracts?.find(c => c.status === 'ACTIVE') || player?.contracts?.[0];
                setSelectedContractId(active?.id || '');
              }, [player?.id]);

              const handleLink = async (contractId) => {
                if (!player?.id) return;
                setSaving(true);
                try {
                  await linkContractToPlayer({ playerId: player.id, contractId });
                  setSelectedContractId(contractId);
                  setCreatingNew(false);
                } catch (error) {
                  console.error('Errore collegamento contratto:', error);
                } finally {
                  setSaving(false);
                }
              };
              
              const handleUnlink = async () => {
                if (!player?.id) return;
                setSaving(true);
                try {
                  await unlinkContractFromPlayer(player.id);
                  setSelectedContractId('');
                } catch (error) {
                  console.error('Errore scollegamento contratto:', error);
                } finally {
                  setSaving(false);
                }
              };

              if (!canUseContracts) {
                return <div className="text-sm text-gray-500">Modulo Contratti non incluso nel tuo piano.</div>;
              }

              // Trova i dettagli del contratto selezionato
              const selectedContract = player?.contracts?.find(c => c.id === selectedContractId);

              // Traduzione tipo contratto → italiano
              const translateContractType = (type) => {
                const map = {
                  PERMANENT: 'Permanente',
                  PROFESSIONAL: 'Professionale',
                  LOAN: 'Prestito',
                  TRIAL: 'Prova',
                  YOUTH: 'Giovanile',
                  AMATEUR: 'Dilettante',
                  PART_TIME: 'Part-time',
                  APPRENTICESHIP: 'Apprendistato'
                };
                return map[type] || type || 'N/D';
              };

              // Traduzione stato contratto → italiano
              const translateStatus = (status) => {
                const map = {
                  ACTIVE: 'Attivo',
                  EXPIRED: 'Scaduto',
                  TERMINATED: 'Terminato',
                  DRAFT: 'Bozza',
                  RENEWED: 'Rinnovato',
                  PENDING: 'In attesa'
                };
                return map[status] || status || 'N/D';
              };

              // Formatter numerico senza simbolo per allineare la colonna "€"
              const formatNumberNoCurrency = (value) => {
                try {
                  return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
                } catch {
                  return 'N/D';
                }
              };

              return (
                <div className="flex flex-col gap-2">
                  {!selectedContractId && !creatingNew && (
                    <div className="flex gap-2 items-center">
                      <ContractPicker value={selectedContractId} onChange={setSelectedContractId} />
                      <button className="px-2 py-1 border rounded dark:border-white/10" onClick={() => setCreatingNew(true)}>+ Crea nuovo</button>
                      {selectedContractId && (
                        <button className="px-2 py-1 border rounded bg-primary text-white dark:border-white/10" onClick={() => handleLink(selectedContractId)} disabled={saving}>
                          {saving ? 'Collegamento...' : 'Collega'}
                        </button>
                      )}
                    </div>
                  )}

                  {!selectedContractId && creatingNew && (
                    <div>
                      <ContractMiniForm onCreated={(c) => handleLink(c.id)} disabled={saving} />
                      <button className="mt-2 px-2 py-1 text-sm border rounded dark:border-white/10" onClick={() => setCreatingNew(false)}>Annulla</button>
                    </div>
                  )}

                  {selectedContractId && selectedContract && (
                    <div className="p-3 border rounded dark:border-white/10 bg-gray-50 dark:bg-[#0f1424]">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="font-semibold text-sm">Contratto Attivo</div>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${selectedContract.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {translateStatus(selectedContract.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
                        {/* Colonna Sinistra: Date e Tipo */}
                        <div className="space-y-1.5">
                          <div><span className="font-medium">Tipo:</span> {translateContractType(selectedContract.contractType)}</div>
                          <div><span className="font-medium">Inizio:</span> {selectedContract.startDate ? new Date(selectedContract.startDate).toLocaleDateString('it-IT') : 'N/D'}</div>
                          <div><span className="font-medium">Scadenza:</span> {selectedContract.endDate ? new Date(selectedContract.endDate).toLocaleDateString('it-IT') : 'N/D'}</div>
                        </div>
                        
                        {/* Colonna Destra: Importi (Netto, Lordo, Costo) */}
                        <div className="space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-medium">Stipendio Netto:</span>
                            {selectedContract.netSalary != null ? (
                              <span className="font-bold text-green-600 dark:text-green-400">
                                <span className="inline-block w-3 text-right">€</span>{' '}
                                <span>{formatNumberNoCurrency(selectedContract.netSalary)}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">N/D</span>
                            )}
                          </div>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-medium">Stipendio Lordo:</span>
                            {selectedContract.salary != null ? (
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                <span className="inline-block w-3 text-right">€</span>{' '}
                                <span>{formatNumberNoCurrency(selectedContract.salary)}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">N/D</span>
                            )}
                          </div>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-medium">Costo Aziendale:</span>
                            {selectedContract.socialContributions != null ? (
                              <span className="font-bold text-red-600 dark:text-red-400">
                                <span className="inline-block w-3 text-right">€</span>{' '}
                                <span>{formatNumberNoCurrency(Number(selectedContract.salary || 0) + Number(selectedContract.socialContributions))}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">N/D</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2 pt-2 border-t dark:border-white/10">
                        <button className="px-2 py-1 text-xs border rounded dark:border-white/10 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={handleUnlink} disabled={saving}>
                          {saving ? 'Scollegamento...' : 'Scollega'}
                        </button>
                        <a 
                          className="px-2 py-1 text-xs border rounded dark:border-white/10 hover:bg-gray-100 dark:hover:bg-gray-800" 
                          href={`/app/dashboard/contracts/${selectedContractId}`} 
                          target="_blank" 
                          rel="noreferrer"
                          title="Apre in una nuova scheda"
                        >
                          Dettagli ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedContractId && !selectedContract && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      ⚠️ Contratto ID {selectedContractId} collegato ma dettagli non disponibili
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Sezione Performance */}
          {player && (() => {
            const user = useAuthStore.getState()?.user;
            const canUsePerformance = user?.modules?.includes('performance') ?? true;
            
            if (!canUsePerformance) return null;
            
            return (
              <div className="col-span-2 mt-4 p-3 border rounded-md dark:border-white/10">
                <h3 className="font-semibold mb-2">Performance</h3>
                <PerformanceQuickPanel playerId={player.id} />
              </div>
            );
          })()}

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" variant="primary" onClick={handleSubmit}>
              {player ? "Aggiorna" : "Aggiungi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
