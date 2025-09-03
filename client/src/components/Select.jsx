import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import "./Select.css";

const SelectContext = createContext();

export function Select({ onValueChange, children, className = "", players = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const selectRef = useRef(null);
  
  const handleSelect = (value) => {
    setSelectedValue(value);
    setIsOpen(false);
    onValueChange(value);
  };
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, selectedValue, handleSelect, players }}>
      <div ref={selectRef} className={`select ${className}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = "" }) {
  const { isOpen, setIsOpen } = useContext(SelectContext);
  
  return (
    <button
      className={`select-trigger ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      type="button"
    >
      {children}
      <svg
        className={`select-arrow ${isOpen ? 'open' : ''}`}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6,9 12,15 18,9"></polyline>
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder, className = "" }) {
  const { selectedValue, players } = useContext(SelectContext);
  
  // Trova il giocatore selezionato per mostrare il nome invece dell'ID
  const selectedPlayer = players?.find(p => p.id.toString() === selectedValue);
  const displayValue = selectedPlayer ? `${(selectedPlayer.lastName || '').toUpperCase()} ${selectedPlayer.firstName || ''}` : placeholder;
  
  return (
    <span className={`select-value ${className}`}>
      {displayValue}
    </span>
  );
}

export function SelectContent({ children, className = "" }) {
  const { isOpen } = useContext(SelectContext);
  
  if (!isOpen) return null;
  
  return (
    <div className={`select-content ${className}`}>
      {children}
    </div>
  );
}

// 🆕 NUOVO: Componente per organizzare giocatori per ruoli
export function SelectContentWithRoles({ players = [], className = "" }) {
  const { isOpen } = useContext(SelectContext);
  
  if (!isOpen) return null;
  
  // Organizza giocatori per ruoli con ordine fisso
  const organizedPlayers = players.reduce((acc, player) => {
    const role = player.position || 'UNKNOWN';
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(player);
    return acc;
  }, {});
  
  // Ordina per COGNOME all'interno di ogni ruolo
  Object.keys(organizedPlayers).forEach(role => {
    organizedPlayers[role].sort((a, b) => {
      const lastNameA = (a.lastName || '').toLowerCase();
      const lastNameB = (b.lastName || '').toLowerCase();
      return lastNameA.localeCompare(lastNameB);
    });
  });
  
  // Mappa ruoli a etichette italiane con ordine fisso
  const roleOrder = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
  const roleLabels = {
    'GOALKEEPER': 'Portieri',
    'DEFENDER': 'Difensori',
    'MIDFIELDER': 'Centrocampisti',
    'FORWARD': 'Attaccanti',
    'UNKNOWN': 'Altri'
  };
  
  return (
    <div className={`select-content select-content-roles ${className}`}>
      {roleOrder.map(role => {
        if (organizedPlayers[role] && organizedPlayers[role].length > 0) {
          return (
            <div key={role} className="role-section">
              <div className="role-header">{roleLabels[role]}</div>
              {organizedPlayers[role].map(player => (
                <SelectItem key={player.id} value={player.id.toString()}>
                  {(player.lastName || '').toUpperCase()} {player.firstName || ''}
                </SelectItem>
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export function SelectItem({ value, children, className = "" }) {
  const { handleSelect } = useContext(SelectContext);
  
  return (
    <div
      className={`select-item ${className}`}
      onClick={() => handleSelect(value)}
    >
      {children}
    </div>
  );
}
