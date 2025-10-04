import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/design-system/ui/dialog";
import Button from "@/design-system/ds/Button";

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
