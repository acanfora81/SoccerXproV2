import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, Key, RefreshCw, Smartphone } from 'lucide-react';
import TwoFAModal from '../components/auth/TwoFAModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { 
  getTwoFactorStatus, 
  disableTwoFactor, 
  generateBackupCodes 
} from '../services/auth/twoFactorAuth';
import '../styles/two-factor-page.css';

const TwoFactorAuthPage = () => {
  const [twoFAStatus, setTwoFAStatus] = useState({ enabled: false, setupRequired: true });
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [actionType, setActionType] = useState(''); // 'disable' | 'backup'
  const [backupCodes, setBackupCodes] = useState([]);
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' });

  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const status = await getTwoFactorStatus();
      setTwoFAStatus(status);
    } catch (error) {
      showFeedback('error', 'Errore nel caricamento dello stato 2FA: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message });
  };

  const handleSetupComplete = () => {
    setShowSetupModal(false);
    loadTwoFactorStatus();
    showFeedback('success', '2FA configurato con successo!');
  };

  const handleDisableRequest = () => {
    setActionType('disable');
    setShowVerifyModal(true);
  };

  const handleBackupCodesRequest = () => {
    setActionType('backup');
    setShowVerifyModal(true);
  };

  const handleVerifySuccess = async (token) => {
    try {
      if (actionType === 'disable') {
        await disableTwoFactor(token);
        await loadTwoFactorStatus();
        showFeedback('success', '2FA disabilitato con successo');
      } else if (actionType === 'backup') {
        const response = await generateBackupCodes(token);
        setBackupCodes(response.backupCodes);
        showFeedback('success', 'Nuovi codici di backup generati');
      }
    } catch (error) {
      showFeedback('error', 'Operazione fallita: ' + error.message);
    } finally {
      setShowVerifyModal(false);
      setActionType('');
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    showFeedback('success', 'Codici copiati negli appunti');
  };

  if (loading) {
    return (
      <div className="two-fa-page">
        <div className="two-fa-loading-state">
          <RefreshCw className="spin" size={32} />
          <p>Caricamento stato 2FA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="two-fa-page">
      {/* Header */}
      <div className="import-wizard-header">
        <div className="header-content">
          <div className="header-title">
            <Shield size={32} color="#3B82F6" />
            <div>
              <h1>Sicurezza - Autenticazione a Due Fattori</h1>
              <p>Proteggi il tuo account con un livello di sicurezza aggiuntivo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="upload-step-container">
        <div className="max-w-4xl mx-auto">
          <div className="upload-card">

            {/* Status Card */}
            <div className={`two-fa-status-card ${twoFAStatus.enabled ? 'enabled' : 'disabled'}`}>
              <div className="two-fa-status-header">
                <div className="two-fa-status-icon">
                  {twoFAStatus.enabled ? (
                    <CheckCircle size={24} />
                  ) : (
                    <AlertTriangle size={24} />
                  )}
                </div>
                <div className="two-fa-status-info">
                  <h3>
                    {twoFAStatus.enabled ? 'Autenticazione a Due Fattori Attiva' : 'Autenticazione a Due Fattori Non Configurata'}
                  </h3>
                  <p>
                    {twoFAStatus.enabled 
                      ? 'Il tuo account è protetto con 2FA. Le operazioni sensibili richiedono conferma.'
                      : 'Migliora la sicurezza del tuo account configurando l\'autenticazione a due fattori.'
                    }
                  </p>
                </div>
              </div>

              <div className="two-fa-status-actions">
                {twoFAStatus.enabled ? (
                  <>
                    <button
                      className="btn secondary"
                      onClick={handleBackupCodesRequest}
                    >
                      <Key size={16} />
                      Genera Nuovi Codici Backup
                    </button>
                    <button
                      className="btn danger"
                      onClick={handleDisableRequest}
                    >
                      <AlertTriangle size={16} />
                      Disabilita 2FA
                    </button>
                  </>
                ) : (
                  <button
                    className="btn primary"
                    onClick={() => setShowSetupModal(true)}
                  >
                    <Smartphone size={16} />
                    Configura 2FA
                  </button>
                )}
              </div>
            </div>

            {/* Informazioni e Istruzioni */}
            <div className="two-fa-info-section">
              <h2>Come Funziona</h2>
              <div className="two-fa-info-grid">
                <div className="two-fa-info-card">
                  <div className="two-fa-info-icon">
                    <Smartphone size={24} color="#3B82F6" />
                  </div>
                  <h4>1. App Authenticator</h4>
                  <p>
                    Installa un'app come Google Authenticator, Authy o Microsoft Authenticator 
                    sul tuo smartphone.
                  </p>
                </div>

                <div className="two-fa-info-card">
                  <div className="two-fa-info-icon">
                    <Key size={24} color="#10B981" />
                  </div>
                  <h4>2. Codici Temporanei</h4>
                  <p>
                    L'app genererà codici a 6 cifre che cambiano ogni 30 secondi 
                    per verificare la tua identità.
                  </p>
                </div>

                <div className="two-fa-info-card">
                  <div className="two-fa-info-icon">
                    <Shield size={24} color="#8B5CF6" />
                  </div>
                  <h4>3. Protezione Extra</h4>
                  <p>
                    Le operazioni sensibili richiederanno il codice dalla tua app, 
                    proteggendo il tuo account anche se la password viene compromessa.
                  </p>
                </div>
              </div>
            </div>

            {/* Backup Codes Display */}
            {backupCodes.length > 0 && (
              <div className="two-fa-backup-display">
                <h3>Codici di Backup Generati</h3>
                <p>
                  Salva questi codici in un posto sicuro. Puoi usarli per accedere 
                  se perdi il tuo dispositivo mobile:
                </p>
                <div className="two-fa-backup-codes-grid">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="two-fa-backup-code-item">
                      <code>{code}</code>
                    </div>
                  ))}
                </div>
                <button
                  className="btn secondary"
                  onClick={copyBackupCodes}
                >
                  Copia Tutti i Codici
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modals */}
      <TwoFAModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        mode="setup"
        onSuccess={handleSetupComplete}
      />

      <TwoFAModal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setActionType('');
        }}
        mode="verify"
        onSuccess={handleVerifySuccess}
        title={actionType === 'disable' ? 'Conferma Disabilitazione 2FA' : 'Genera Codici Backup'}
      />

      {/* Feedback */}
      <ConfirmDialog
        isOpen={feedback.show}
        onClose={() => setFeedback({ ...feedback, show: false })}
        title={feedback.type === 'success' ? 'Successo!' : 'Attenzione!'}
        message={feedback.message}
        confirmText="Ok"
        hideCancelButton
        type={feedback.type}
      />
    </div>
  );
};

export default TwoFactorAuthPage;
