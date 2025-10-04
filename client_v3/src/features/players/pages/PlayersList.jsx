import React, { useEffect, useState } from "react";
import PageHeader from "@/design-system/ds/PageHeader";
import Button from "@/design-system/ds/Button";
import Card, { CardContent } from "@/design-system/ds/Card";
import DataTable from "@/design-system/ds/DataTable";
import EmptyState from "@/design-system/ds/EmptyState";
import ConfirmDialog from "@/design-system/ds/ConfirmDialog";

import { Users, Download, RefreshCw, Upload, Edit, Trash2 } from "lucide-react";

import PlayerFormModal from "../components/PlayerFormModal";
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
    'PART_TIME': 'Part-time'
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
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

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
          <Button variant="primary" onClick={() => { setSelected(null); setFormOpen(true); }}>
            + Aggiungi Giocatore
          </Button>
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
        <p>Caricamento...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun giocatore trovato"
          description="Inizia aggiungendo il primo giocatore alla tua rosa"
          action={
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              Aggiungi Giocatore
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent>
            <DataTable
              data={filtered}
              columns={[
                { header: "Nome", accessor: (p) => `${p.firstName} ${p.lastName}` },
                { header: "Ruolo", accessor: (p) => translateRole(p.position) },
                { header: "Contratto", accessor: (p) => translateContractType(p.contracts) },
                { header: "Età", accessor: (p) => calculateAge(p.dateOfBirth) },
                { header: "Nazionalità", accessor: (p) => p.nationality || "-" },
                {
                  header: "Azioni",
                  accessor: (p) => (
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="info"
                        onClick={() => { setSelected(p); setFormOpen(true); }}
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
    </div>
  );
}
