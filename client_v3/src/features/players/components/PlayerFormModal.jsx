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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {player ? "Modifica Giocatore" : "Aggiungi Giocatore"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg dark:bg-[#0f1424] dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cognome
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg dark:bg-[#0f1424] dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ruolo
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg dark:bg-[#0f1424] dark:text-white"
              >
                <option value="">Seleziona ruolo</option>
                <option value="GOALKEEPER">Portiere</option>
                <option value="DEFENDER">Difensore</option>
                <option value="MIDFIELDER">Centrocampista</option>
                <option value="FORWARD">Attaccante</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo Contratto
              </label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg dark:bg-[#0f1424] dark:text-white"
              >
                <option value="">Seleziona tipo</option>
                <option value="PERMANENT">Permanente</option>
                <option value="LOAN">Prestito</option>
                <option value="TRIAL">Prova</option>
                <option value="YOUTH">Giovanile</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Età
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg dark:bg-[#0f1424] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Altezza (cm)
              </label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg dark:bg-[#0f1424] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg dark:bg-[#0f1424] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nazionalità
            </label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg dark:bg-[#0f1424] dark:text-white"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" variant="primary">
              {player ? "Aggiorna" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
