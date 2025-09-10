// client/src/components/contracts/NewContractModal.jsx
// Modale per creazione nuovo contratto - SoccerXpro V2

import { useState, useEffect } from 'react';
import { X, Save, FileText, User, Calendar, Euro, Building2, CheckCircle } from 'lucide-react';
import { apiFetch } from '../../utils/http';
import useAuthStore from '../../store/authStore';
import ConfirmDialog from '../common/ConfirmDialog';
import '../../styles/contract-modal.css';

const NewContractModal = ({ isOpen, onClose, onSuccess, editingContract = null }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    // Campi obbligatori
    startDate: '',
    endDate: '',
    salary: '',
    currency: 'EUR',
    contractType: '',
    playerId: '',
    status: 'DRAFT',
    
    // Campi opzionali
    signedDate: '',
    notes: '',
    agentContact: '',
    buyOption: false,
    buyPrice: '',
    contractRole: '',
    depositDate: '',
    loanFromClub: '',
    loanToClub: '',
    obligationToBuy: false,
    paymentFrequency: '',
    protocolNumber: '',
    responsibleUserId: '',
    
    // Flag per rinnovo ufficiale
    isOfficialRenewal: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [players, setPlayers] = useState([]);
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

  console.log('🔵 NewContractModal renderizzato', editingContract ? 'in modalità modifica' : 'in modalità creazione');

  // Popola il form quando si sta modificando un contratto
  useEffect(() => {
    if (editingContract) {
      console.log('🔵 Popolamento form per modifica:', editingContract);
      console.log('🔵 Campi del contratto:', {
        startDate: editingContract.startDate,
        endDate: editingContract.endDate,
        salary: editingContract.salary,
        currency: editingContract.currency,
        contractType: editingContract.contractType,
        playerId: editingContract.playerId,
        status: editingContract.status,
        signedDate: editingContract.signedDate,
        notes: editingContract.notes,
        agentContact: editingContract.agentContact,
        buyOption: editingContract.buyOption,
        buyPrice: editingContract.buyPrice,
        contractRole: editingContract.contractRole,
        depositDate: editingContract.depositDate,
        loanFromClub: editingContract.loanFromClub,
        loanToClub: editingContract.loanToClub,
        obligationToBuy: editingContract.obligationToBuy,
        paymentFrequency: editingContract.paymentFrequency,
        protocolNumber: editingContract.protocolNumber,
        responsibleUserId: editingContract.responsibleUserId
      });
      setFormData({
        startDate: editingContract.startDate ? new Date(editingContract.startDate).toISOString().split('T')[0] : '',
        endDate: editingContract.endDate ? new Date(editingContract.endDate).toISOString().split('T')[0] : '',
        salary: editingContract.salary ? editingContract.salary.toString() : '',
        currency: editingContract.currency || 'EUR',
        contractType: editingContract.contractType || '',
        playerId: editingContract.playerId ? editingContract.playerId.toString() : '',
        status: editingContract.status || 'DRAFT',
        signedDate: editingContract.signedDate ? new Date(editingContract.signedDate).toISOString().split('T')[0] : '',
        notes: editingContract.notes || '',
        agentContact: editingContract.agentContact || '',
        buyOption: editingContract.buyOption === true,
        buyPrice: editingContract.buyPrice ? editingContract.buyPrice.toString() : '',
        contractRole: editingContract.contractRole || '',
        depositDate: editingContract.depositDate ? new Date(editingContract.depositDate).toISOString().split('T')[0] : '',
        loanFromClub: editingContract.loanFromClub || '',
        loanToClub: editingContract.loanToClub || '',
        obligationToBuy: editingContract.obligationToBuy === true,
        paymentFrequency: editingContract.paymentFrequency || '',
        protocolNumber: editingContract.protocolNumber || '',
        responsibleUserId: editingContract.responsibleUserId ? editingContract.responsibleUserId.toString() : '',
        isOfficialRenewal: false // Sempre false per le modifiche esistenti
      });
    } else {
      // Reset form per nuova creazione
      setFormData({
        startDate: '',
        endDate: '',
        salary: '',
        currency: 'EUR',
        contractType: '',
        playerId: '',
        status: 'DRAFT',
        signedDate: '',
        notes: '',
        agentContact: '',
        buyOption: false,
        buyPrice: '',
        contractRole: '',
        depositDate: '',
        loanFromClub: '',
        loanToClub: '',
        obligationToBuy: false,
        paymentFrequency: '',
        protocolNumber: '',
        responsibleUserId: '',
        isOfficialRenewal: false
      });
    }
  }, [editingContract]);

  // Helper per tradurre i ruoli in italiano
  const getPositionLabel = (position) => {
    switch (position) {
      case 'GOALKEEPER': return 'Portiere';
      case 'DEFENDER': return 'Difensore';
      case 'MIDFIELDER': return 'Centrocampista';
      case 'FORWARD': return 'Attaccante';
      default: return position;
    }
  };

  // Helper per ordinare i giocatori per ruolo e cognome
  const getSortedPlayers = () => {
    const roleOrder = {
      'GOALKEEPER': 1,
      'DEFENDER': 2,
      'MIDFIELDER': 3,
      'FORWARD': 4
    };

    return [...players].sort((a, b) => {
      // Prima ordina per ruolo
      const roleA = roleOrder[a.position] || 999;
      const roleB = roleOrder[b.position] || 999;
      
      if (roleA !== roleB) {
        return roleA - roleB;
      }
      
      // Poi ordina alfabeticamente per cognome
      return a.lastName.localeCompare(b.lastName, 'it');
    });
  };

  // Carica giocatori al mount
  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
    }
  }, [isOpen]);

  // Carica lista giocatori
  const fetchPlayers = async () => {
    try {
      const response = await apiFetch('/api/players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.data || []);
      }
    } catch (err) {
      console.error('Errore caricamento giocatori:', err);
    }
  };


  // Gestione input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Rimuovi errore di validazione quando l'utente inizia a digitare
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validazione form
  const validateForm = () => {
    const errors = {};

    // Validazione campi obbligatori
    if (!formData.startDate) errors.startDate = 'Data inizio è obbligatoria';
    if (!formData.endDate) errors.endDate = 'Data fine è obbligatoria';
    if (!formData.salary || formData.salary <= 0) errors.salary = 'Stipendio deve essere maggiore di 0';
    if (!formData.contractType) errors.contractType = 'Tipo contratto è obbligatorio';
    if (!formData.playerId) errors.playerId = 'Giocatore è obbligatorio';

    // Validazione date
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        errors.endDate = 'La data di fine deve essere successiva alla data di inizio';
      }
    }

    // Validazione prezzo riscatto
    if (formData.buyOption && formData.buyPrice && formData.buyPrice <= 0) {
      errors.buyPrice = 'Prezzo riscatto deve essere maggiore di 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Devi essere autenticato per creare/modificare un contratto');
      return;
    }
    
    if (!validateForm()) {
      console.log('❌ Validazione fallita:', validationErrors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepara dati per l'invio
      const contractData = {
        ...formData,
        salary: parseFloat(formData.salary),
        buyPrice: formData.buyPrice ? parseFloat(formData.buyPrice) : null,
        responsibleUserId: formData.responsibleUserId || null
      };

      console.log('📤 Invio dati contratto:', contractData);
      console.log('🔐 Stato autenticazione:', { isAuthenticated, user: user?.email, role: user?.role });

      let response;
      if (editingContract) {
        // Modifica contratto esistente
        console.log('🔄 Modifica contratto:', editingContract.id);
        response = await apiFetch(`/api/contracts/${editingContract.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contractData)
        });
      } else {
        // Crea nuovo contratto
        console.log('➕ Creazione nuovo contratto');
        response = await apiFetch('/api/contracts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contractData)
        });
      }

      console.log('📥 Risposta ricevuta:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Dettagli errore:', errorData);
        throw new Error(errorData.message || `Errore ${response.status}`);
      }

      const savedContract = await response.json();
      console.log('✅ Contratto salvato con successo:', savedContract);

      // Mostra messaggio di successo
      if (editingContract) {
        setSuccessDialog({ isOpen: true, message: 'Contratto modificato con successo!' });
      } else {
        setSuccessDialog({ isOpen: true, message: 'Contratto creato con successo!' });
      }

      // Reset form
      setFormData({
        startDate: '',
        endDate: '',
        salary: '',
        currency: 'EUR',
        contractType: '',
        playerId: '',
        status: 'DRAFT',
        signedDate: '',
        notes: '',
        agentContact: '',
        buyOption: false,
        buyPrice: '',
        contractRole: '',
        depositDate: '',
        loanFromClub: '',
        loanToClub: '',
        obligationToBuy: false,
        paymentFrequency: '',
        protocolNumber: '',
        responsibleUserId: ''
      });

      onSuccess?.(savedContract.data);
      onClose();

    } catch (err) {
      console.error('❌ Errore creazione contratto:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Chiudi modale
  const handleClose = () => {
    if (!loading) {
      setFormData({
        startDate: '',
        endDate: '',
        salary: '',
        currency: 'EUR',
        contractType: '',
        playerId: '',
        status: 'DRAFT',
        signedDate: '',
        notes: '',
        agentContact: '',
        buyOption: false,
        buyPrice: '',
        contractRole: '',
        depositDate: '',
        loanFromClub: '',
        loanToClub: '',
        obligationToBuy: false,
        paymentFrequency: '',
        protocolNumber: '',
        responsibleUserId: ''
      });
      setError(null);
      setValidationErrors({});
      onClose();
    }
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialog({ isOpen: false, message: '' });
    onSuccess && onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content contract-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <FileText size={24} />
            {editingContract ? 'Modifica Contratto' : 'Nuovo Contratto'}
          </h2>
          <button onClick={handleClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contract-form">
          {/* Informazioni base */}
          <div className="form-section">
            <h3 className="form-section-title">Informazioni Base</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="playerId" className="form-label">Giocatore *</label>
                <select
                  id="playerId"
                  name="playerId"
                  value={formData.playerId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`form-select ${validationErrors.playerId ? 'error' : ''}`}
                >
                  <option value="">Seleziona giocatore</option>
                  {getSortedPlayers().map(player => (
                    <option key={player.id} value={player.id}>
                      {player.lastName.toUpperCase()} {player.firstName} - {getPositionLabel(player.position)}
                    </option>
                  ))}
                </select>
                {validationErrors.playerId && (
                  <span className="field-error">{validationErrors.playerId}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="contractType" className="form-label">Tipo Contratto *</label>
                <select
                  id="contractType"
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`form-select ${validationErrors.contractType ? 'error' : ''}`}
                >
                  <option value="">Seleziona tipo</option>
                  <option value="TRAINING_AGREEMENT">Accordo formativo</option>
                  <option value="APPRENTICESHIP">Apprendistato</option>
                  <option value="AMATEUR">Dilettante</option>
                  <option value="YOUTH">Giovanile</option>
                  <option value="LOAN">Prestito</option>
                  <option value="PERMANENT">Permanente</option>
                  <option value="PROFESSIONAL">Professionale</option>
                  <option value="TRIAL">Prova</option>
                </select>
                {validationErrors.contractType && (
                  <span className="field-error">{validationErrors.contractType}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">Data Inizio *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`form-input ${validationErrors.startDate ? 'error' : ''}`}
                />
                {validationErrors.startDate && (
                  <span className="field-error">{validationErrors.startDate}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="endDate" className="form-label">Data Fine *</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`form-input ${validationErrors.endDate ? 'error' : ''}`}
                />
                {validationErrors.endDate && (
                  <span className="field-error">{validationErrors.endDate}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status" className="form-label">Stato</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-select"
                >
                  <option value="DRAFT">Bozza</option>
                  <option value="ACTIVE">Attivo</option>
                  <option value="SUSPENDED">Sospeso</option>
                  <option value="EXPIRED">Non Attivo</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="signedDate" className="form-label">Data Firma</label>
                <input
                  type="date"
                  id="signedDate"
                  name="signedDate"
                  value={formData.signedDate}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Dati economici */}
          <div className="form-section">
            <h3 className="form-section-title">Dati Economici</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="salary" className="form-label">Stipendio *</label>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`form-input ${validationErrors.salary ? 'error' : ''}`}
                />
                {validationErrors.salary && (
                  <span className="field-error">{validationErrors.salary}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="currency" className="form-label">Valuta</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-select"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="paymentFrequency" className="form-label">Frequenza Pagamento</label>
                <select
                  id="paymentFrequency"
                  name="paymentFrequency"
                  value={formData.paymentFrequency}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-select"
                >
                  <option value="">Seleziona frequenza</option>
                  <option value="MONTHLY">Mensile</option>
                  <option value="BIMONTHLY">Bimensile</option>
                  <option value="QUARTERLY">Trimestrale</option>
                  <option value="ANNUAL">Annuale</option>
                  <option value="PER_APPEARANCE">A partita</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="contractRole" className="form-label">Ruolo Contrattuale</label>
                <select
                  id="contractRole"
                  name="contractRole"
                  value={formData.contractRole}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-select"
                >
                  <option value="">Seleziona ruolo</option>
                  <option value="PROFESSIONAL_PLAYER">Giocatore Professionista</option>
                  <option value="AMATEUR_PLAYER">Giocatore Dilettante</option>
                  <option value="YOUTH_SERIES">Settore Giovanile</option>
                  <option value="APPRENTICESHIP">Apprendistato</option>
                  <option value="OTHER">Altro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clausole e opzioni */}
          <div className="form-section">
            <h3 className="form-section-title">Clausole e Opzioni</h3>
            <div className="form-row">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="buyOption"
                    checked={formData.buyOption}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>Opzione di riscatto</span>
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="obligationToBuy"
                    checked={formData.obligationToBuy}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>Obbligo di riscatto</span>
                </label>
              </div>
            </div>

            {formData.buyOption && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="buyPrice" className="form-label">Prezzo Riscatto</label>
                  <input
                    type="number"
                    id="buyPrice"
                    name="buyPrice"
                    value={formData.buyPrice}
                    onChange={handleChange}
                    disabled={loading}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`form-input ${validationErrors.buyPrice ? 'error' : ''}`}
                  />
                  {validationErrors.buyPrice && (
                    <span className="field-error">{validationErrors.buyPrice}</span>
                  )}
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="depositDate" className="form-label">Data Deposito</label>
                <input
                  type="date"
                  id="depositDate"
                  name="depositDate"
                  value={formData.depositDate}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="protocolNumber" className="form-label">Numero Protocollo</label>
                <input
                  type="text"
                  id="protocolNumber"
                  name="protocolNumber"
                  value={formData.protocolNumber}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Es. 2024/001"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Prestito */}
          <div className="form-section">
            <h3 className="form-section-title">Informazioni Prestito</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="loanFromClub" className="form-label">Club di Provenienza</label>
                <input
                  type="text"
                  id="loanFromClub"
                  name="loanFromClub"
                  value={formData.loanFromClub}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Nome del club"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="loanToClub" className="form-label">Club di Destinazione</label>
                <input
                  type="text"
                  id="loanToClub"
                  name="loanToClub"
                  value={formData.loanToClub}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Nome del club"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Contatti e responsabili */}
          <div className="form-section">
            <h3 className="form-section-title">Contatti e Responsabili</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="agentContact" className="form-label">Contatto Agente</label>
                <input
                  type="text"
                  id="agentContact"
                  name="agentContact"
                  value={formData.agentContact}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Nome e contatti dell'agente"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="form-section">
            <h3 className="form-section-title">Note</h3>
            <div className="form-group">
              <label htmlFor="notes" className="form-label">Note Aggiuntive</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={loading}
                placeholder="Note aggiuntive sul contratto..."
                rows="4"
                className="form-textarea"
              />
            </div>
          </div>

          {/* Sezione Rinnovo Ufficiale - Solo per modifiche */}
          {editingContract && (
            <div className="form-section">
              <h3 className="form-section-title">🔄 Rinnovo Ufficiale</h3>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isOfficialRenewal"
                    checked={formData.isOfficialRenewal}
                    onChange={handleChange}
                    disabled={loading}
                    className="form-checkbox"
                  />
                  <span className="checkbox-text">
                    <strong>Rinnovo ufficiale</strong>
                    <small>Seleziona questa opzione per creare un emendamento ufficiale che traccia la modifica nella cronologia del contratto</small>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Errori */}
          {error && (
            <div className="form-error">
              <p>{error}</p>
            </div>
          )}

          {/* Azioni */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <div className="spinner-small" />
                  {editingContract ? (formData.isOfficialRenewal ? 'Rinnovo in corso...' : 'Salvataggio...') : 'Creazione...'}
                </>
              ) : (
                <>
                  <Save size={20} />
                  {editingContract ? (formData.isOfficialRenewal ? '🔄 Rinnovo Ufficiale' : 'Salva Modifiche') : 'Crea Contratto'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Dialog di successo */}
      <ConfirmDialog
        isOpen={successDialog.isOpen}
        onClose={handleSuccessDialogClose}
        onConfirm={handleSuccessDialogClose}
        title="Successo!"
        message={successDialog.message}
        confirmText="Ok"
        cancelText=""
        type="success"
      />
    </div>
  );
};

export default NewContractModal;
