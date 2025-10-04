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
const translateRole = (role) => {
  const roleMap = {
    'GOALKEEPER': 'Portiere',
    'DEFENDER': 'Difensore',
    'MIDFIELDER': 'Centrocampista',
    'FORWARD': 'Attaccante'
  };
  return roleMap[role] || role || '-';
};

const translateContractType = (contractType) => {
  const contractMap = {
    'PERMANENT': 'Permanente',
    'LOAN': 'Prestito',
    'TRIAL': 'Prova',
    'YOUTH': 'Giovanile'
  };
  return contractMap[contractType] || contractType || '-';
};

export default function PlayersList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const data = await PlayersAPI.list();
      setPlayers(data);
    } catch (err) {
      console.error("Errore fetch players:", err);
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
                { header: "Ruolo", accessor: (p) => translateRole(p.role) },
                { header: "Contratto", accessor: (p) => translateContractType(p.contractType) },
                { header: "Età", accessor: (p) => p.age || "-" },
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
