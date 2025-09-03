import React, { useState } from "react";
import { Search, Settings, Layout, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Segmented from "../ui/Segmented";
import { useFilters } from "../../modules/filters/index.js";

// Componente DatePicker per il filtro personalizzato
function DatePicker({ isOpen, onClose, onDateSelect, startDate, endDate }) {
  // 🔧 FIX: Inizializza con anno corrente invece di 2024
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();
  
  const [currentMonth, setCurrentMonth] = useState(new Date(currentYear, currentMonthIndex, 1));
  const [selectedStart, setSelectedStart] = useState(startDate ? new Date(startDate) : null);
  const [selectedEnd, setSelectedEnd] = useState(endDate ? new Date(endDate) : null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  if (!isOpen) return null;

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Aggiungi giorni vuoti per allineare il calendario
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Aggiungi i giorni del mese
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handleDateClick = (date) => {
    if (!selectingEnd) {
      setSelectedStart(date);
      setSelectedEnd(null);
      setSelectingEnd(true);
    } else {
      if (date >= selectedStart) {
        setSelectedEnd(date);
        setSelectingEnd(false);
      } else {
        // Se la data finale è precedente a quella iniziale, scambia
        setSelectedEnd(selectedStart);
        setSelectedStart(date);
        setSelectingEnd(false);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedStart && selectedEnd) {
      onDateSelect({
        startDate: selectedStart.toISOString().split('T')[0],
        endDate: selectedEnd.toISOString().split('T')[0]
      });
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedStart(startDate ? new Date(startDate) : null);
    setSelectedEnd(endDate ? new Date(endDate) : null);
    setSelectingEnd(false);
    onClose();
  };

  const isInRange = (date) => {
    if (!selectedStart || !selectedEnd) return false;
    return date >= selectedStart && date <= selectedEnd;
  };

  const isSelected = (date) => {
    return (selectedStart && date.getTime() === selectedStart.getTime()) ||
           (selectedEnd && date.getTime() === selectedEnd.getTime());
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  return (
    <div className="datepicker-overlay" onClick={onClose}>
      <div className="datepicker" onClick={(e) => e.stopPropagation()}>
        <div className="datepicker-header">
          <h3>Seleziona Periodo</h3>
          <button onClick={onClose} className="close-btn">
            <X size={16} />
          </button>
        </div>

        <div className="datepicker-body">
          <div className="month-navigation">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="nav-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="month-title">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="nav-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="calendar-grid">
            <div className="weekdays">
              {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            <div className="days">
              {days.map((day, index) => (
                <button
                  key={index}
                  className={`day ${!day ? 'empty' : ''} ${day && isInRange(day) ? 'in-range' : ''} ${day && isSelected(day) ? 'selected' : ''}`}
                  onClick={() => day && handleDateClick(day)}
                  disabled={!day}
                >
                  {day ? day.getDate() : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="datepicker-footer">
            <div className="selected-range">
              {selectedStart && (
                <span>Dal: {selectedStart.toLocaleDateString('it-IT')}</span>
              )}
              {selectedEnd && (
                <span>A: {selectedEnd.toLocaleDateString('it-IT')}</span>
              )}
            </div>
            <div className="datepicker-actions">
              <button onClick={handleCancel} className="btn-secondary">
                Annulla
              </button>
              <button 
                onClick={handleConfirm} 
                className="btn-primary"
                disabled={!selectedStart || !selectedEnd}
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente per mostrare i filtri attivi come chips
function ActiveFiltersChips({ filters, updateFilter, customDateRange }) {
  const activeFilters = [];
  
  // Periodo (se non è default)
  if (filters.period !== 'week') {
    const periodLabels = {
      'month': 'Ultimo Mese',
      'quarter': 'Ultimo Trimestre',
      'custom': 'Personalizzato'
    };
    
    let label = `Periodo: ${periodLabels[filters.period]}`;
    
    // Se è personalizzato e ci sono date, mostra il range
    if (filters.period === 'custom' && customDateRange?.startDate && customDateRange?.endDate) {
      const startDate = new Date(customDateRange.startDate).toLocaleDateString('it-IT');
      const endDate = new Date(customDateRange.endDate).toLocaleDateString('it-IT');
      label = `Periodo: ${startDate} - ${endDate}`;
    }
    
    activeFilters.push({
      key: 'period',
      label: label,
      onRemove: () => updateFilter('period', 'week')
    });
  }
  
  // Tipo sessione (se non è default)
  if (filters.sessionType !== 'all') {
    const sessionLabels = {
      'training': 'Allenamento',
      'match': 'Partita',
      'test': 'Test'
    };
    activeFilters.push({
      key: 'sessionType',
      label: `Sessione: ${sessionLabels[filters.sessionType]}`,
      onRemove: () => updateFilter('sessionType', 'all')
    });
  }
  
  // Stato (se non è default)
  if (filters.status !== 'all') {
    const statusLabels = {
      'active': 'Attivo',
      'return': 'Rientro',
      'injured': 'OUT'
    };
    activeFilters.push({
      key: 'status',
      label: `Stato: ${statusLabels[filters.status]}`,
      onRemove: () => updateFilter('status', 'all')
    });
  }
  
  // Ruoli (se non sono tutti)
  if (filters.roles.length < 4) {
    const roleLabels = {
      'POR': 'Portieri',
      'DIF': 'Difensori',
      'CEN': 'Centrocampisti',
      'ATT': 'Attaccanti'
    };
    const selectedRoles = filters.roles.map(r => roleLabels[r]).join(', ');
    activeFilters.push({
      key: 'roles',
      label: `Ruolo: ${selectedRoles}`,
      onRemove: () => updateFilter('roles', ['POR', 'DIF', 'CEN', 'ATT'])
    });
  }
  
  // Normalizzazione (se non è default)
  if (filters.normalize !== 'per90') {
    const normalizeLabels = {
      'absolute': 'Assoluti',
      'perMin': 'per min'
    };
    activeFilters.push({
      key: 'normalize',
      label: `Normalizzazione: ${normalizeLabels[filters.normalize]}`,
      onRemove: () => updateFilter('normalize', 'per90')
    });
  }
  
  // Ordinamento (se non è default)
  if (filters.sortBy !== 'acwr') {
    const sortLabels = {
      'plMin': 'PL/min',
      'hsr': 'HSR',
      'sprintPer90': 'Sprint/90',
      'topSpeed': 'Vel. max',
      'name': 'Nome'
    };
    activeFilters.push({
      key: 'sortBy',
      label: `Ordinato per: ${sortLabels[filters.sortBy]}`,
      onRemove: () => updateFilter('sortBy', 'acwr')
    });
  }
  
  if (activeFilters.length === 0) return null;
  
  return (
    <div className="active-filters">
      {activeFilters.map(filter => (
        <span key={filter.key} className="active-chip">
          {filter.label}
          <button onClick={filter.onRemove} className="remove-btn">
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

export default function FiltersBar({
  onOpenAdvanced, 
  onOpenLayout,
  onOpenDatepicker,
  mode = 'players', // 'players' | 'dossier'
  startDate,
  endDate,
  showNormalize = false,   // ⬅️ NUOVO: mostra/nascondi Assoluti/90'/min
  showSort = false,        // ⬅️ NUOVO: mostra/nascondi ACWR/PLmin/...
  players = [],            // ⬅️ NUOVO: lista giocatori per dropdown
  showPlayers = false,     // ⬅️ NUOVO: mostra/nascondi filtro giocatori
}) {
  // Usa il sistema di filtri centralizzato
  const { filters, updateFilter } = useFilters();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Helper: organizza giocatori per ruoli e ordina per cognome
  const organizedPlayers = React.useMemo(() => {
    if (!players || players.length === 0) return {};
    
    const roleMap = {
      'GOALKEEPER': 'Portieri',
      'DEFENDER': 'Difensori', 
      'MIDFIELDER': 'Centrocampisti',
      'FORWARD': 'Attaccanti'
    };
    
    const organized = {};
    
    // Raggruppa per ruolo
    players.forEach(player => {
      const role = player.position || 'UNKNOWN';
      if (!organized[role]) {
        organized[role] = [];
      }
      organized[role].push(player);
    });
    
    // Ordina per cognome all'interno di ogni ruolo
    Object.keys(organized).forEach(role => {
      organized[role].sort((a, b) => {
        const lastNameA = (a.lastName || '').toLowerCase();
        const lastNameB = (b.lastName || '').toLowerCase();
        return lastNameA.localeCompare(lastNameB);
      });
    });
    
    return organized;
  }, [players]);

  // Helper: mostrare segmenti in base al mode
  const show = {
    period: true,
    sessionType: true,
    roles: mode === 'players',
    status: mode === 'players',
    search: false, // ⬅️ DISABILITATO: sempre nascosto, usiamo dropdown giocatori
    players: showPlayers, // ⬅️ NUOVO: mostra dropdown giocatori
    sort: showSort, // ⬅️ CONDIZIONALE: solo se showSort=true
    normalize: showNormalize, // ⬅️ CONDIZIONALE: solo se showNormalize=true
    density: true
  };

  // regole smart normalizzazione
  const setSessionType = (v) => {
    updateFilter('sessionType', v);
    if (v === "match" && filters.normalize !== "per90") updateFilter('normalize', 'per90');
    if (v === "training" && filters.normalize !== "perMin") updateFilter('normalize', 'perMin');
  };

  const handleDateSelect = (dateRange) => {
    setCustomDateRange(dateRange);
    // Aggiorna i filtri con le date personalizzate
    updateFilter('period', 'custom');
    updateFilter('startDate', dateRange.startDate);
    updateFilter('endDate', dateRange.endDate);
    // Chiudi il datepicker
    setIsDatePickerOpen(false);
  };

  return (
    <div className="filters-wrap">
      {/* Riga 1: Filtri Principali */}
      <div className="row primary">
        {show.search && (
          <div className="search">
            <Search size={16} />
            <input
              placeholder="Cerca giocatore…"
              value={filters.search || ""}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
        )}

        {/* Dropdown Giocatori */}
        {show.players && (
          <div className="filter-group">
            <span className="filter-label">Giocatore</span>
            <select
              className="filter-select"
              value={filters.players && filters.players.length > 0 ? filters.players[0] : 'all'}
              onChange={(e) => {
                const playerId = e.target.value;
                updateFilter('players', playerId === 'all' ? [] : [playerId]);
              }}
            >
              <option value="all">Tutti i giocatori</option>
              {Object.entries(organizedPlayers).map(([role, rolePlayers]) => (
                <React.Fragment key={role}>
                  <optgroup label={role === 'GOALKEEPER' ? 'Portieri' : 
                                  role === 'DEFENDER' ? 'Difensori' : 
                                  role === 'MIDFIELDER' ? 'Centrocampisti' : 
                                  role === 'FORWARD' ? 'Attaccanti' : role}>
                    {rolePlayers.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.firstName} {player.lastName}
                        {player.shirtNumber && ` #${player.shirtNumber}`}
                      </option>
                    ))}
                  </optgroup>
                </React.Fragment>
              ))}
            </select>
          </div>
        )}

        {/* Periodo */}
        <Segmented
          ariaLabel="Periodo"
          value={filters.period}
          onChange={(v) => {
            updateFilter('period', v);
            if (v === "custom") {
              setIsDatePickerOpen(true);
            }
          }}
          options={[
            { value: "week", label: "Ultima Settimana" },
            { value: "month", label: "Ultimo Mese" },
            { value: "quarter", label: "Ultimo Trimestre" },
            ...(mode === 'dossier' ? [{ value: "custom", label: "Personalizzato" }] : [])
          ]}
        />

        {/* Tipo Sessione */}
        <Segmented
          ariaLabel="Tipo sessione"
          value={filters.sessionType}
          onChange={setSessionType}
          options={[
            { value: "all", label: "Tutte" },
            { value: "training", label: "Allenamento" },
            { value: "match", label: "Partita" },
            { value: "test", label: "Test" }
          ]}
        />

        {/* Stato */}
        {show.status && (
          <Segmented
            ariaLabel="Stato giocatore"
            value={filters.status}
            onChange={(v) => updateFilter('status', v)}
            options={[
              { value: "all", label: "Tutti gli stati" },
              { value: "active", label: "Attivo" },
              { value: "return", label: "Rientro" },
              { value: "injured", label: "OUT" }
            ]}
          />
        )}
      </div>

      {/* Riga 2: Ruoli e Metriche */}
      <div className="row secondary">
        {/* Ruoli (multi) con badge contatore */}
        {show.roles && (
          <div className="roles-section">
            <Segmented
              size="sm"
              ariaLabel="Ruoli"
              multi
              value={filters.roles}
              onChange={(vals) => updateFilter('roles', vals)}
              options={[
                { value: "POR", label: "Portieri" },
                { value: "DIF", label: "Difensori" },
                { value: "CEN", label: "Centrocampisti" },
                { value: "ATT", label: "Attaccanti" }
              ]}
            />
            {filters.roles.length < 4 && (
              <span className="active-badge">({filters.roles.length} attivo)</span>
            )}
          </div>
        )}

        {/* Normalizzazione */}
        {show.normalize && (
          <Segmented
            size="sm"
            ariaLabel="Normalizzazione"
            value={filters.normalize}
            onChange={(v) => updateFilter('normalize', v)}
            options={[
              { value: "absolute", label: "Assoluti" },
              { value: "per90", label: "90'" },
              { value: "perMin", label: "min" }
            ]}
          />
        )}

        {/* Ordinamento (segmentato leggero) */}
        {show.sort && (
          <Segmented
            size="sm"
            ariaLabel="Ordinamento"
            value={filters.sortBy}
            onChange={(v) => updateFilter('sortBy', v)}
            options={[
              { value: "acwr", label: "ACWR" },
              { value: "plMin", label: "PL/min" },
              { value: "hsr", label: "HSR" },
              { value: "sprintPer90", label: "Sprint/90" },
              { value: "topSpeed", label: "Vel. max" },
              { value: "name", label: "Nome" }
            ]}
          />
        )}

                 {/* Densità */}
         <div className="density-toggle">
           <button
             className={`filter-btn ${filters.density === 'compact' ? 'active' : ''}`}
             onClick={() => updateFilter('density', 'compact')}
           >
             Compatta
           </button>
           <button
             className={`filter-btn ${filters.density === 'medium' ? 'active' : ''}`}
             onClick={() => updateFilter('density', 'medium')}
           >
             Media
           </button>
           <button
             className={`filter-btn ${filters.density === 'wide' ? 'active' : ''}`}
             onClick={() => updateFilter('density', 'wide')}
           >
             Ampia
           </button>
         </div>

        <div className="spacer" />
        
        {/* Bottoni compatti */}
        <button className="btn compact" onClick={onOpenAdvanced} title="Opzioni avanzate">
          ⚙️ Avanzati
        </button>
        <button className="btn compact" onClick={onOpenLayout} title="Layout">
          🖥️
        </button>
      </div>

      {/* Chips Attive */}
      <ActiveFiltersChips filters={filters} updateFilter={updateFilter} customDateRange={customDateRange} />

      {/* DatePicker */}
      <DatePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onDateSelect={handleDateSelect}
        startDate={startDate || customDateRange.startDate}
        endDate={endDate || customDateRange.endDate}
      />
    </div>
  );
}
