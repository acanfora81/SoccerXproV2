import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Info, 
  X, 
  Calculator, 
  Percent,
  Plus,
  Edit3,
  Trash2,
  Settings,
  Calendar,
  TrendingUp,
  Layers
} from 'lucide-react';
import axios from 'axios';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './TaxConfigPage.css';

export default function TaxConfigPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [activeExtraTab, setActiveExtraTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    year: '',
    contributionrate: '',
    solidarityrate: '',
    detrazionifixed: '',
    detrazionipercentonirpef: '',
    ulterioredetrazionefixed: '',
    ulterioredetrazionepercent: '',
    bonusl207fixed: ''
  });

  // Extra Deduction Rules state
  const [extraRules, setExtraRules] = useState([]);
  const [extraSelectedFile, setExtraSelectedFile] = useState(null);
  const [extraUploading, setExtraUploading] = useState(false);
  const [extraShowAddForm, setExtraShowAddForm] = useState(false);
  const [extraEditingRule, setExtraEditingRule] = useState(null);

  // Bonus L207 Rules state
  const [bonusL207Rules, setBonusL207Rules] = useState([]);
  const [bonusL207SelectedFile, setBonusL207SelectedFile] = useState(null);
  const [bonusL207Uploading, setBonusL207Uploading] = useState(false);
  const [bonusL207ShowAddForm, setBonusL207ShowAddForm] = useState(false);
  const [bonusL207EditingRule, setBonusL207EditingRule] = useState(null);
  const [extraFormData, setExtraFormData] = useState({
    year: '',
    min: '',
    max: '',
    amount: ''
  });

  const [bonusL207FormData, setBonusL207FormData] = useState({
    year: '',
    min: '',
    max: '',
    amount: ''
  });

  useEffect(() => {
    fetchConfigs();
    fetchExtraRules();
    fetchBonusL207Rules();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/taxrates/tax-config');
      if (response.data.success) {
        setConfigs(response.data.data);
      }
    } catch (error) {
      console.error('Errore nel recupero delle configurazioni:', error);
      setError('Errore nel recupero delle configurazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Seleziona un file CSV');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post('/api/taxrates/tax-config/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setSelectedFile(null);
        document.getElementById('file-input').value = '';
        fetchConfigs(); // Ricarica la lista
      } else {
        setError(response.data.message || 'Errore durante il caricamento');
      }
    } catch (error) {
      console.error('Errore upload:', error);
      setError(error.response?.data?.message || 'Errore durante il caricamento del file');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        year: parseInt(formData.year),
        contributionrate: parseFloat(formData.contributionrate || 0),
        solidarityrate: parseFloat(formData.solidarityrate || 0),
        detrazionifixed: parseFloat(formData.detrazionifixed || 0),
        detrazionipercentonirpef: parseFloat(formData.detrazionipercentonirpef || 0),
        ulterioredetrazionefixed: parseFloat(formData.ulterioredetrazionefixed || 0),
        ulterioredetrazionepercent: parseFloat(formData.ulterioredetrazionepercent || 0),
        bonusl207fixed: parseFloat(formData.bonusl207fixed || 0)
      };

      let response;
      if (editingConfig) {
        response = await axios.put(`/api/taxrates/tax-config/${editingConfig.id}`, dataToSend);
      } else {
        response = await axios.post('/api/taxrates/tax-config', dataToSend);
      }

      if (response.data.success) {
        setMessage(response.data.message);
        setShowAddForm(false);
        setEditingConfig(null);
        setFormData({
          year: '',
          contributionrate: '',
          solidarityrate: '',
          detrazionifixed: '',
          detrazionipercentonirpef: '',
          ulterioredetrazionefixed: '',
          ulterioredetrazionepercent: '',
          bonusl207fixed: ''
        });
        fetchConfigs();
      } else {
        setError(response.data.error || 'Errore durante il salvataggio');
      }
    } catch (error) {
      console.error('Errore salvataggio:', error);
      setError(error.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      year: config.year.toString(),
      contributionrate: config.contributionrate?.toString() || '',
      solidarityrate: config.solidarityrate?.toString() || '',
      detrazionifixed: config.detrazionifixed?.toString() || '',
      detrazionipercentonirpef: config.detrazionipercentonirpef?.toString() || '',
      ulterioredetrazionefixed: config.ulterioredetrazionefixed?.toString() || '',
      ulterioredetrazionepercent: config.ulterioredetrazionepercent?.toString() || '',
      bonusl207fixed: config.bonusl207fixed?.toString() || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (config) => {
    setEditingConfig(config);
  };

  const handleConfirmDelete = async () => {
    if (!editingConfig) return;

    try {
      setLoading(true);
      const response = await axios.delete(`/api/taxrates/tax-config/${editingConfig.id}`);
      
      if (response.data.success) {
        setMessage(response.data.message);
        setEditingConfig(null);
        fetchConfigs();
      } else {
        setError(response.data.error || 'Errore durante l\'eliminazione');
      }
    } catch (error) {
      console.error('Errore eliminazione:', error);
      setError(error.response?.data?.error || 'Errore durante l\'eliminazione');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingConfig(null);
    setFormData({
      year: '',
      contributionrate: '',
      solidarityrate: '',
      detrazionifixed: '',
      detrazionipercentonirpef: '',
      ulterioredetrazionefixed: '',
      ulterioredetrazionepercent: '',
      bonusl207fixed: ''
    });
  };

  // Extra Deduction Rules functions
  const fetchExtraRules = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/taxrates/extra-deduction-rules');
      if (response.data.success) {
        setExtraRules(response.data.data);
      }
    } catch (error) {
      console.error('Errore nel recupero delle regole extra deduction:', error);
      setError('Errore nel recupero delle regole extra deduction');
    } finally {
      setLoading(false);
    }
  };

  const handleExtraFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExtraSelectedFile(file);
      setError('');
      setMessage('');
    }
  };

  const handleExtraUpload = async () => {
    if (!extraSelectedFile) {
      setError('Seleziona un file CSV');
      return;
    }

    setExtraUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', extraSelectedFile);

      const response = await axios.post('/api/taxrates/extra-deduction-rules/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setExtraSelectedFile(null);
        document.getElementById('extra-file-input').value = '';
        fetchExtraRules();
      } else {
        setError(response.data.message || 'Errore durante il caricamento');
      }
    } catch (error) {
      console.error('Errore upload extra deduction:', error);
      setError(error.response?.data?.message || 'Errore durante il caricamento del file');
    } finally {
      setExtraUploading(false);
    }
  };

  const handleExtraInputChange = (e) => {
    const { name, value } = e.target;
    setExtraFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExtraSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        ...extraFormData,
        year: parseInt(extraFormData.year),
        min: parseFloat(extraFormData.min.replace(',', '.')),
        max: extraFormData.max ? parseFloat(extraFormData.max.replace(',', '.')) : null,
        amount: parseFloat(extraFormData.amount.replace(',', '.'))
      };

      let response;
      if (extraEditingRule) {
        response = await axios.put(`/api/taxrates/extra-deduction-rules/${extraEditingRule.id}`, dataToSend);
      } else {
        response = await axios.post('/api/taxrates/extra-deduction-rules', dataToSend);
      }

      if (response.data.success) {
        setMessage(response.data.message);
        setExtraShowAddForm(false);
        setExtraEditingRule(null);
        setExtraFormData({
          year: '',
          min: '',
          max: '',
          amount: ''
        });
        fetchExtraRules();
      } else {
        setError(response.data.error || 'Errore durante il salvataggio');
      }
    } catch (error) {
      console.error('Errore salvataggio extra deduction:', error);
      setError(error.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleExtraEdit = (rule) => {
    setExtraEditingRule(rule);
    setExtraFormData({
      year: rule.year.toString(),
      min: rule.min.toString().replace('.', ','),
      max: rule.max ? rule.max.toString().replace('.', ',') : '',
      amount: rule.amount.toString().replace('.', ',')
    });
    setExtraShowAddForm(true);
  };

  const handleExtraDelete = (rule) => {
    setExtraEditingRule(rule);
  };

  const handleExtraConfirmDelete = async () => {
    if (!extraEditingRule) return;

    try {
      setLoading(true);
      const response = await axios.delete(`/api/taxrates/extra-deduction-rules/${extraEditingRule.id}`);
      
      if (response.data.success) {
        setMessage(response.data.message);
        setExtraEditingRule(null);
        fetchExtraRules();
      } else {
        setError(response.data.error || 'Errore durante l\'eliminazione');
      }
    } catch (error) {
      console.error('Errore eliminazione extra deduction:', error);
      setError(error.response?.data?.error || 'Errore durante l\'eliminazione');
    } finally {
      setLoading(false);
    }
  };

  const handleExtraCancel = () => {
    setExtraShowAddForm(false);
    setExtraEditingRule(null);
    setExtraFormData({
      year: '',
      min: '',
      max: '',
      amount: ''
    });
  };

  // ========================================
  // BONUS L207 RULES FUNCTIONS
  // ========================================

  const fetchBonusL207Rules = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/taxrates/bonus-l207-rules');
      if (response.data.success) {
        setBonusL207Rules(response.data.data);
      }
    } catch (error) {
      console.error('Errore nel recupero delle regole bonus L207:', error);
      setError('Errore nel recupero delle regole bonus L207');
    } finally {
      setLoading(false);
    }
  };

  const handleBonusL207FileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBonusL207SelectedFile(file);
      setError('');
      setMessage('');
    }
  };

  const handleBonusL207Upload = async () => {
    if (!bonusL207SelectedFile) {
      setError('Seleziona un file CSV');
      return;
    }

    setBonusL207Uploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', bonusL207SelectedFile);

      const response = await axios.post('/api/taxrates/bonus-l207-rules/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setBonusL207SelectedFile(null);
        fetchBonusL207Rules();
      } else {
        setError(response.data.message || 'Errore nel caricamento del file');
      }
    } catch (error) {
      console.error('Errore nel caricamento del file bonus L207:', error);
      setError(error.response?.data?.message || 'Errore nel caricamento del file');
    } finally {
      setBonusL207Uploading(false);
    }
  };

  const handleBonusL207InputChange = (e) => {
    const { name, value } = e.target;
    setBonusL207FormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBonusL207Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        year: parseInt(bonusL207FormData.year),
        min: parseFloat(bonusL207FormData.min),
        max: bonusL207FormData.max ? parseFloat(bonusL207FormData.max) : null,
        amount: parseFloat(bonusL207FormData.amount)
      };

      let response;
      if (bonusL207EditingRule) {
        response = await axios.put(`/api/taxrates/bonus-l207-rules/${bonusL207EditingRule.id}`, dataToSend);
      } else {
        response = await axios.post('/api/taxrates/bonus-l207-rules', dataToSend);
      }

      if (response.data.success) {
        setMessage(response.data.message);
        setBonusL207ShowAddForm(false);
        setBonusL207EditingRule(null);
        setBonusL207FormData({
          year: '',
          min: '',
          max: '',
          amount: ''
        });
        fetchBonusL207Rules();
      } else {
        setError(response.data.message || 'Errore nel salvataggio');
      }
    } catch (error) {
      console.error('Errore nel salvataggio regola bonus L207:', error);
      setError(error.response?.data?.message || 'Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleBonusL207Edit = (rule) => {
    setBonusL207EditingRule(rule);
    setBonusL207ShowAddForm(true);
    setBonusL207FormData({
      year: rule.year.toString(),
      min: rule.min.toString(),
      max: rule.max ? rule.max.toString() : '',
      amount: rule.amount.toString()
    });
  };

  const handleBonusL207Delete = (rule) => {
    setBonusL207EditingRule(rule);
  };

  const handleBonusL207ConfirmDelete = async () => {
    if (!bonusL207EditingRule) return;

    try {
      setLoading(true);
      const response = await axios.delete(`/api/taxrates/bonus-l207-rules/${bonusL207EditingRule.id}`);
      
      if (response.data.success) {
        setMessage(response.data.message);
        setBonusL207EditingRule(null);
        fetchBonusL207Rules();
      } else {
        setError(response.data.message || 'Errore nell\'eliminazione');
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione regola bonus L207:', error);
      setError(error.response?.data?.message || 'Errore nell\'eliminazione');
    } finally {
      setLoading(false);
    }
  };

  const handleBonusL207Cancel = () => {
    setBonusL207ShowAddForm(false);
    setBonusL207EditingRule(null);
    setBonusL207FormData({
      year: '',
      min: '',
      max: '',
      amount: ''
    });
  };

  return (
    <div className="tax-config-page">
      <div className="page-header">
        <h1>Configurazioni Fiscali</h1>
        <p>Gestisci le configurazioni fiscali per il calcolo degli stipendi</p>
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <div className="info-card">
          <Info size={20} />
          <div>
            <h3>Informazioni</h3>
            <p>Le configurazioni fiscali contengono i parametri necessari per il calcolo degli stipendi, inclusi contributi, detrazioni e bonus.</p>
          </div>
        </div>
        <div className="info-card">
          <Calculator size={20} />
          <div>
            <h3>Calcolo Stipendi</h3>
            <p>Queste configurazioni vengono utilizzate automaticamente dal calcolatore di stipendi per determinare le trattenute fiscali.</p>
          </div>
        </div>
        <div className="info-card">
          <TrendingUp size={20} />
          <div>
            <h3>Aggiornamenti</h3>
            <p>Assicurati di aggiornare le configurazioni per ogni nuovo anno fiscale per mantenere i calcoli accurati.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={16} />
            Carica CSV
          </button>
          <button 
            className={`tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <Settings size={16} />
            Inserimento Manuale
          </button>
          <button 
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <Calendar size={16} />
            Configurazioni Esistenti
          </button>
          <button 
            className={`tab ${activeTab === 'extra-deduction' ? 'active' : ''}`}
            onClick={() => setActiveTab('extra-deduction')}
          >
            <Layers size={16} />
            Ulteriore Detrazione
          </button>
          <button 
            className={`tab ${activeTab === 'bonus-l207' ? 'active' : ''}`}
            onClick={() => setActiveTab('bonus-l207')}
          >
            <TrendingUp size={16} />
            Bonus L207
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="tab-content">
            <div className="upload-section">
              <div className="upload-area">
                <div className="upload-icon">
                  <FileSpreadsheet size={48} />
                </div>
                <h3>Carica File CSV</h3>
                <p>Seleziona un file CSV con le configurazioni fiscali</p>
                
                <input
                  id="file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="file-input"
                  style={{ display: 'none' }}
                />
                
                <button 
                  onClick={() => document.getElementById('file-input').click()}
                  className="btn btn-primary"
                  style={{ marginBottom: '15px', backgroundColor: '#6c757d', borderColor: '#6c757d' }}
                >
                  <Upload size={16} />
                  Seleziona File CSV
                </button>
                
                {selectedFile && (
                  <div className="selected-file">
                    <FileText size={16} />
                    <span>{selectedFile.name}</span>
                    <button 
                      onClick={() => {
                        setSelectedFile(null);
                        document.getElementById('file-input').value = '';
                      }}
                      className="remove-file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="btn btn-primary"
                >
                  {uploading ? 'Caricamento...' : 'Carica File'}
                </button>
              </div>

              {/* Help Sidebar */}
              <div className="help-sidebar">
                <h4>Formato Richiesto (CSV IT)</h4>
                <div className="format-info">
                  <p><strong>Colonne obbligatorie:</strong></p>
                  <ul>
                    <li><code>anno</code> - Anno fiscale (es. 2025)</li>
                    <li><code>contributi_percentuale</code> - % Contributi (es. 9,19)</li>
                    <li><code>solidarieta_percentuale</code> - % Solidarietà (es. 0,5)</li>
                    <li><code>detrazioni_fisse</code> - Detrazioni fisse (es. 1880)</li>
                    <li><code>detrazioni_percentuale_irpef</code> - % Detrazioni IRPEF (es. 1190)</li>
                    <li><code>ulteriore_detrazione_fissa</code> - Ulteriore detrazione fissa (es. 0)</li>
                    <li><code>ulteriore_detrazione_percentuale</code> - % Ulteriore detrazione (es. 0)</li>
                    <li><code>bonus_l207_fisso</code> - Bonus L207 fisso (es. 0)</li>
                  </ul>
                  <p><strong>Separatore:</strong> Punto e virgola (;)</p>
                  <p><strong>Decimali:</strong> Virgola (es. 9,19)</p>
                </div>

                <h4>File di Esempio</h4>
                <a
                  href="/examples/tax/tax-config-example-italian.csv"
                  download="tax-config-example-italian.csv"
                  className="btn btn-secondary"
                >
                  <Download size={16} />
                  Scarica File di Esempio
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <div className="tab-content">
            <div className="manual-section">
              <div className="section-header">
                <h3>{editingConfig ? 'Modifica Configurazione' : 'Nuova Configurazione'}</h3>
                {!showAddForm && (
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="btn btn-primary"
                  >
                    <Plus size={16} />
                    Aggiungi Configurazione
                  </button>
                )}
              </div>

              {showAddForm && (
                <form onSubmit={handleSubmit} className="config-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="year">Anno *</label>
                      <input
                        type="number"
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                        min="2020"
                        max="2030"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="contributionrate">Contributi %</label>
                      <input
                        type="number"
                        id="contributionrate"
                        name="contributionrate"
                        value={formData.contributionrate}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="solidarityrate">Solidarietà %</label>
                      <input
                        type="number"
                        id="solidarityrate"
                        name="solidarityrate"
                        value={formData.solidarityrate}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="detrazionifixed">Detrazioni Fisse</label>
                      <input
                        type="number"
                        id="detrazionifixed"
                        name="detrazionifixed"
                        value={formData.detrazionifixed}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="detrazionipercentonirpef">Detrazioni % IRPEF</label>
                      <input
                        type="number"
                        id="detrazionipercentonirpef"
                        name="detrazionipercentonirpef"
                        value={formData.detrazionipercentonirpef}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="ulterioredetrazionefixed">Ulteriore Detrazione Fissa</label>
                      <input
                        type="number"
                        id="ulterioredetrazionefixed"
                        name="ulterioredetrazionefixed"
                        value={formData.ulterioredetrazionefixed}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="ulterioredetrazionepercent">Ulteriore Detrazione %</label>
                      <input
                        type="number"
                        id="ulterioredetrazionepercent"
                        name="ulterioredetrazionepercent"
                        value={formData.ulterioredetrazionepercent}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="bonusl207fixed">Bonus L207 Fisso</label>
                      <input
                        type="number"
                        id="bonusl207fixed"
                        name="bonusl207fixed"
                        value={formData.bonusl207fixed}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Salvataggio...' : (editingConfig ? 'Aggiorna' : 'Salva')}
                    </button>
                    <button type="button" onClick={handleCancel} className="btn btn-secondary">
                      Annulla
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="tab-content">
            <div className="list-section">
              <div className="section-header">
                <h3>Configurazioni Esistenti</h3>
                <p>Gestisci le configurazioni fiscali caricate</p>
              </div>

              {loading ? (
                <div className="loading">Caricamento configurazioni...</div>
              ) : configs.length === 0 ? (
                <div className="empty-state">
                  <Settings size={48} />
                  <h3>Nessuna configurazione trovata</h3>
                  <p>Carica un file CSV o aggiungi manualmente una configurazione</p>
                </div>
              ) : (
                <div className="configs-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Anno</th>
                        <th>Contributi %</th>
                        <th>Solidarietà %</th>
                        <th>Detrazioni Fisse</th>
                        <th>Detrazioni % IRPEF</th>
                        <th>Ulteriore Detr. Fissa</th>
                        <th>Ulteriore Detr. %</th>
                        <th>Bonus L207</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map((config) => (
                        <tr key={config.id}>
                          <td>{config.year}</td>
                          <td>{config.contributionrate ? `${config.contributionrate}%` : '-'}</td>
                          <td>{config.solidarityrate ? `${config.solidarityrate}%` : '-'}</td>
                          <td>{config.detrazionifixed ? `€${config.detrazionifixed}` : '-'}</td>
                          <td>{config.detrazionipercentonirpef ? `${config.detrazionipercentonirpef}%` : '-'}</td>
                          <td>{config.ulterioredetrazionefixed ? `€${config.ulterioredetrazionefixed}` : '-'}</td>
                          <td>{config.ulterioredetrazionepercent ? `${config.ulterioredetrazionepercent}%` : '-'}</td>
                          <td>{config.bonusl207fixed ? `€${config.bonusl207fixed}` : '-'}</td>
                          <td className="actions-cell">
                            <div className="actions-inline">
                              <button
                                onClick={() => handleEdit(config)}
                                className="action-btn edit-icon-only"
                                title="Modifica configurazione"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(config)}
                                className="action-btn delete-icon-only"
                                title="Elimina configurazione"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Extra Deduction Tab */}
        {activeTab === 'extra-deduction' && (
          <div className="tab-content">
            <div className="extra-deduction-section">
              <div className="section-header">
                <h3>Regole Ulteriore Detrazione</h3>
                <p>Gestisci le regole per l'ulteriore detrazione a scaglioni sull'imponibile</p>
              </div>

              {/* Sub-tabs for extra deduction */}
              <div className="sub-tabs">
                <button 
                  className={`sub-tab ${activeExtraTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setActiveExtraTab('upload')}
                >
                  <Upload size={14} />
                  Carica CSV
                </button>
                <button 
                  className={`sub-tab ${activeExtraTab === 'manual' ? 'active' : ''}`}
                  onClick={() => setActiveExtraTab('manual')}
                >
                  <Plus size={14} />
                  Inserimento Manuale
                </button>
                <button 
                  className={`sub-tab ${activeExtraTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveExtraTab('list')}
                >
                  <Layers size={14} />
                  Regole Esistenti
                </button>
              </div>

              {/* Upload Sub-tab */}
              {activeExtraTab === 'upload' && (
                <div className="sub-tab-content">
                  <div className="upload-section">
                    <div className="upload-area">
                      <div className="upload-icon">
                        <FileSpreadsheet size={48} />
                      </div>
                      <h3>Carica File CSV</h3>
                      <p>Seleziona un file CSV con le regole per l'ulteriore detrazione</p>
                      
                      <input
                        id="extra-file-input"
                        type="file"
                        accept=".csv"
                        onChange={handleExtraFileSelect}
                        className="file-input"
                        style={{ display: 'none' }}
                      />
                      
                      <button 
                        onClick={() => document.getElementById('extra-file-input').click()}
                        className="btn btn-primary"
                        style={{ marginBottom: '15px', backgroundColor: '#6c757d', borderColor: '#6c757d' }}
                      >
                        <Upload size={16} />
                        Seleziona File CSV
                      </button>
                      
                      {extraSelectedFile && (
                        <div className="selected-file">
                          <FileText size={16} />
                          <span>{extraSelectedFile.name}</span>
                          <button 
                            onClick={() => {
                              setExtraSelectedFile(null);
                              document.getElementById('extra-file-input').value = '';
                            }}
                            className="remove-file"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      
                      <button 
                        onClick={handleExtraUpload}
                        disabled={!extraSelectedFile || extraUploading}
                        className="btn btn-primary"
                      >
                        {extraUploading ? 'Caricamento...' : 'Carica File'}
                      </button>
                    </div>

                    <div className="help-sidebar">
                      <h4>Formato Richiesto (CSV IT)</h4>
                      <div className="format-info">
                        <p><strong>Colonne obbligatorie:</strong></p>
                        <ul>
                          <li><code>anno</code> - Anno fiscale (es. 2025)</li>
                          <li><code>minimo</code> - Importo minimo scaglione (es. 0)</li>
                          <li><code>massimo</code> - Importo massimo scaglione (vuoto per ultimo)</li>
                          <li><code>importo</code> - Importo fisso detrazione (es. 100)</li>
                        </ul>
                        <p><strong>Separatore:</strong> Punto e virgola (;)</p>
                        <p><strong>Decimali:</strong> Virgola (es. 150,50)</p>
                      </div>

                      <h4>File di Esempio</h4>
                      <a
                        href="/examples/tax/extra-deduction-rules-example-italian.csv"
                        download="extra-deduction-rules-example-italian.csv"
                        className="btn btn-secondary"
                      >
                        <Download size={16} />
                        Scarica File di Esempio
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Sub-tab */}
              {activeExtraTab === 'manual' && (
                <div className="sub-tab-content">
                  <div className="manual-section">
                    <div className="section-header">
                      <h3>{extraEditingRule ? 'Modifica Regola' : 'Nuova Regola'}</h3>
                      {!extraShowAddForm && (
                        <button 
                          onClick={() => setExtraShowAddForm(true)}
                          className="btn btn-primary"
                        >
                          <Plus size={16} />
                          Aggiungi Regola
                        </button>
                      )}
                    </div>

                    {extraShowAddForm && (
                      <form onSubmit={handleExtraSubmit} className="config-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="extra-year">Anno *</label>
                            <input
                              type="number"
                              id="extra-year"
                              name="year"
                              value={extraFormData.year}
                              onChange={handleExtraInputChange}
                              required
                              min="2020"
                              max="2030"
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="extra-min">Minimo Scaglione *</label>
                            <input
                              type="text"
                              id="extra-min"
                              name="min"
                              value={extraFormData.min}
                              onChange={handleExtraInputChange}
                              required
                              placeholder="Es. 0 o 15000"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="extra-max">Massimo Scaglione</label>
                            <input
                              type="text"
                              id="extra-max"
                              name="max"
                              value={extraFormData.max}
                              onChange={handleExtraInputChange}
                              placeholder="Es. 15000 (vuoto per ultimo scaglione)"
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="extra-amount">Importo Detrazione *</label>
                            <input
                              type="text"
                              id="extra-amount"
                              name="amount"
                              value={extraFormData.amount}
                              onChange={handleExtraInputChange}
                              required
                              placeholder="Es. 100,50"
                            />
                          </div>
                        </div>

                        <div className="form-actions">
                          <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Salvataggio...' : (extraEditingRule ? 'Aggiorna' : 'Salva')}
                          </button>
                          <button type="button" onClick={handleExtraCancel} className="btn btn-secondary">
                            Annulla
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* List Sub-tab */}
              {activeExtraTab === 'list' && (
                <div className="sub-tab-content">
                  <div className="list-section">
                    <div className="section-header">
                      <h3>Regole Esistenti</h3>
                      <p>Gestisci le regole ulteriore detrazione caricate</p>
                    </div>

                    {loading ? (
                      <div className="loading">Caricamento regole...</div>
                    ) : extraRules.length === 0 ? (
                      <div className="empty-state">
                        <Layers size={48} />
                        <h3>Nessuna regola trovata</h3>
                        <p>Carica un file CSV o aggiungi manualmente una regola</p>
                      </div>
                    ) : (
                      <div className="rules-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Anno</th>
                              <th>Minimo</th>
                              <th>Massimo</th>
                              <th>Importo Detrazione</th>
                              <th>Azioni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extraRules.map((rule) => (
                              <tr key={rule.id}>
                                <td>{rule.year}</td>
                                <td>€{rule.min.toLocaleString('it-IT')}</td>
                                <td>{rule.max ? `€${rule.max.toLocaleString('it-IT')}` : 'Illimitato'}</td>
                                <td>€{rule.amount.toLocaleString('it-IT')}</td>
                                <td className="actions-cell">
                                  <div className="actions-inline">
                                    <button
                                      onClick={() => handleExtraEdit(rule)}
                                      className="action-btn edit-icon-only"
                                      title="Modifica regola"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleExtraDelete(rule)}
                                      className="action-btn delete-icon-only"
                                      title="Elimina regola"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bonus L207 Tab */}
        {activeTab === 'bonus-l207' && (
          <div className="tab-content">
            <div className="extra-deduction-section">
              <div className="section-header">
                <h3>Regole Bonus L207</h3>
                <p>Gestisci le regole per il bonus L207 a scaglioni sull'imponibile</p>
              </div>

              {/* Sub-tabs for bonus L207 */}
              <div className="sub-tabs">
                <button 
                  className={`sub-tab ${activeExtraTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setActiveExtraTab('upload')}
                >
                  <Upload size={14} />
                  Carica CSV
                </button>
                <button 
                  className={`sub-tab ${activeExtraTab === 'manual' ? 'active' : ''}`}
                  onClick={() => setActiveExtraTab('manual')}
                >
                  <Plus size={14} />
                  Inserimento Manuale
                </button>
                <button 
                  className={`sub-tab ${activeExtraTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveExtraTab('list')}
                >
                  <Calendar size={14} />
                  Regole Esistenti
                </button>
              </div>

              {/* Upload Sub-tab */}
              {activeExtraTab === 'upload' && (
                <div className="sub-tab-content">
                  <div className="upload-area">
                    <div className="upload-icon">
                      <FileSpreadsheet size={48} />
                    </div>
                    <h3>Carica File CSV</h3>
                    <p>Seleziona un file CSV con le regole bonus L207</p>
                    
                    <input
                      id="bonus-l207-file-input"
                      type="file"
                      accept=".csv"
                      onChange={handleBonusL207FileSelect}
                      className="file-input"
                      style={{ display: 'none' }}
                    />
                    
                    <button 
                      onClick={() => document.getElementById('bonus-l207-file-input').click()}
                      className="btn btn-primary"
                      style={{ marginBottom: '15px', backgroundColor: '#6c757d', borderColor: '#6c757d' }}
                    >
                      <Upload size={16} />
                      Seleziona File CSV
                    </button>
                    
                    {bonusL207SelectedFile && (
                      <div className="selected-file">
                        <FileText size={16} />
                        <span>{bonusL207SelectedFile.name}</span>
                        <button 
                          onClick={() => {
                            setBonusL207SelectedFile(null);
                            document.getElementById('bonus-l207-file-input').value = '';
                          }}
                          className="remove-file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    
                    <button 
                      onClick={handleBonusL207Upload}
                      disabled={!bonusL207SelectedFile || bonusL207Uploading}
                      className="btn btn-primary"
                    >
                      {bonusL207Uploading ? 'Caricamento...' : 'Carica File'}
                    </button>
                  </div>

                  {/* Help Sidebar */}
                  <div className="help-sidebar">
                    <h4>Formato Richiesto (CSV IT)</h4>
                    <div className="format-info">
                      <p><strong>Colonne obbligatorie:</strong></p>
                      <ul>
                        <li><code>anno</code> - Anno fiscale (es. 2025)</li>
                        <li><code>minimo</code> - Imponibile minimo (es. 0)</li>
                        <li><code>massimo</code> - Imponibile massimo (es. 15000, lascia vuoto per ultimo scaglione)</li>
                        <li><code>importo</code> - Importo bonus (es. 400,12)</li>
                      </ul>
                      <p><strong>Separatore:</strong> Punto e virgola (;)</p>
                      <p><strong>Decimali:</strong> Virgola (es. 400,12)</p>
                    </div>

                    <h4>File di Esempio</h4>
                    <a
                      href="/examples/tax/bonus-l207-rules-example-italian.csv"
                      download="bonus-l207-rules-example-italian.csv"
                      className="btn btn-secondary"
                    >
                      <Download size={16} />
                      Scarica File di Esempio
                    </a>
                  </div>
                </div>
              )}

              {/* Manual Sub-tab */}
              {activeExtraTab === 'manual' && (
                <div className="sub-tab-content">
                  <div className="section-header">
                    <h3>{bonusL207EditingRule ? 'Modifica Regola' : 'Nuova Regola'}</h3>
                    {!bonusL207ShowAddForm && (
                      <button 
                        onClick={() => setBonusL207ShowAddForm(true)}
                        className="btn btn-primary"
                      >
                        <Plus size={16} />
                        Aggiungi Regola
                      </button>
                    )}
                  </div>

                  {bonusL207ShowAddForm && (
                    <form onSubmit={handleBonusL207Submit} className="config-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="bonusL207-year">Anno *</label>
                          <input
                            type="number"
                            id="bonusL207-year"
                            name="year"
                            value={bonusL207FormData.year}
                            onChange={handleBonusL207InputChange}
                            required
                            min="2020"
                            max="2030"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="bonusL207-min">Imponibile Minimo *</label>
                          <input
                            type="number"
                            id="bonusL207-min"
                            name="min"
                            value={bonusL207FormData.min}
                            onChange={handleBonusL207InputChange}
                            required
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="bonusL207-max">Imponibile Massimo</label>
                          <input
                            type="number"
                            id="bonusL207-max"
                            name="max"
                            value={bonusL207FormData.max}
                            onChange={handleBonusL207InputChange}
                            step="0.01"
                            min="0"
                            placeholder="Lascia vuoto per ultimo scaglione"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="bonusL207-amount">Importo Bonus *</label>
                          <input
                            type="number"
                            id="bonusL207-amount"
                            name="amount"
                            value={bonusL207FormData.amount}
                            onChange={handleBonusL207InputChange}
                            required
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          {loading ? 'Salvataggio...' : (bonusL207EditingRule ? 'Aggiorna' : 'Salva')}
                        </button>
                        <button type="button" onClick={handleBonusL207Cancel} className="btn btn-secondary">
                          Annulla
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* List Sub-tab */}
              {activeExtraTab === 'list' && (
                <div className="sub-tab-content">
                  <div className="rules-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Anno</th>
                          <th>Imponibile Min</th>
                          <th>Imponibile Max</th>
                          <th>Importo Bonus</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bonusL207Rules.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="no-data">Nessuna regola bonus L207 trovata</td>
                          </tr>
                        ) : (
                          bonusL207Rules.map((rule) => (
                            <tr key={rule.id}>
                              <td>{rule.year}</td>
                              <td>€{rule.min.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                              <td>{rule.max ? `€${rule.max.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : 'Illimitato'}</td>
                              <td>€{rule.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                              <td>
                                <button
                                  onClick={() => handleBonusL207Edit(rule)}
                                  className="action-btn edit-icon-only"
                                  title="Modifica regola"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleBonusL207Delete(rule)}
                                  className="action-btn delete-icon-only"
                                  title="Elimina regola"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className="message success">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="close-btn">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="message error">
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-btn">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      {editingConfig && !extraEditingRule && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setEditingConfig(null)}
          onConfirm={handleConfirmDelete}
          title="Conferma Eliminazione"
          message={`Sei sicuro di voler eliminare la configurazione per l'anno ${editingConfig.year}?`}
          confirmText="Elimina"
          cancelText="Annulla"
          type="danger"
        />
      )}

      {/* Extra Deduction Delete Confirmation */}
      {extraEditingRule && !editingConfig && !bonusL207EditingRule && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setExtraEditingRule(null)}
          onConfirm={handleExtraConfirmDelete}
          title="Conferma Eliminazione"
          message={`Sei sicuro di voler eliminare la regola per l'anno ${extraEditingRule.year} (${extraEditingRule.min} - ${extraEditingRule.max || 'illimitato'})?`}
          confirmText="Elimina"
          cancelText="Annulla"
          type="danger"
        />
      )}

      {/* Bonus L207 Delete Confirmation */}
      {bonusL207EditingRule && !editingConfig && !extraEditingRule && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setBonusL207EditingRule(null)}
          onConfirm={handleBonusL207ConfirmDelete}
          title="Conferma Eliminazione"
          message={`Sei sicuro di voler eliminare la regola bonus L207 per l'anno ${bonusL207EditingRule.year} (${bonusL207EditingRule.min} - ${bonusL207EditingRule.max || 'illimitato'})?`}
          confirmText="Elimina"
          cancelText="Annulla"
          type="danger"
        />
      )}
    </div>
  );
}
