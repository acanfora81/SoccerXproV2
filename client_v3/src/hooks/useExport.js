import { useState } from 'react';
import * as XLSX from 'xlsx';

export const useExport = () => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportData, setExportData] = useState([]);
  const [exportFilename, setExportFilename] = useState('');

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (data, filename) => {
    if (!data || data.length === 0) return;
    
    // Crea un nuovo workbook
    const wb = XLSX.utils.book_new();
    
    // Converte i dati in worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Aggiunge il worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Dati');
    
    // Esporta il file
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleExport = (data, filename, players = [], filters = {}) => {
    // Aggiunge la colonna playerId ai dati
    const enrichedData = data.map(item => {
      // Controlla se c'è un filtro per un singolo giocatore
      const selectedPlayerIds = filters.players || [];
      
      // Se c'è un filtro per un singolo giocatore, mostra nome e cognome
      if (selectedPlayerIds.length === 1) {
        const selectedPlayerId = selectedPlayerIds[0];
        const player = players.find(p => p.id === selectedPlayerId);
        if (player) {
          return {
            ...item,
            playerId: `${player.firstName} ${player.lastName}`
          };
        }
      }
      
      // Se non c'è filtro per giocatori o ci sono più giocatori, mostra "Team"
      return {
        ...item,
        playerId: 'Team'
      };
    });
    
    setExportData(enrichedData);
    setExportFilename(filename);
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    if (exportFormat === 'excel') {
      exportToExcel(exportData, exportFilename);
    } else {
      exportToCSV(exportData, exportFilename);
    }
    
    console.log(`✅ Esportati ${exportData.length} record in formato ${exportFormat === 'excel' ? 'Excel' : 'CSV'}`);
    setShowExportModal(false);
  };

  const handleExportCancel = () => {
    setShowExportModal(false);
  };

  return {
    showExportModal,
    exportFormat,
    setExportFormat,
    handleExport,
    handleExportConfirm,
    handleExportCancel
  };
};
