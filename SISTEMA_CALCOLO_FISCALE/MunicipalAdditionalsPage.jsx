import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import './MunicipalAdditionalsPage.css';

const MunicipalAdditionalsPage = () => {
  const { user } = useAuthStore();
  const [additionals, setAdditionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  // Salva addizionale
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validazione
      if (formData.isProgressive) {
        // Validazione scaglioni
        for (let i = 0; i < formData.brackets.length; i++) {
          const bracket = formData.brackets[i];
          if (!bracket.min || !bracket.rate) {
            setError(`Scaglione ${i + 1}: compilare tutti i campi obbligatori`);
            return;
          }
          if (i > 0 && parseFloat(bracket.min) <= parseFloat(formData.brackets[i-1].min)) {
            setError(`Scaglione ${i + 1}: il valore minimo deve essere maggiore del precedente`);
            return;
          }
        }
      } else {
        // Validazione tasso fisso
        if (!formData.flatRate) {
          setError('Inserire il tasso fisso');
          return;
        }
      }

      const response = await axios.post('/api/taxrates/municipal-additionals', formData);
      if (response.data.success) {
        await loadAdditionals();
        setShowAddForm(false);
        resetForm();
        setEditingId(null);
      } else {
        setError(response.data.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      console.error('Errore salvataggio addizionale comunale:', err);
      setError('Errore nel salvataggio dell\'addizionale comunale');
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
  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa addizionale comunale?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/taxrates/municipal-additionals/${id}`);
      if (response.data.success) {
        await loadAdditionals();
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
    // TODO: Implementare caricamento dati per modifica
    // Per ora reset form
    resetForm();
    setEditingId(additional.id);
    setShowAddForm(true);
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
        <h1>Addizionali Comunali</h1>
        <p>Gestisci le addizionali comunali per il calcolo fiscale</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          + Aggiungi Addizionale Comunale
        </button>
      </div>

      {showAddForm && (
        <div className="add-form">
          <h3>{editingId ? 'Modifica' : 'Aggiungi'} Addizionale Comunale</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="year">Anno:</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="2020"
                max="2030"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="region">Regione:</label>
              <input
                type="text"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                placeholder="es. Marche, Lombardia, Lazio..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="municipality">Comune:</label>
              <input
                type="text"
                id="municipality"
                name="municipality"
                value={formData.municipality}
                onChange={handleInputChange}
                placeholder="es. Pesaro, Milano, Roma..."
                required
              />
            </div>

            <div className="form-group">
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

            {formData.isProgressive ? (
              <div className="brackets-section">
                <h4>Scaglioni Progressivi</h4>
                {formData.brackets.map((bracket, index) => (
                  <div key={index} className="bracket-row">
                    <div className="form-group">
                      <label>Da (€):</label>
                      <input
                        type="number"
                        value={bracket.min}
                        onChange={(e) => updateBracket(index, 'min', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>A (€):</label>
                      <input
                        type="number"
                        value={bracket.max}
                        onChange={(e) => updateBracket(index, 'max', e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="Lascia vuoto per ∞"
                      />
                    </div>
                    <div className="form-group">
                      <label>Aliquota (%):</label>
                      <input
                        type="number"
                        value={bracket.rate}
                        onChange={(e) => updateBracket(index, 'rate', e.target.value)}
                        step="0.01"
                        min="0"
                        max="10"
                        required
                      />
                    </div>
                    {formData.brackets.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeBracket(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={addBracket}
                >
                  <Plus size={16} /> Aggiungi Scaglione
                </button>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="flatRate">Tasso Fisso (%):</label>
                <input
                  type="number"
                  id="flatRate"
                  name="flatRate"
                  value={formData.flatRate}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="es. 0.50"
                  required
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Aggiorna' : 'Salva'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="additionals-list">
        <h3>Addizionali Comunali Configurate</h3>
        {additionals.length === 0 ? (
          <div className="no-data">
            Nessuna addizionale comunale configurata
          </div>
        ) : (
          <div className="table-container">
            <table className="additionals-table">
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
                    <td>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(additional)}
                        title="Modifica"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(additional.id)}
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
    </div>
  );
};

export default MunicipalAdditionalsPage;
