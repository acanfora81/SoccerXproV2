import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import { Plus, Trash2, Edit3, XCircle, Clock, CheckCircle, Save } from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './RegionalAdditionalsPage.css';
import '../../styles/tax-rates-list.css';

const RegionalAdditionalsPage = () => {
  const { user } = useAuthStore();
  const [additionals, setAdditionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    additional: null
  });
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    region: '',
    isProgressive: false,
    flatRate: '',
    brackets: [{ min: 0, max: '', rate: '' }]
  });

  // Carica addizionali regionali
  const loadAdditionals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/taxrates/regional-additionals');
      if (response.data.success) {
        setAdditionals(response.data.data);
      } else {
        setError('Errore nel caricamento delle addizionali regionali');
      }
    } catch (err) {
      console.error('Errore caricamento addizionali regionali:', err);
      setError('Errore nel caricamento delle addizionali regionali');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdditionals();
  }, []);

  // Gestione form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gestione scaglioni
  const addBracket = () => {
    setFormData(prev => ({
      ...prev,
      brackets: [...prev.brackets, { min: '', max: '', rate: '' }]
    }));
  };

  const removeBracket = (index) => {
    if (formData.brackets.length > 1) {
      setFormData(prev => ({
        ...prev,
        brackets: prev.brackets.filter((_, i) => i !== index)
      }));
    }
  };

  const updateBracket = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      brackets: prev.brackets.map((bracket, i) => 
        i === index ? { ...bracket, [field]: value } : bracket
      )
    }));
  };

  // Salva addizionale
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validazione
      if (formData.isProgressive) {
        // Validazione scaglioni
        for (let i = 0; i < formData.brackets.length; i++) {
          const bracket = formData.brackets[i];
          if (bracket.min === '' || bracket.min === null || bracket.rate === '' || bracket.rate === null) {
            setError(`Scaglione ${i + 1}: compilare tutti i campi obbligatori`);
            setLoading(false);
            return;
          }
          const currMin = parseFloat(String(bracket.min).toString().replace(',', '.'));
          const prevMin = i > 0 ? parseFloat(String(formData.brackets[i-1].min).toString().replace(',', '.')) : -Infinity;
          const currRate = parseFloat(String(bracket.rate).toString().replace(',', '.'));
          if (isNaN(currMin) || isNaN(currRate) || currRate < 0) {
            setError(`Scaglione ${i + 1}: inserire valori validi; l'aliquota non può essere negativa`);
            setLoading(false);
            return;
          }
          if (i > 0 && currMin <= prevMin) {
            setError(`Scaglione ${i + 1}: il valore minimo deve essere maggiore del precedente`);
            setLoading(false);
            return;
          }
        }
      } else {
        // Validazione tasso fisso
        if (formData.flatRate === '' || formData.flatRate === null || formData.flatRate === undefined) {
          setError('Inserire il tasso fisso (può essere 0)');
          setLoading(false);
          return;
        }
      }

      // Normalizzazione numeri in formato IT (virgola -> punto)
      const toFloat = (v) => v === '' || v === null || v === undefined ? null : parseFloat(String(v).replace(',', '.'));
      const normalizedPayload = formData.isProgressive
        ? {
            ...formData,
            flatRate: null,
            brackets: formData.brackets.map(b => ({
              min: toFloat(b.min) ?? 0,
              max: b.max === '' ? null : toFloat(b.max),
              rate: toFloat(b.rate) ?? 0
            }))
          }
        : {
            ...formData,
            flatRate: toFloat(formData.flatRate) ?? 0,
            brackets: []
          };

      console.log('🔵 Invio dati addizionale regionale (normalizzato):', normalizedPayload);
      const response = await axios.post('/api/taxrates/regional-additionals', normalizedPayload);
      console.log('🔵 Risposta API:', response.data);
      
      if (response.data.success) {
        await loadAdditionals();
        setShowAddForm(false);
        resetForm();
        setEditingId(null);
        setError(null);
      } else {
        setError(response.data.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      console.error('Errore salvataggio addizionale regionale:', err);
      setError(err.response?.data?.error || 'Errore nel salvataggio dell\'addizionale regionale');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      region: '',
      isProgressive: false,
      flatRate: '',
      brackets: [{ min: 0, max: '', rate: '' }]
    });
  };

  // Elimina addizionale
  const handleDelete = (additional) => {
    setDeleteConfirm({
      isOpen: true,
      additional: additional
    });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({
      isOpen: false,
      additional: null
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.additional) return;

    try {
      const response = await axios.delete(`/api/taxrates/regional-additionals/${deleteConfirm.additional.id}`);
      if (response.data.success) {
        await loadAdditionals();
        setDeleteConfirm({
          isOpen: false,
          additional: null
        });
      } else {
        setError(response.data.error || 'Errore nell\'eliminazione');
      }
    } catch (err) {
      console.error('Errore eliminazione addizionale regionale:', err);
      setError('Errore nell\'eliminazione dell\'addizionale regionale');
    }
  };

  // Modifica addizionale
  const handleEdit = (additional) => {
    setEditingId(additional.id);
    setShowAddForm(true);

    if (additional.is_progressive) {
      setFormData({
        year: additional.year,
        region: additional.region,
        isProgressive: true,
        flatRate: '',
        brackets: (additional.tax_regional_additional_bracket || []).map(b => ({
          min: String(b.min).replace('.', ','),
          max: b.max === null || b.max === undefined ? '' : String(b.max).replace('.', ','),
          rate: String(b.rate).replace('.', ',')
        }))
      });
    } else {
      setFormData({
        year: additional.year,
        region: additional.region,
        isProgressive: false,
        flatRate: String(additional.flat_rate ?? additional.rate ?? '').replace('.', ','),
        brackets: [{ min: 0, max: '', rate: '' }]
      });
    }
  };

  // Annulla modifica
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="regional-additionals-page">
        <div className="loading">Caricamento addizionali regionali...</div>
      </div>
    );
  }

  return (
    <div className="regional-additionals-page">
      <div className="page-header">
        <h1>Gestione Addizionali Regionali</h1>
        <p>Visualizza e gestisci le addizionali regionali per i calcoli fiscali</p>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <div className="controls">
        <div className="region-selector">
          <label>Regione:</label>
          <select 
            value={selectedRegion} 
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="">Tutte le regioni</option>
            <option value="Marche">Marche</option>
            <option value="Lombardia">Lombardia</option>
            <option value="Lazio">Lazio</option>
            <option value="Emilia-Romagna">Emilia-Romagna</option>
            <option value="Toscana">Toscana</option>
            <option value="Veneto">Veneto</option>
            <option value="Piemonte">Piemonte</option>
            <option value="Campania">Campania</option>
            <option value="Puglia">Puglia</option>
            <option value="Sicilia">Sicilia</option>
            <option value="Calabria">Calabria</option>
            <option value="Sardegna">Sardegna</option>
            <option value="Liguria">Liguria</option>
            <option value="Abruzzo">Abruzzo</option>
            <option value="Umbria">Umbria</option>
            <option value="Basilicata">Basilicata</option>
            <option value="Molise">Molise</option>
            <option value="Valle d'Aosta">Valle d'Aosta</option>
            <option value="Trentino-Alto Adige">Trentino-Alto Adige</option>
            <option value="Friuli-Venezia Giulia">Friuli-Venezia Giulia</option>
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
                Aggiungi Addizionale
              </>
            )}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-form">
          <h3>➕ Aggiungi Addizionale Regionale</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-fields">
            <div className="input-group">
              <label>Anno:</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="2020"
                max="2030"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Regione:</label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleziona regione</option>
                <option value="Marche">Marche</option>
                <option value="Lombardia">Lombardia</option>
                <option value="Lazio">Lazio</option>
                <option value="Emilia-Romagna">Emilia-Romagna</option>
                <option value="Toscana">Toscana</option>
                <option value="Veneto">Veneto</option>
                <option value="Piemonte">Piemonte</option>
                <option value="Campania">Campania</option>
                <option value="Puglia">Puglia</option>
                <option value="Sicilia">Sicilia</option>
                <option value="Calabria">Calabria</option>
                <option value="Sardegna">Sardegna</option>
                <option value="Liguria">Liguria</option>
                <option value="Abruzzo">Abruzzo</option>
                <option value="Umbria">Umbria</option>
                <option value="Basilicata">Basilicata</option>
                <option value="Molise">Molise</option>
                <option value="Valle d'Aosta">Valle d'Aosta</option>
                <option value="Trentino-Alto Adige">Trentino-Alto Adige</option>
                <option value="Friuli-Venezia Giulia">Friuli-Venezia Giulia</option>
              </select>
            </div>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isProgressive"
                  checked={formData.isProgressive}
                  onChange={handleInputChange}
                />
                <span>Addizionale progressiva (a scaglioni)</span>
              </label>
            </div>
          </div>

          {formData.isProgressive ? (
            <div className="brackets-form">
              {formData.brackets.map((bracket, index) => (
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
                        max="10"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  {formData.brackets.length > 1 && (
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); removeBracket(index); }}
                      className="btn btn-danger btn-small"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              
              <button type="button" onClick={(e) => { e.preventDefault(); addBracket(); }} className="btn btn-secondary">
                <Plus size={14} />
                Aggiungi Scaglione
              </button>
            </div>
          ) : (
            <div className="input-group">
              <label>Tasso Fisso (%):</label>
              <input
                type="number"
                name="flatRate"
                value={formData.flatRate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                max="10"
                placeholder="es. 1.23"
                required
              />
            </div>
          )}

            <div className="form-actions">
              <button 
                type="submit"
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
                    Salva Addizionale
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="additionals-list">
        <h3>📋 Addizionali Regionali Configurate</h3>
        
        {additionals.length === 0 ? (
          <div className="no-data">
            <p>Nessuna addizionale regionale trovata</p>
            <p>Usa il pulsante "Aggiungi Addizionale" per crearne di nuove.</p>
          </div>
        ) : (
          <div className="additionals-table">
            <table>
              <thead>
                <tr>
                  <th>Anno</th>
                  <th>Regione</th>
                  <th>Tipo</th>
                  <th>Configurazione</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {additionals.map((additional) => (
                  <tr key={additional.id}>
                    <td>{additional.year}</td>
                    <td>{additional.region}</td>
                    <td>
                      <span className={`badge ${additional.is_progressive ? 'badge-progressive' : 'badge-flat'}`}>
                        {additional.is_progressive ? 'Progressiva' : 'Fissa'}
                      </span>
                    </td>
                    <td>
                      {additional.is_progressive ? (
                        <span>{additional.tax_regional_additional_bracket?.length || 0} scaglioni</span>
                      ) : (
                        <span>{additional.flat_rate}%</span>
                      )}
                    </td>
                    <td className="actions-cell" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        className="action-btn edit-icon-only"
                        onClick={() => handleEdit(additional)}
                        title="Modifica"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        className="action-btn delete-icon-only"
                        onClick={() => handleDelete(additional)}
                        title="Elimina"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
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
        title="Elimina Addizionale Regionale"
        message={`Sei sicuro di voler eliminare l'addizionale regionale per ${deleteConfirm.additional?.region} (${deleteConfirm.additional?.year})?`}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />
    </div>
  );
};

export default RegionalAdditionalsPage;
