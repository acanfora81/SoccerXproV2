import { FileSpreadsheet, Plus, Trash2, Edit3, Check, Upload, Wrench } from "lucide-react";

export function ButtonExamples() {
  return (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      {/* Azione principale */}
      <button className="btn btn-primary">
        <Check size={18} /> Salva
      </button>

      {/* Aggiungi */}
      <button className="btn btn-primary">
        <Plus size={18} /> Aggiungi
      </button>

      {/* Esporta Excel */}
      <button className="btn btn-success">
        <FileSpreadsheet size={18} /> Esporta in Excel
      </button>

      {/* Importa File */}
      <button className="btn btn-secondary">
        <Upload size={18} /> Importa da File
      </button>

      {/* Correggi Caratteri */}
      <button className="btn btn-warning">
        <Wrench size={18} /> Correggi Caratteri
      </button>

      {/* Modifica */}
      <button className="btn btn-secondary">
        <Edit3 size={18} /> Modifica
      </button>

      {/* Elimina */}
      <button className="btn btn-danger">
        <Trash2 size={18} /> Elimina
      </button>
    </div>
  );
}
