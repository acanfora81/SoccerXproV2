import React, { useState, useEffect } from 'react';
import { X, Shield, QrCode, Key, Copy, CheckCircle } from 'lucide-react';
import { enrollTwoFactor, verifyTwoFactorSetup, verifyTwoFactorToken } from '../../services/auth/twoFactorAuth';
import '../../styles/two-factor-modal.css';

/**
 * Modale per gestione 2FA - sia setup che verifica codice
 * @param {boolean} isOpen - Se la modale è aperta
 * @param {function} onClose - Callback per chiudere
 * @param {string} mode - 'setup' per configurazione iniziale, 'verify' per inserimento codice
 * @param {function} onSuccess - Callback successo (per mode='verify' riceve il token)
 * @param {string} title - Titolo personalizzato
 */
const TwoFAModal = ({ 
  isOpen, 
  onClose, 
  mode = 'setup', // 'setup' | 'verify'
  onSuccess,
  title = null
}) => {
  const [step, setStep] = useState(1); // 1: QR, 2: Verifica, 3: Backup codes
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    if (isOpen && mode === 'setup') {
      initializeSetup();
    }
    if (isOpen && mode === 'verify') {
      setStep(2); // Vai direttamente all'inserimento codice
    }
  }, [isOpen, mode]);

  const initializeSetup = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await enrollTwoFactor();
      setQrCodeUrl(response.qrCodeUrl);
      setSecret(response.secret);
      setStep(1);
    } catch (err) {
      setError('Errore durante l\'inizializzazione: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!token || token.length !== 6) {
      setError('Inserisci un codice a 6 cifre valido');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await verifyTwoFactorSetup(token);
      setBackupCodes(response.backupCodes || []);
      setStep(3); // Mostra backup codes
    } catch (err) {
      setError('Codice non valido. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!token || token.length !== 6) {
      setError('Inserisci un codice a 6 cifre valido');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await verifyTwoFactorToken(token);
      if (response.valid) {
        onSuccess?.(token); // Passa il token per l'uso nelle chiamate API
        onClose();
      } else {
        setError('Codice non valido. Riprova.');
      }
    } catch (err) {
      setError('Verifica fallita: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
  };

  const resetModal = () => {
    setStep(1);
    setToken('');
    setError('');
    setQrCodeUrl('');
    setSecret('');
    setBackupCodes([]);
    setCopiedCodes(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getModalTitle = () => {
    if (title) return title;
    if (mode === 'verify') return 'Verifica 2FA';
    if (step === 1) return 'Configura Autenticazione a Due Fattori';
    if (step === 2) return 'Verifica il Codice';
    return 'Codici di Backup';
  };

  if (!isOpen) return null;

  return (
    <div className="two-fa-modal-overlay">
      <div className="two-fa-modal">
        <div className="two-fa-modal__header">
          <div className="two-fa-modal__title">
            <Shield size={24} color="#3B82F6" />
            <h2>{getModalTitle()}</h2>
          </div>
          <button className="two-fa-modal__close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="two-fa-modal__content">
          {error && (
            <div className="two-fa-modal__error">
              {error}
            </div>
          )}

          {/* Step 1: QR Code (solo in mode='setup') */}
          {mode === 'setup' && step === 1 && (
            <div className="two-fa-setup-step">
              <div className="two-fa-setup-step__icon">
                <QrCode size={32} color="#3B82F6" />
              </div>
              <h3>Scansiona il QR Code</h3>
              <p>
                Usa un'app di autenticazione come Google Authenticator, Authy o Microsoft Authenticator
                per scansionare questo codice QR:
              </p>
              
              {loading ? (
                <div className="two-fa-loading">Generazione QR Code...</div>
              ) : qrCodeUrl ? (
                <div className="two-fa-qr-container">
                  <img src={qrCodeUrl} alt="QR Code 2FA" className="two-fa-qr-code" />
                  <div className="two-fa-secret-manual">
                    <p><strong>Setup manuale:</strong></p>
                    <div className="two-fa-secret-code">
                      <code>{secret}</code>
                      <button
                        type="button"
                        onClick={copySecret}
                        className="two-fa-copy-btn"
                        title="Copia codice"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                className="btn primary"
                onClick={() => setStep(2)}
                disabled={!qrCodeUrl}
              >
                Ho configurato l'app →
              </button>
            </div>
          )}

          {/* Step 2: Verifica Token (sia setup che verify) */}
          {((mode === 'setup' && step === 2) || mode === 'verify') && (
            <div className="two-fa-verify-step">
              <div className="two-fa-setup-step__icon">
                <Key size={32} color="#3B82F6" />
              </div>
              <h3>{mode === 'verify' ? 'Inserisci il codice 2FA' : 'Verifica la configurazione'}</h3>
              <p>
                {mode === 'verify' 
                  ? 'Inserisci il codice a 6 cifre dalla tua app di autenticazione:'
                  : 'Inserisci il codice a 6 cifre generato dalla tua app per completare la configurazione:'
                }
              </p>

              <div className="two-fa-token-input">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setToken(value);
                    setError('');
                  }}
                  placeholder="000000"
                  className="two-fa-code-field"
                  maxLength={6}
                  autoComplete="off"
                />
              </div>

              <div className="two-fa-modal__actions">
                <button
                  type="button"
                  className="btn"
                  onClick={handleClose}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={mode === 'verify' ? handleVerifyToken : handleVerifySetup}
                  disabled={loading || token.length !== 6}
                >
                  {loading ? 'Verifica...' : 'Verifica Codice'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Backup Codes (solo in mode='setup') */}
          {mode === 'setup' && step === 3 && (
            <div className="two-fa-backup-step">
              <div className="two-fa-setup-step__icon">
                <CheckCircle size={32} color="#10B981" />
              </div>
              <h3>2FA Configurato con Successo!</h3>
              <p>
                Salva questi codici di backup in un posto sicuro. 
                Potrai usarli per accedere se perdi il tuo dispositivo:
              </p>

              <div className="two-fa-backup-codes">
                {backupCodes.map((code, index) => (
                  <div key={index} className="two-fa-backup-code">
                    <code>{code}</code>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn secondary"
                onClick={copyBackupCodes}
              >
                {copiedCodes ? (
                  <>
                    <CheckCircle size={16} />
                    Copiati!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copia Codici
                  </>
                )}
              </button>

              <div className="two-fa-modal__actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleClose}
                >
                  Completa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFAModal;
