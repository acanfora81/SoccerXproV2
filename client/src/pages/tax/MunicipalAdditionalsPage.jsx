import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import { Plus, Trash2, Edit3, XCircle, Clock, CheckCircle, Save } from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './MunicipalAdditionalsPage.css';
import '../../styles/tax-rates-list.css';

const MunicipalAdditionalsPage = () => {
  const { user } = useAuthStore();
  const [additionals, setAdditionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    additional: null
  });
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    region: '',
    municipality: '',
    isProgressive: false,
    flatRate: '',
    brackets: [{ min: 0, max: '', rate: '' }]
  });

  // Carica addizionali comunali
  const loadAdditionals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/taxrates/municipal-additionals');
      if (response.data.success) {
        setAdditionals(response.data.data);
      } else {
        setError('Errore nel caricamento delle addizionali comunali');
      }
    } catch (err) {
      console.error('Errore caricamento addizionali comunali:', err);
      setError('Errore nel caricamento delle addizionali comunali');
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

  // Helper per normalizzare e parsare numeri (virgola -> punto)
  const normalizeAndParseNumber = (value) => {
    if (typeof value !== 'string') return value;
    const normalized = value.replace(',', '.');
    return parseFloat(normalized);
  };

  // Salva addizionale
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log('🔵 Municipal Submit - FormData:', formData);
    
    try {
      const dataToSend = { ...formData };
      
      if (!dataToSend.isProgressive) {
        // Validazione tasso fisso
        if (dataToSend.flatRate === '' || dataToSend.flatRate === null || dataToSend.flatRate === undefined) {
          setError('Inserire il tasso fisso (può essere 0)');
          setLoading(false);
          return;
        }
        
        dataToSend.flatRate = normalizeAndParseNumber(dataToSend.flatRate);
        if (isNaN(dataToSend.flatRate) || dataToSend.flatRate < 0) {
          setError('Il tasso fisso deve essere un numero valido e non negativo');
          setLoading(false);
          return;
        }
      } else {
        // Validazione scaglioni
        dataToSend.brackets = dataToSend.brackets.map(b => ({
          min: normalizeAndParseNumber(b.min),
          max: b.max ? normalizeAndParseNumber(b.max) : null,
          rate: normalizeAndParseNumber(b.rate)
        }));
        
        // Additional validation for brackets
        for (let i = 0; i < dataToSend.brackets.length; i++) {
          const bracket = dataToSend.brackets[i];
          if (isNaN(bracket.min) || isNaN(bracket.rate) || bracket.rate < 0) {
            setError(`Scaglione ${i + 1}: inserire valori validi; l'aliquota non può essere negativa`);
            setLoading(false);
            return;
          }
          if (i > 0 && bracket.min <= dataToSend.brackets[i-1].min) {
            setError(`Scaglione ${i + 1}: il valore minimo deve essere maggiore del precedente`);
            setLoading(false);
            return;
          }
        }
      }

      console.log('🔵 Invio dati addizionale comunale (normalizzato):', dataToSend);
      console.log('🔵 Invio POST a:', '/api/taxrates/municipal-additionals');
      
      const response = await axios.post('/api/taxrates/municipal-additionals', dataToSend);
      console.log('🟢 Risposta ricevuta:', response);
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
      console.error('❌ Errore salvataggio addizionale comunale:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error request:', err.request);
      console.error('❌ Error message:', err.message);
      
      if (err.code === 'NETWORK_ERROR' || err.code === 'ERR_NETWORK') {
        setError('Errore di connessione al server. Verifica che il server sia attivo.');
      } else if (err.response) {
        setError(err.response?.data?.error || `Errore server: ${err.response.status}`);
      } else if (err.request) {
        setError('Nessuna risposta dal server. Verifica la connessione.');
      } else {
        setError('Errore nel salvataggio dell\'addizionale comunale');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      region: '',
      municipality: '',
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
      const response = await axios.delete(`/api/taxrates/municipal-additionals/${deleteConfirm.additional.id}`);
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
      console.error('Errore eliminazione addizionale comunale:', err);
      setError('Errore nell\'eliminazione dell\'addizionale comunale');
    }
  };

  // Modifica addizionale
  const handleEdit = (additional) => {
    // Prefill form with selected additional
    setEditingId(additional.id);
    setShowAddForm(true);

    if (additional.is_progressive) {
      setFormData({
        year: additional.year,
        region: additional.region,
        municipality: additional.municipality,
        isProgressive: true,
        flatRate: '',
        brackets: (additional.tax_municipal_additional_bracket || []).map(b => ({
          min: String(b.min).replace('.', ','),
          max: b.max === null || b.max === undefined ? '' : String(b.max).replace('.', ','),
          rate: String(b.rate).replace('.', ',')
        }))
      });
    } else {
      setFormData({
        year: additional.year,
        region: additional.region,
        municipality: additional.municipality,
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
      <div className="municipal-additionals-page">
        <div className="loading">Caricamento addizionali comunali...</div>
      </div>
    );
  }

  return (
    <div className="municipal-additionals-page">
      <div className="page-header">
        <h1>Gestione Addizionali Comunali</h1>
        <p>Visualizza e gestisci le addizionali comunali per i calcoli fiscali</p>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <div className="controls">
        <div className="municipality-selector">
          <label>Comune:</label>
          <select 
            value={selectedMunicipality} 
            onChange={(e) => setSelectedMunicipality(e.target.value)}
          >
            <option value="">Tutti i comuni</option>
            <option value="Pesaro">Pesaro</option>
            <option value="Roma">Roma</option>
            <option value="Milano">Milano</option>
            <option value="Napoli">Napoli</option>
            <option value="Torino">Torino</option>
            <option value="Firenze">Firenze</option>
            <option value="Bologna">Bologna</option>
            <option value="Venezia">Venezia</option>
            <option value="Genova">Genova</option>
            <option value="Bari">Bari</option>
            <option value="Palermo">Palermo</option>
            <option value="Catania">Catania</option>
            <option value="Messina">Messina</option>
            <option value="Verona">Verona</option>
            <option value="Padova">Padova</option>
            <option value="Trieste">Trieste</option>
            <option value="Brescia">Brescia</option>
            <option value="Parma">Parma</option>
            <option value="Modena">Modena</option>
            <option value="Reggio Emilia">Reggio Emilia</option>
            <option value="Ravenna">Ravenna</option>
            <option value="Ferrara">Ferrara</option>
            <option value="Rimini">Rimini</option>
            <option value="Ancona">Ancona</option>
            <option value="Perugia">Perugia</option>
            <option value="Terni">Terni</option>
            <option value="L'Aquila">L'Aquila</option>
            <option value="Pescara">Pescara</option>
            <option value="Chieti">Chieti</option>
            <option value="Teramo">Teramo</option>
            <option value="Campobasso">Campobasso</option>
            <option value="Potenza">Potenza</option>
            <option value="Matera">Matera</option>
            <option value="Catanzaro">Catanzaro</option>
            <option value="Cosenza">Cosenza</option>
            <option value="Crotone">Crotone</option>
            <option value="Vibo Valentia">Vibo Valentia</option>
            <option value="Reggio Calabria">Reggio Calabria</option>
            <option value="Cagliari">Cagliari</option>
            <option value="Sassari">Sassari</option>
            <option value="Nuoro">Nuoro</option>
            <option value="Oristano">Oristano</option>
            <option value="Carbonia">Carbonia</option>
            <option value="Iglesias">Iglesias</option>
            <option value="Olbia">Olbia</option>
            <option value="Aosta">Aosta</option>
            <option value="Trento">Trento</option>
            <option value="Bolzano">Bolzano</option>
            <option value="Udine">Udine</option>
            <option value="Gorizia">Gorizia</option>
            <option value="Trieste">Trieste</option>
            <option value="Pordenone">Pordenone</option>
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
          <h3>➕ Aggiungi Addizionale Comunale</h3>
          
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
            
            <div className="input-group">
              <label>Comune:</label>
              <input
                type="text"
                name="municipality"
                value={formData.municipality}
                onChange={handleInputChange}
                placeholder="es. Pesaro, Milano, Roma..."
                required
              />
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
        <h3>📋 Addizionali Comunali Configurate</h3>
        
        {additionals.length === 0 ? (
          <div className="no-data">
            <p>Nessuna addizionale comunale trovata</p>
            <p>Usa il pulsante "Aggiungi Addizionale" per crearne di nuove.</p>
          </div>
        ) : (
          <div className="additionals-table">
            <table>
              <thead>
                <tr>
                  <th>Anno</th>
                  <th>Regione</th>
                  <th>Comune</th>
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
                    <td>{additional.municipality}</td>
                    <td>
                      <span className={`badge ${additional.is_progressive ? 'badge-progressive' : 'badge-flat'}`}>
                        {additional.is_progressive ? 'Progressiva' : 'Fissa'}
                      </span>
                    </td>
                    <td>
                      {additional.is_progressive ? (
                        <span>{additional.tax_municipal_additional_bracket?.length || 0} scaglioni</span>
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
        title="Elimina Addizionale Comunale"
        message={`Sei sicuro di voler eliminare l'addizionale comunale per ${deleteConfirm.additional?.municipality} (${deleteConfirm.additional?.year})?`}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />
    </div>
  );
};

export default MunicipalAdditionalsPage;
