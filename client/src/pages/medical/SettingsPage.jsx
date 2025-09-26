import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSettings, 
  updateSettings, 
  getRetentionSettings, 
  updateRetentionSettings,
  getClassificationSettings,
  updateClassificationSettings,
  getConsentSettings,
  updateConsentSettings,
  getAuditSettings,
  updateAuditSettings,
  exportSettings,
  importSettings,
  resetSettings
} from '../../services/medical/settingsService';
import PageHeader from '../../components/medical/PageHeader';
import RetentionBanner from '../../components/medical/RetentionBanner';
import ExportButton from '../../components/medical/ExportButton';

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('retention');
  const [formData, setFormData] = useState({});
  const [importFile, setImportFile] = useState(null);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const { data: retentionSettings } = useQuery({
    queryKey: ['retention-settings'],
    queryFn: getRetentionSettings,
  });

  const { data: classificationSettings } = useQuery({
    queryKey: ['classification-settings'],
    queryFn: getClassificationSettings,
  });

  const { data: consentSettings } = useQuery({
    queryKey: ['consent-settings'],
    queryFn: getConsentSettings,
  });

  const { data: auditSettings } = useQuery({
    queryKey: ['audit-settings'],
    queryFn: getAuditSettings,
  });

  const updateMut = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const updateRetentionMut = useMutation({
    mutationFn: updateRetentionSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['retention-settings'] }),
  });

  const updateClassificationMut = useMutation({
    mutationFn: updateClassificationSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classification-settings'] }),
  });

  const updateConsentMut = useMutation({
    mutationFn: updateConsentSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consent-settings'] }),
  });

  const updateAuditMut = useMutation({
    mutationFn: updateAuditSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-settings'] }),
  });

  const exportMut = useMutation({
    mutationFn: exportSettings,
  });

  const importMut = useMutation({
    mutationFn: importSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setImportFile(null);
      alert('Impostazioni importate con successo!');
    },
  });

  const resetMut = useMutation({
    mutationFn: resetSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      alert('Impostazioni ripristinate ai valori predefiniti!');
    },
  });

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    switch (activeTab) {
      case 'retention':
        updateRetentionMut.mutate(formData);
        break;
      case 'classification':
        updateClassificationMut.mutate(formData);
        break;
      case 'consent':
        updateConsentMut.mutate(formData);
        break;
      case 'audit':
        updateAuditMut.mutate(formData);
        break;
      default:
        updateMut.mutate(formData);
    }
    setFormData({});
  };

  const handleExport = async (format) => {
    try {
      const response = await exportMut.mutateAsync();
      console.log(`Exporting settings as ${format}:`, response);
      alert(`Export ${format.toUpperCase()} avviato!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Errore durante l\'export');
    }
  };

  const handleImport = () => {
    if (importFile) {
      importMut.mutate(importFile);
    }
  };

  const handleReset = () => {
    if (confirm('Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti?')) {
      resetMut.mutate();
    }
  };

  const tabs = [
    { key: 'retention', label: 'Retention', icon: '⏰' },
    { key: 'classification', label: 'Classificazione', icon: '🏷️' },
    { key: 'consent', label: 'Consensi', icon: '📋' },
    { key: 'audit', label: 'Audit', icon: '📊' },
    { key: 'general', label: 'Generali', icon: '⚙️' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'retention':
        return (
          <div className="medical-grid">
            <div className="card">
              <h3>Policy di Retention</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label>Retention Documenti Medici (giorni)</label>
                  <input 
                    className="input" 
                    type="number" 
                    defaultValue={retentionSettings?.medicalDocuments || 365}
                    onChange={(e) => handleInputChange('medicalDocuments', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label>Retention Consensi (giorni)</label>
                  <input 
                    className="input" 
                    type="number" 
                    defaultValue={retentionSettings?.consents || 730}
                    onChange={(e) => handleInputChange('consents', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label>Retention Log Audit (giorni)</label>
                  <input 
                    className="input" 
                    type="number" 
                    defaultValue={retentionSettings?.auditLogs || 2555}
                    onChange={(e) => handleInputChange('auditLogs', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label>Retention Casi Chiusi (giorni)</label>
                  <input 
                    className="input" 
                    type="number" 
                    defaultValue={retentionSettings?.closedCases || 1095}
                    onChange={(e) => handleInputChange('closedCases', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
            
            <div className="card">
              <h3>Documenti in Scadenza</h3>
              <RetentionBanner 
                daysLeft={7} 
                documentName="Referto Medico #12345"
                onExtend={() => alert('Estendi retention')}
                onDelete={() => alert('Elimina documento')}
              />
              <RetentionBanner 
                daysLeft={15} 
                documentName="Consenso GDPR #67890"
                onExtend={() => alert('Estendi retention')}
                onDelete={() => alert('Elimina documento')}
              />
            </div>
          </div>
        );

      case 'classification':
        return (
          <div className="card">
            <h3>Classificazione Dati</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label>Livello di Criticità Predefinito</label>
                <select 
                  className="select" 
                  defaultValue={classificationSettings?.defaultLevel || 'MEDIUM'}
                  onChange={(e) => handleInputChange('defaultLevel', e.target.value)}
                >
                  <option value="LOW">Basso</option>
                  <option value="MEDIUM">Medio</option>
                  <option value="HIGH">Alto</option>
                  <option value="CRITICAL">Critico</option>
                </select>
              </div>
              <div>
                <label>Auto-classificazione</label>
                <input 
                  type="checkbox" 
                  defaultChecked={classificationSettings?.autoClassification || false}
                  onChange={(e) => handleInputChange('autoClassification', e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>Abilita classificazione automatica</span>
              </div>
              <div>
                <label>Richiedi Giustificazione</label>
                <input 
                  type="checkbox" 
                  defaultChecked={classificationSettings?.requireJustification || true}
                  onChange={(e) => handleInputChange('requireJustification', e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>Richiedi giustificazione per accessi</span>
              </div>
            </div>
          </div>
        );

      case 'consent':
        return (
          <div className="card">
            <h3>Gestione Consensi</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label>Durata Consensi Predefinita (giorni)</label>
                <input 
                  className="input" 
                  type="number" 
                  defaultValue={consentSettings?.defaultDuration || 365}
                  onChange={(e) => handleInputChange('defaultDuration', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label>Notifiche Scadenza</label>
                <input 
                  type="checkbox" 
                  defaultChecked={consentSettings?.expiryNotifications || true}
                  onChange={(e) => handleInputChange('expiryNotifications', e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>Invia notifiche prima della scadenza</span>
              </div>
              <div>
                <label>Giorni di Preavviso</label>
                <input 
                  className="input" 
                  type="number" 
                  defaultValue={consentSettings?.notificationDays || 30}
                  onChange={(e) => handleInputChange('notificationDays', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label>Consenso Implicito</label>
                <input 
                  type="checkbox" 
                  defaultChecked={consentSettings?.implicitConsent || false}
                  onChange={(e) => handleInputChange('implicitConsent', e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>Permetti consenso implicito per emergenze</span>
              </div>
            </div>
          </div>
        );

      case 'audit':
        return (
          <div className="card">
            <h3>Configurazione Audit</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label>Log Level</label>
                <select 
                  className="select" 
                  defaultValue={auditSettings?.logLevel || 'INFO'}
                  onChange={(e) => handleInputChange('logLevel', e.target.value)}
                >
                  <option value="DEBUG">Debug</option>
                  <option value="INFO">Info</option>
                  <option value="WARN">Warning</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>
              <div>
                <label>Traccia IP Address</label>
                <input 
                  type="checkbox" 
                  defaultChecked={auditSettings?.trackIP || true}
                  onChange={(e) => handleInputChange('trackIP', e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>Registra indirizzi IP</span>
              </div>
              <div>
                <label>Traccia User Agent</label>
                <input 
                  type="checkbox" 
                  defaultChecked={auditSettings?.trackUserAgent || true}
                  onChange={(e) => handleInputChange('trackUserAgent', e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>Registra User Agent</span>
              </div>
              <div>
                <label>Alert Accessi Sospetti</label>
                <input 
                  type="checkbox" 
                  defaultChecked={auditSettings?.alertSuspicious || true}
                  onChange={(e) => handleInputChange('alertSuspicious', e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>Invia alert per accessi sospetti</span>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="card">
            <h3>Impostazioni Generali</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label>Fuso Orario</label>
                <select 
                  className="select" 
                  defaultValue={settings?.timezone || 'Europe/Rome'}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                >
                  <option value="Europe/Rome">Europa/Roma</option>
                  <option value="Europe/London">Europa/Londra</option>
                  <option value="America/New_York">America/New York</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label>Lingua Interfaccia</label>
                <select 
                  className="select" 
                  defaultValue={settings?.language || 'it'}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div>
                <label>Modalità Debug</label>
                <input 
                  type="checkbox" 
                  defaultChecked={settings?.debugMode || false}
                  onChange={(e) => handleInputChange('debugMode', e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>Abilita modalità debug</span>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="card">Sezione non trovata</div>;
    }
  };

  if (settingsLoading) {
    return (
      <div className="medical-page">
        <div className="card">Caricamento impostazioni...</div>
      </div>
    );
  }

  return (
    <div className="medical-page">
      <PageHeader 
        title="Impostazioni GDPR" 
        subtitle="Configurazione policy, retention e classificazione" 
        actions={<>
          <ExportButton onExport={handleExport} />
          <button className="btn" onClick={handleReset} disabled={resetMut.isPending}>
            {resetMut.isPending ? 'Ripristino...' : 'Ripristina'}
          </button>
        </>}
      />

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        borderBottom: '1px solid var(--border-color, #2a2a2a)',
        marginBottom: '20px'
      }}>
        {tabs.map(tab => (
          <button 
            key={tab.key} 
            onClick={() => setActiveTab(tab.key)} 
            className={`btn ${activeTab === tab.key ? 'primary' : ''}`}
            style={{
              borderBottom: activeTab === tab.key ? '2px solid var(--accent, #4f46e5)' : '2px solid transparent',
              borderRadius: '8px 8px 0 0',
              marginBottom: '-1px',
              fontSize: '14px',
              padding: '8px 16px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ marginRight: '6px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Import Section */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Import/Export</h3>
        <div className="row">
          <input 
            type="file" 
            accept=".json,.csv"
            onChange={(e) => setImportFile(e.target.files?.[0])}
            style={{ flex: 1 }}
          />
          <button 
            className="btn" 
            onClick={handleImport}
            disabled={!importFile || importMut.isPending}
          >
            {importMut.isPending ? 'Importazione...' : 'Importa'}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button 
          className="btn primary" 
          onClick={handleSave}
          disabled={Object.keys(formData).length === 0}
        >
          Salva Modifiche
        </button>
      </div>
    </div>
  );
}
