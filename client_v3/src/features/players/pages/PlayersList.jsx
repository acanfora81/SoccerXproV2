import React, { useEffect, useState } from "react";
import PageHeader from "@/design-system/ds/PageHeader";
import Button from "@/design-system/ds/Button";
import Card, { CardContent } from "@/design-system/ds/Card";
import DataTable from "@/design-system/ds/DataTable";
import EmptyState from "@/design-system/ds/EmptyState";
import ConfirmDialog from "@/design-system/ds/ConfirmDialog";
import GlobalLoader from "@/components/ui/GlobalLoader";

import { Users, Download, RefreshCw, Upload, Edit, Trash2, Eye } from "lucide-react";

import PlayerFormModal from "../components/PlayerFormModal";
import useAuthStore from "@/store/authStore";
import { formatItalianCurrency } from "@/lib/utils/italianNumbers";
import PlayerCreateDialog from "@/modules/players/components/PlayerCreateDialog";
import { PlayersAPI } from "@/lib/api/players";

// Funzioni di traduzione
const translateRole = (position) => {
  const roleMap = {
    'GOALKEEPER': 'Portiere',
    'DEFENDER': 'Difensore',
    'MIDFIELDER': 'Centrocampista',
    'FORWARD': 'Attaccante'
  };
  return roleMap[position] || position || '-';
};

const translateContractType = (contracts) => {
  if (!contracts || !Array.isArray(contracts) || contracts.length === 0) {
    return '-';
  }
  
  // Prendi il contratto più recente
  const latestContract = contracts[0];
  const contractMap = {
    'PERMANENT': 'Permanente',
    'PROFESSIONAL': 'Professionale',
    'LOAN': 'Prestito',
    'TRIAL': 'Prova',
    'YOUTH': 'Giovanile',
    'AMATEUR': 'Dilettante',
    'PART_TIME': 'Part-time',
    'APPRENTICESHIP': 'Apprendistato'
  };
  return contractMap[latestContract.contractType] || latestContract.contractType || '-';
};

// Funzione per calcolare l'età dalla data di nascita
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return '-';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function PlayersList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [viewPlayer, setViewPlayer] = useState(null);

  const { user } = useAuthStore();
  const canUseContracts = user?.modules?.includes('contracts') ?? true;

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const data = await PlayersAPI.list();
      setPlayers(data);
      
      // Controlla se stiamo usando dati mock (controlla se i dati sono quelli di default)
      const isMockData = data.length > 0 && data[0].firstName === "Mario" && data[0].lastName === "Rossi";
      setIsUsingMockData(isMockData);
      
    } catch (err) {
      console.error("Errore fetch players:", err);
      setIsUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleSave = async (player) => {
    try {
      if (player.id) {
        await PlayersAPI.update(player.id, player);
      } else {
        await PlayersAPI.create(player);
      }
      fetchPlayers();
      setFormOpen(false);
    } catch (err) {
      console.error("Errore salvataggio:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await PlayersAPI.remove(id);
      fetchPlayers();
    } catch (err) {
      console.error("Errore eliminazione:", err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await PlayersAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "players.xlsx";
      a.click();
    } catch (err) {
      console.error("Errore export:", err);
    }
  };

  const handleFixEncoding = async () => {
    try {
      await PlayersAPI.fixEncoding();
      fetchPlayers();
    } catch (err) {
      console.error("Errore fix encoding:", err);
    }
  };

  const filtered = players.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Giocatori"
        subtitle="Gestione della rosa giocatori"
        actions={
          <PlayerCreateDialog onCreated={() => fetchPlayers()} />
        }
      />

      {/* Banner di avviso per dati mock */}
      {isUsingMockData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Backend non disponibile
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Il server backend non è raggiungibile. Stai visualizzando dati di esempio.
                  Per vedere i dati reali, assicurati che il server sia attivo su <code className="bg-yellow-100 px-1 rounded">localhost:3001</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Cerca giocatore..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg w-64 dark:bg-[#0f1424] dark:border-white/10"
        />
        <Button variant="warning" onClick={handleFixEncoding}>
          <RefreshCw className="w-4 h-4 mr-2" /> Correggi Codifica
        </Button>
        <Button variant="success" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" /> Esporta Excel
        </Button>
        <Button variant="info">
          <Upload className="w-4 h-4 mr-2" /> Carica Excel
        </Button>
      </div>

      {/* DataTable */}
      {loading ? (
        <GlobalLoader sectionName="Giocatori" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun giocatore trovato"
          description="Inizia aggiungendo il primo giocatore alla tua rosa"
          action={
            <PlayerCreateDialog onCreated={() => fetchPlayers()} />
          }
        />
      ) : (
        <Card>
          <CardContent>
            <DataTable
              data={filtered}
              columns={[
                { header: "Nome", accessor: (p) => `${p.firstName} ${p.lastName}`, align: 'left' },
                { header: "Ruolo", accessor: (p) => translateRole(p.position) },
                { header: "Contratto", accessor: (p) => translateContractType(p.contracts) },
                { header: "Età", accessor: (p) => calculateAge(p.dateOfBirth) },
                { header: "Nazionalità", accessor: (p) => p.nationality || "-" },
                {
                  header: "Azioni",
                  accessor: (p) => (
                    <div className="flex gap-2 justify-center">
                      {canUseContracts && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => setViewPlayer(p)}
                          title="Visualizza contratto"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="info"
                        onClick={() => setEditPlayer(p)}
                        title="Modifica giocatore"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setConfirmDelete(p.id)}
                        title="Elimina giocatore"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {/* Modale form giocatore */}
      {formOpen && (
        <PlayerFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          player={selected}
          onSave={handleSave}
        />
      )}

      {/* Modale modifica giocatore (nuova con tab) */}
      {editPlayer && (
        <PlayerCreateDialog
          player={editPlayer}
          onUpdated={() => {
            setEditPlayer(null);
            fetchPlayers();
          }}
        />
      )}

      {/* Dialog conferma eliminazione */}
      {confirmDelete && (
        <ConfirmDialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}
          title="Elimina Giocatore"
          message="Sei sicuro di voler eliminare questo giocatore?"
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}

      {/* Modale sola visualizzazione contratto */}
      {viewPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setViewPlayer(null)} />
          <div className="relative bg-white dark:bg-[#0f1424] text-gray-900 dark:text-gray-100 rounded-xl shadow-xl w-full max-w-lg mx-4 p-5 border dark:border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Dettaglio Contratto</h3>
              <button className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white" onClick={() => setViewPlayer(null)}>✕</button>
            </div>

            {(() => {
              const activeContract = viewPlayer?.contracts?.find(c => c.status === 'ACTIVE') || viewPlayer?.contracts?.[0];
              if (!activeContract) {
                return <div className="text-sm text-gray-500">Nessun contratto associato.</div>;
              }

              const typeMap = { PERMANENT:'Permanente', PROFESSIONAL:'Professionale', LOAN:'Prestito', TRIAL:'Prova', YOUTH:'Giovanile', AMATEUR:'Dilettante', PART_TIME:'Part-time' };
              const statusMap = { ACTIVE:'Attivo', EXPIRED:'Scaduto', TERMINATED:'Terminato', DRAFT:'Bozza', RENEWED:'Rinnovato', PENDING:'In attesa' };

              const euro = (v) => typeof v === 'number' ? v.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/D';

              return (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Stato</div>
                    <span className={`px-2 py-0.5 rounded text-xs ${activeContract.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>{statusMap[activeContract.status] || activeContract.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div><span className="font-medium">Tipo:</span> {typeMap[activeContract.contractType] || activeContract.contractType || 'N/D'}</div>
                      <div><span className="font-medium">Inizio:</span> {activeContract.startDate ? new Date(activeContract.startDate).toLocaleDateString('it-IT') : 'N/D'}</div>
                      <div><span className="font-medium">Scadenza:</span> {activeContract.endDate ? new Date(activeContract.endDate).toLocaleDateString('it-IT') : 'N/D'}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">Stipendio Netto:</span>
                        <span className="font-bold text-green-600 dark:text-green-400"><span className="inline-block w-3 text-right">€</span> {euro(Number(activeContract.netSalary))}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">Stipendio Lordo:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400"><span className="inline-block w-3 text-right">€</span> {euro(Number(activeContract.salary))}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">Costo Aziendale:</span>
                        <span className="font-bold text-red-600 dark:text-red-400"><span className="inline-block w-3 text-right">€</span> {euro(Number(activeContract.salary || 0) + Number(activeContract.socialContributions || 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
