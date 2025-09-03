// client/src/components/players/PlayerFormModal.jsx
// Form modale per creazione/modifica giocatori - Athlos (cookie HttpOnly ready)

import { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';

const PlayerFormModal = ({ isOpen, onClose, player = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    position: '',
    shirtNumber: '',
    height: '',
    weight: '',
    preferredFoot: '',
    placeOfBirth: '',
    taxCode: '',
    passportNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const isEditMode = !!player;

  console.log('🔵 PlayerFormModal renderizzato - Modalità:', isEditMode ? 'modifica' : 'creazione');

  // Popola form se in modalità modifica
  useEffect(() => {
    if (player) {
      console.log('🔵 Popolamento form per modifica giocatore:', player.firstName, player.lastName);
      setFormData({
        firstName: player.firstName || '',
        lastName: player.lastName || '',
        dateOfBirth: player.dateOfBirth ? player.dateOfBirth.split('T')[0] : '',
        nationality: player.nationality || '',
        position: player.position || '',
        shirtNumber: player.shirtNumber?.toString() || '',
        height: player.height?.toString() || '',
        weight: player.weight?.toString() || '',
        preferredFoot: player.preferredFoot || '',
        placeOfBirth: player.placeOfBirth || '',
        taxCode: player.taxCode || '',
        passportNumber: player.passportNumber || ''
      });
    } else {
      // Reset form per nuova creazione
      console.log('🔵 Reset form per nuovo giocatore');
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        position: '',
        shirtNumber: '',
        height: '',
        weight: '',
        preferredFoot: '',
        placeOfBirth: '',
        taxCode: '',
        passportNumber: ''
      });
    }
    setError(null);
    setValidationErrors({});
  }, [player, isOpen]);

  // Validazione form
  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'Nome è obbligatorio';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Cognome è obbligatorio';
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Data di nascita è obbligatoria';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 16 || age > 50) {
        errors.dateOfBirth = 'Età deve essere tra 16 e 50 anni';
      }
    }

    if (!formData.nationality.trim()) {
      errors.nationality = 'Nazionalità è obbligatoria';
    }

    if (!formData.position) {
      errors.position = 'Ruolo è obbligatorio';
    }

    if (formData.shirtNumber) {
      const num = parseInt(formData.shirtNumber, 10);
      if (isNaN(num) || num < 1 || num > 99) {
        errors.shirtNumber = 'Numero maglia deve essere tra 1 e 99';
      }
    }

    if (formData.taxCode && formData.taxCode.length !== 16) {
      errors.taxCode = 'Codice fiscale deve essere di 16 caratteri';
    }

    console.log('🔵 Validazione form completata - Errori trovati:', Object.keys(errors).length);

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset errori quando l'utente modifica il campo
    if (error) setError(null);
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🔵 Avvio submit form giocatore');

    // Validazione client-side
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.log('🟡 Errori di validazione:', errors);
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepara dati per l'API
      const submitData = {
        ...formData,
        shirtNumber: formData.shirtNumber ? parseInt(formData.shirtNumber, 10) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        preferredFoot: formData.preferredFoot || null,
        placeOfBirth: formData.placeOfBirth || null,
        taxCode: formData.taxCode || null,
        passportNumber: formData.passportNumber || null
      };

      // Rimuovi campi vuoti
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          delete submitData[key];
        }
      });

      console.log('🔵 Invio dati al server:', {
        mode: isEditMode ? 'modifica' : 'creazione',
        playerId: player?.id
      });

      const url = isEditMode ? `/api/players/${player.id}` : '/api/players';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include', // ✅ invia i cookie HttpOnly
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Errore ${response.status}`);
      }

      console.log('🟢 Giocatore salvato con successo:', data.data.firstName, data.data.lastName);

      // Successo
      onSuccess && onSuccess(data.data);
      onClose();

    } catch (err) {
      console.log('🔴 Errore salvataggio giocatore:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('🔵 Chiusura modale giocatore');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <User size={24} />
            {isEditMode ? 'Modifica Giocatore' : 'Nuovo Giocatore'}
          </h2>
          <button onClick={handleClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="player-form">
          {/* Dati anagrafici */}
          <div className="form-section">
            <h3 className="form-section-title">Dati Anagrafici</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">Nome *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Mario"
                  className={`form-input ${validationErrors.firstName ? 'error' : ''}`}
                />
                {validationErrors.firstName && (
                  <span className="field-error">{validationErrors.firstName}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Cognome *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Rossi"
                  className={`form-input ${validationErrors.lastName ? 'error' : ''}`}
                />
                {validationErrors.lastName && (
                  <span className="field-error">{validationErrors.lastName}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth" className="form-label">Data di Nascita *</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`form-input ${validationErrors.dateOfBirth ? 'error' : ''}`}
                />
                {validationErrors.dateOfBirth && (
                  <span className="field-error">{validationErrors.dateOfBirth}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="nationality" className="form-label">Nazionalità *</label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Italia"
                  className={`form-input ${validationErrors.nationality ? 'error' : ''}`}
                />
                {validationErrors.nationality && (
                  <span className="field-error">{validationErrors.nationality}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="placeOfBirth" className="form-label">Luogo di Nascita</label>
                <input
                  type="text"
                  id="placeOfBirth"
                  name="placeOfBirth"
                  value={formData.placeOfBirth}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Roma"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Dati sportivi */}
          <div className="form-section">
            <h3 className="form-section-title">Dati Sportivi</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="position" className="form-label">Ruolo *</label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`form-select ${validationErrors.position ? 'error' : ''}`}
                >
                  <option value="">Seleziona ruolo</option>
                  <option value="GOALKEEPER">Portiere</option>
                  <option value="DEFENDER">Difensore</option>
                  <option value="MIDFIELDER">Centrocampista</option>
                  <option value="FORWARD">Attaccante</option>
                </select>
                {validationErrors.position && (
                  <span className="field-error">{validationErrors.position}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="shirtNumber" className="form-label">Numero Maglia</label>
                <input
                  type="number"
                  id="shirtNumber"
                  name="shirtNumber"
                  value={formData.shirtNumber}
                  onChange={handleChange}
                  disabled={loading}
                  min="1"
                  max="99"
                  placeholder="10"
                  className={`form-input ${validationErrors.shirtNumber ? 'error' : ''}`}
                />
                {validationErrors.shirtNumber && (
                  <span className="field-error">{validationErrors.shirtNumber}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="preferredFoot" className="form-label">Piede Preferito</label>
                <select
                  id="preferredFoot"
                  name="preferredFoot"
                  value={formData.preferredFoot}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-select"
                >
                  <option value="">Non specificato</option>
                  <option value="LEFT">Sinistro</option>
                  <option value="RIGHT">Destro</option>
                  <option value="BOTH">Ambidestro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dati fisici */}
          <div className="form-section">
            <h3 className="form-section-title">Dati Fisici</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="height" className="form-label">Altezza (cm)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  disabled={loading}
                  min="150"
                  max="220"
                  step="0.1"
                  placeholder="180"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="weight" className="form-label">Peso (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  disabled={loading}
                  min="40"
                  max="150"
                  step="0.1"
                  placeholder="75"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Documenti */}
          <div className="form-section">
            <h3 className="form-section-title">Documenti</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="taxCode" className="form-label">Codice Fiscale</label>
                <input
                  type="text"
                  id="taxCode"
                  name="taxCode"
                  value={formData.taxCode}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="RSSMRA90A01H501X"
                  maxLength="16"
                  className={`form-input ${validationErrors.taxCode ? 'error' : ''}`}
                />
                {validationErrors.taxCode && (
                  <span className="field-error">{validationErrors.taxCode}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="passportNumber" className="form-label">Numero Passaporto</label>
                <input
                  type="text"
                  id="passportNumber"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="AA1234567"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Errore generale */}
          {error && (
            <div className="form-error">
              <strong>Errore:</strong> {error}
            </div>
          )}

          {/* Azioni */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Save size={20} />
              {loading ? 'Salvataggio...' : (isEditMode ? 'Aggiorna' : 'Crea Giocatore')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerFormModal;
