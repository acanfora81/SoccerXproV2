// client/src/modules/filters/FiltersBar.jsx
// Componente unico per la barra filtri centralizzata

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useFilters } from './FiltersProvider.jsx';
import { FILTER_OPTIONS } from './filtersConfig.js';
import { buildPerformanceQuery } from './filtersUtils.js';
import './filters.css';

// Icone SVG inline
const SearchIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CalendarIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', strokeWidth: '2.5px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', strokeWidth: '2.5px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// Componente DatePicker
function DatePicker({ isOpen, onClose, onDateSelect, startDate, endDate }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedStart, setSelectedStart] = useState(startDate ? new Date(startDate) : null);
  const [selectedEnd, setSelectedEnd] = useState(endDate ? new Date(endDate) : null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const handleDateClick = (date) => {
    if (!selectingEnd || !selectedStart || date < selectedStart) {
      setSelectedStart(date);
      setSelectedEnd(null);
      setSelectingEnd(true);
    } else {
      setSelectedEnd(date);
      setSelectingEnd(false);
    }
  };

  const handleApply = () => {
    console.log('🟢 DatePicker handleApply chiamato'); // 🔧 DEBUG
    if (selectedStart && selectedEnd) {
      const startStr = selectedStart.getFullYear() + '-' + 
        String(selectedStart.getMonth() + 1).padStart(2, '0') + '-' + 
        String(selectedStart.getDate()).padStart(2, '0');
      const endStr = selectedEnd.getFullYear() + '-' + 
        String(selectedEnd.getMonth() + 1).padStart(2, '0') + '-' + 
        String(selectedEnd.getDate()).padStart(2, '0');

      console.log('🟢 DatePicker - Date selezionate:', { startStr, endStr }); // 🔧 DEBUG
      onDateSelect({
        start: startStr,
        end: endStr
      });
      onClose();
    } else {
      console.log('🔴 DatePicker - Date mancanti:', { selectedStart, selectedEnd }); // 🔧 DEBUG
    }
  };

  const handleCancel = () => {
    setSelectedStart(startDate ? new Date(startDate) : null);
    setSelectedEnd(endDate ? new Date(endDate) : null);
    setSelectingEnd(false);
    onClose();
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isInRange = (date) => {
    if (!selectedStart || !selectedEnd) return false;
    return date >= selectedStart && date <= selectedEnd;
  };

  const isSelected = (date) => {
    return (selectedStart && date.getTime() === selectedStart.getTime()) ||
           (selectedEnd && date.getTime() === selectedEnd.getTime());
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Aggiungi giorni vuoti all'inizio
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="day empty"></div>);
    }

    // Aggiungi giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isRange = isInRange(date);
      const isSelectedDay = isSelected(date);
      
      days.push(
        <button
          key={day}
          className={`day ${isSelectedDay ? 'selected' : ''} ${isRange ? 'in-range' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  if (!isOpen) return null;

  return (
    <div className="datepicker-overlay" onClick={onClose}>
      <div className="datepicker" onClick={(e) => e.stopPropagation()}>
        <div className="datepicker-header">
          <h3>Seleziona Periodo</h3>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="datepicker-body">
          <div className="month-navigation">
            <button 
              className="nav-btn" 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            >
              <ChevronLeftIcon />
            </button>
            <span className="month-title">
              {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              className="nav-btn" 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            >
              <ChevronRightIcon />
            </button>
          </div>
          
          <div className="calendar-grid">
            <div className="weekdays">
              {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            <div className="days">
              {renderCalendar()}
            </div>
          </div>
        </div>
        
        <div className="datepicker-footer">
          <div className="selected-range">
            {selectedStart && selectedEnd ? (
              `${selectedStart.toLocaleDateString('it-IT')} - ${selectedEnd.toLocaleDateString('it-IT')}`
            ) : (
              'Seleziona un periodo'
            )}
          </div>
          <div className="datepicker-actions">
            <button className="btn-secondary" onClick={handleCancel}>
              Annulla
            </button>
            <button 
              className="btn-primary" 
              onClick={handleApply}
              disabled={!selectedStart || !selectedEnd}
            >
              Applica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FiltersBar({
  showSort = false,
  showSearch = false,
  mode = 'compact'
}) {
  const { filters, updateFilter } = useFilters();
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Gestione periodo personalizzato
  const handlePeriodChange = useCallback((period) => {
    console.log('🟢 handlePeriodChange chiamato con:', period); // 🔧 DEBUG
    if (period === 'custom') {
      console.log('🟢 Apertura DatePicker per periodo personalizzato'); // 🔧 DEBUG
      setShowDatePicker(true);
    } else {
      updateFilter('period', period);
      // Reset date personalizzate se non è custom
      updateFilter('startDate', null);
      updateFilter('endDate', null);
    }
  }, [updateFilter]);

  const handleDateSelect = useCallback(({ start, end }) => {
    console.log('🟢 handleDateSelect chiamato con:', { start, end }); // 🔧 DEBUG
    updateFilter('period', 'custom'); // 🔧 FIX: Aggiorna il periodo a 'custom'
    updateFilter('startDate', start);
    updateFilter('endDate', end);
    console.log('🟢 Filtri aggiornati: period=custom, startDate=' + start + ', endDate=' + end); // 🔧 DEBUG
  }, [updateFilter]);

  // Filtri attivi per rimozione
  const activeFilters = useMemo(() => {
    const active = [];
    
    if (filters.search) active.push({ key: 'search', label: `Ricerca: ${filters.search}` });
    if (filters.period === 'custom' && filters.startDate && filters.endDate) {
      active.push({ 
        key: 'customPeriod', 
        label: `Periodo: ${filters.startDate} - ${filters.endDate}` 
      });
    }
    if (filters.sessionType && filters.sessionType !== 'all') {
      const sessionType = FILTER_OPTIONS.sessionType.find(s => s.value === filters.sessionType);
      active.push({ key: 'sessionType', label: `Sessione: ${sessionType?.label || filters.sessionType}` });
    }
    if (filters.sessionName && filters.sessionName !== 'all') {
      const sessionName = FILTER_OPTIONS.sessionName?.find(s => s.value === filters.sessionName);
      active.push({ key: 'sessionName', label: `Dettaglio: ${sessionName?.label || filters.sessionName}` });
    }
    if (filters.roles && filters.roles.length > 0 && filters.roles.length < 4) {
      const roleLabels = filters.roles.map(r => {
        const role = FILTER_OPTIONS.roles.find(role => role.value === r);
        return role?.label || r;
      });
      active.push({ key: 'roles', label: `Ruoli: ${roleLabels.join(', ')}` });
    }
    
    return active;
  }, [filters]);

  const removeFilter = useCallback((key) => {
    switch (key) {
      case 'search':
        updateFilter('search', '');
        break;
      case 'customPeriod':
        updateFilter('period', 'week');
        updateFilter('startDate', null);
        updateFilter('endDate', null);
        break;
      case 'sessionType':
        updateFilter('sessionType', 'all');
        break;
      case 'sessionName':
        updateFilter('sessionName', 'all');
        break;
      case 'roles':
        updateFilter('roles', []);
        break;
    }
  }, [updateFilter]);

  return (
    <>
      <div className="filters-container">
        {/* 🎯 FILTRI UNIFORMI - Tutti dropdown compatti */}
        <div className="filters-row">
          {/* 🔍 Ricerca */}
          {showSearch && (
            <div className="filter-group">
              <div className="filter-label">Ricerca</div>
              <div className="filter-search">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Cerca giocatori..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 👤 DROPDOWN GIOCATORI - RIMOSSO: non più necessario con toggle Team/Player */}

          {/* 📅 Periodo */}
          <div className="filter-group">
            <div className="filter-label">Periodo</div>
            <div className="filter-select">
              <select
                value={filters.period}
                onChange={(e) => handlePeriodChange(e.target.value)}
              >
                {FILTER_OPTIONS.period.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 🏃‍♂️ Tipo Sessione */}
          <div className="filter-group">
            <div className="filter-label">Tipo Sessione</div>
            <div className="filter-select">
              <select
                value={filters.sessionType}
                onChange={(e) => updateFilter('sessionType', e.target.value)}
              >
                {FILTER_OPTIONS.sessionType.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 🎯 Dettaglio Sessione */}
          <div className="filter-group">
            <div className="filter-label">Dettaglio Sessione</div>
            <div className="filter-select">
              <select
                value={filters.sessionName}
                onChange={(e) => updateFilter('sessionName', e.target.value)}
              >
                {FILTER_OPTIONS.sessionName?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )) || (
                  <>
                    <option value="all">Tutte</option>
                    <option value="Aerobico">Aerobico</option>
                    <option value="Intermittente">Intermittente</option>
                    <option value="Situazionale">Situazionale</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* 👥 Ruoli */}
          <div className="filter-group">
            <div className="filter-label">Ruoli</div>
            <div className="filter-select">
              <select
                value={filters.roles?.length === 0 ? 'all' : filters.roles?.join(',')}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all') {
                    updateFilter('roles', []);
                  } else {
                    updateFilter('roles', [value]);
                  }
                }}
              >
                <option value="all">Tutti i ruoli</option>
                {FILTER_OPTIONS.roles.filter(r => r.value !== 'all').map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Filtri attivi per rimozione */}
        {activeFilters.length > 0 && (
          <div className="active-filters">
            {activeFilters.map(filter => (
              <div key={filter.key} className="filter-chip">
                {filter.label}
                <button onClick={() => removeFilter(filter.key)}>
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DatePicker per periodo personalizzato */}
      <DatePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelect}
        startDate={filters.startDate}
        endDate={filters.endDate}
      />
    </>
  );
}

export default FiltersBar;
