import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import axios from 'axios';
import { Plus, Trash2, Save, Clock, XCircle } from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './IrpefBracketsPage.css';

const IrpefBracketsPage = () => {
  const { user } = useAuthStore();
  const [brackets, setBrackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, year: null });
  const [deleteBracketConfirm, setDeleteBracketConfirm] = useState({ isOpen: false, index: null });
  const [successMessage, setSuccessMessage] = useState({ isOpen: false, message: '' });
  const [newBrackets, setNewBrackets] = useState([
    { min: 0, max: 15000, rate: 23 },
    { min: 15000, max: 28000, rate: 25 },
    { min: 28000, max: 50000, rate: 35 },
    { min: 50000, max: null, rate: 43 }
  ]);

  useEffect(() => {
    fetchBrackets();
  }, [selectedYear]);

  const fetchBrackets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/taxrates/irpef-brackets?year=${selectedYear}`);
      
      if (response.data.success) {
        setBrackets(response.data.data);
      } else {
        setError('Errore nel recupero degli scaglioni IRPEF');
      }
    } catch (err) {
      console.error('Errore fetch brackets:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrackets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/taxrates/irpef-brackets', {
        year: selectedYear,
        brackets: newBrackets
      });
      
      if (response.data.success) {
        setSuccessMessage({ isOpen: true, message: response.data.message });
        setShowAddForm(false);
        fetchBrackets();
      } else {
        setError(response.data.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      console.error('Errore salvataggio brackets:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYear = () => {
    setDeleteConfirm({ isOpen: true, year: selectedYear });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, year: null });
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.delete(`/api/taxrates/irpef-brackets/${deleteConfirm.year}`);
      
      if (response.data.success) {
        setSuccessMessage({ isOpen: true, message: response.data.message });
        fetchBrackets();
      } else {
        setError(response.data.error || 'Errore nell\'eliminazione');
      }
    } catch (err) {
      console.error('Errore eliminazione brackets:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
      setDeleteConfirm({ isOpen: false, year: null });
    }
  };

  const updateBracket = (index, field, value) => {
    const updated = [...newBrackets];
    if (field === 'max' && value === '') {
      updated[index][field] = null;
    } else {
      updated[index][field] = field === 'rate' ? parseFloat(value) : parseFloat(value);
    }
    setNewBrackets(updated);
  };

  const addBracket = () => {
    setNewBrackets([...newBrackets, { min: 0, max: null, rate: 0 }]);
  };

  const removeBracket = (index) => {
    if (newBrackets.length > 1) {
      setDeleteBracketConfirm({ isOpen: true, index: index });
    }
  };

  const handleCancelBracketDelete = () => {
    setDeleteBracketConfirm({ isOpen: false, index: null });
  };

  const handleConfirmBracketDelete = () => {
    if (deleteBracketConfirm.index !== null) {
      setNewBrackets(newBrackets.filter((_, i) => i !== deleteBracketConfirm.index));
    }
    setDeleteBracketConfirm({ isOpen: false, index: null });
  };

  if (loading && brackets.length === 0) {
    return (
      <div className="irpef-brackets-page">
        <div className="loading">Caricamento scaglioni IRPEF...</div>
      </div>
    );
  }

  return (
    <div className="irpef-brackets-page">
      <div className="page-header">
        <h1>📊 Gestione Scaglioni IRPEF</h1>
        <p>Visualizza e gestisci gli scaglioni IRPEF per i calcoli fiscali</p>
      </div>

      {error && (
        <div className="error-message">
          <XCircle size={16} />
          {error}
        </div>
      )}

      <div className="controls">
        <div className="year-selector">
          <label>Anno:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div className="actions">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            {showAddForm ? (
              <>
                <XCircle size={16} />
                Annulla
              </>
            ) : (
              <>
                <Plus size={16} />
                Aggiungi Scaglioni
              </>
            )}
          </button>
          
          {brackets.length > 0 && (
            <button 
              onClick={handleDeleteYear}
              className="btn btn-danger"
              disabled={loading}
            >
              <Trash2 size={16} />
              Elimina Anno
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="add-form">
          <h3>➕ Aggiungi Scaglioni IRPEF per l'anno {selectedYear}</h3>
          
          <div className="brackets-form">
            {newBrackets.map((bracket, index) => (
              <div key={index} className="bracket-row">
                <div className="bracket-inputs">
                  <div className="input-group">
                    <label>Da (€):</label>
                    <input
                      type="number"
                      value={bracket.min}
                      onChange={(e) => updateBracket(index, 'min', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>A (€):</label>
                    <input
                      type="number"
                      value={bracket.max || ''}
                      onChange={(e) => updateBracket(index, 'max', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Lasciare vuoto per ∞"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Aliquota (%):</label>
                    <input
                      type="number"
                      value={bracket.rate}
                      onChange={(e) => updateBracket(index, 'rate', e.target.value)}
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>
                
                {newBrackets.length > 1 && (
                  <button 
                    onClick={() => removeBracket(index)}
                    className="btn btn-danger btn-small"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            
            <button onClick={addBracket} className="btn btn-secondary">
              <Plus size={14} />
              Aggiungi Scaglione
            </button>
          </div>
          
          <div className="form-actions">
            <button 
              onClick={handleSaveBrackets}
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Clock size={16} />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salva Scaglioni
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="brackets-list">
        <h3>📋 Scaglioni IRPEF per l'anno {selectedYear}</h3>
        
        {brackets.length === 0 ? (
          <div className="no-data">
            <p>Nessuno scaglione IRPEF trovato per l'anno {selectedYear}</p>
            <p>Usa il pulsante "Aggiungi Scaglioni" per crearne di nuovi.</p>
          </div>
        ) : (
          <div className="brackets-table">
            <table>
              <thead>
                <tr>
                  <th>Da (€)</th>
                  <th>A (€)</th>
                  <th>Aliquota (%)</th>
                  <th>Imposta (€)</th>
                </tr>
              </thead>
              <tbody>
                {brackets.map((bracket, index) => {
                  const prevBracket = index > 0 ? brackets[index - 1] : null;
                  const bracketMin = prevBracket ? prevBracket.max : 0;
                  const bracketMax = bracket.max || Infinity;
                  const bracketRange = bracketMax - bracketMin;
                  const taxAmount = bracketRange * (bracket.rate / 100);
                  
                  return (
                    <tr key={index}>
                      <td>{bracket.min.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                      <td>
                        {bracket.max ? 
                          bracket.max.toLocaleString('it-IT', { minimumFractionDigits: 2 }) : 
                          '∞'
                        }
                      </td>
                      <td>{bracket.rate}%</td>
                      <td>
                        {bracket.max ? 
                          taxAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 }) : 
                          '∞'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog di conferma eliminazione */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Elimina Scaglioni IRPEF"
        message={`Sei sicuro di voler eliminare tutti gli scaglioni IRPEF per l'anno ${deleteConfirm.year}?`}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      {/* Dialog di conferma eliminazione singolo scaglione */}
      <ConfirmDialog
        isOpen={deleteBracketConfirm.isOpen}
        onClose={handleCancelBracketDelete}
        onConfirm={handleConfirmBracketDelete}
        title="Elimina Scaglione"
        message="Sei sicuro di voler eliminare questo scaglione?"
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      {/* Dialog di successo */}
      <ConfirmDialog
        isOpen={successMessage.isOpen}
        onClose={() => setSuccessMessage({ isOpen: false, message: '' })}
        onConfirm={() => setSuccessMessage({ isOpen: false, message: '' })}
        title="Operazione Completata"
        message={successMessage.message}
        confirmText="Ok"
        cancelText=""
        type="success"
        showCancel={false}
      />
    </div>
  );
};

export default IrpefBracketsPage;
