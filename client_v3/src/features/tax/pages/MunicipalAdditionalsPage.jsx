import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/apiClient';
import useAuthStore from '@/store/authStore';
import { Plus, Trash2, Edit3, XCircle, Clock, CheckCircle, Save } from 'lucide-react';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import PageHeader from '@/design-system/ds/PageHeader';
import GlobalLoader from '@/components/ui/GlobalLoader';
import municipalitiesData from '@/data/municipalities.json';

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
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    region: '',
    municipality: '',
    isProgressive: false,
    flatRate: '',
    brackets: [{ min: 0, max: '', rate: '' }]
  });
  const [showAddYearForm, setShowAddYearForm] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [successMessage, setSuccessMessage] = useState({ isOpen: false, message: '' });
  const [showDeleteYearDialog, setShowDeleteYearDialog] = useState(false);
  const [yearToDelete, setYearToDelete] = useState(null);
  const [deleteYearSuccess, setDeleteYearSuccess] = useState({ isOpen: false, message: '' });

  // Carica anni disponibili
  const fetchAvailableYears = async () => {
    try {
      console.log('📅 [FETCH YEARS] Loading available years for municipal additionals...');
      const response = await apiFetch('/api/taxrates/municipal-additionals/years');
      console.log('📅 [FETCH YEARS] Response received:', response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        console.log('📅 [FETCH YEARS] Years loaded:', response.data);
        setAvailableYears(response.data.sort((a, b) => b - a)); // Ordine decrescente (più recenti prima)
        
        // Se l'anno selezionato non è più disponibile, cambia al primo anno disponibile
        if (response.data.length > 0 && !response.data.includes(selectedYear)) {
          console.log('📅 [FETCH YEARS] Selected year not available, switching to:', response.data[0]);
          setSelectedYear(response.data[0]);
        }
      } else {
        console.error('❌ [FETCH YEARS] Error in response:', response);
        setAvailableYears([]);
      }
    } catch (err) {
      console.error('❌ [FETCH YEARS] Exception:', err);
      setAvailableYears([]);
    }
  };

  // Carica addizionali comunali
  const loadAdditionals = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/taxrates/municipal-additionals?year=${selectedYear}`);
      if (response.success) {
        setAdditionals(response.data);
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
    fetchAvailableYears();
  }, [selectedYear]);

  useEffect(() => {
    fetchAvailableYears();
  }, []); // Solo al mount iniziale

  // Pre-riempie il form quando cambia la regione/comune selezionato
  useEffect(() => {
    if (selectedRegion && selectedMunicipality && additionals.length > 0) {
      // Cerca addizionali per la regione/comune selezionato
      const existingAdditional = additionals.find(additional => 
        additional.region === selectedRegion && 
        additional.municipality === selectedMunicipality && 
        additional.year === selectedYear
      );
      
      if (existingAdditional) {
        console.log('🔄 [FORM PRE-FILL] Found existing additional for region/municipality:', selectedRegion, selectedMunicipality, existingAdditional);
        
        setFormData({
          year: existingAdditional.year,
          region: existingAdditional.region,
          municipality: existingAdditional.municipality,
          isProgressive: existingAdditional.is_progressive,
          flatRate: existingAdditional.flat_rate || '',
          brackets: existingAdditional.tax_municipal_additional_bracket?.map(bracket => ({
            min: bracket.min,
            max: bracket.max || '',
            rate: bracket.rate
          })) || [{ min: 0, max: '', rate: '' }]
        });
        
        console.log('✅ [FORM PRE-FILL] Form pre-filled with:', formData);
      } else {
        console.log('🔄 [FORM PRE-FILL] No existing additional found for region/municipality:', selectedRegion, selectedMunicipality);
        // Reset form to default values
        setFormData({
          year: selectedYear,
          region: selectedRegion,
          municipality: selectedMunicipality,
          isProgressive: false,
          flatRate: '',
          brackets: [{ min: 0, max: '', rate: '' }]
        });
      }
    }
  }, [selectedRegion, selectedMunicipality, selectedYear, additionals]);

  // Aggiorna formData.year quando selectedYear cambia
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      year: selectedYear
    }));
  }, [selectedYear]);

  // Aggiorna formData.region quando selectedRegion cambia
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      region: selectedRegion
    }));
  }, [selectedRegion]);

  // Aggiorna formData.municipality quando selectedMunicipality cambia
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      municipality: selectedMunicipality
    }));
  }, [selectedMunicipality]);

  // Reset comune quando cambia regione
  useEffect(() => {
    setSelectedMunicipality('');
  }, [selectedRegion]);

  // Lista comuni filtrata per regione con deduplica per evitare key duplicate
  const getFilteredMunicipalities = () => {
    const list = selectedRegion
      ? municipalitiesData.filter(m => m.region === selectedRegion)
      : municipalitiesData;

    // Deduplica per nome all'interno della regione selezionata
    const seen = new Set();
    const unique = [];
    for (const m of list) {
      const k = `${m.region}::${m.name}`;
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(m);
    }
    return unique;
  };

  // Gestione anni
  const handleAddYear = () => {
    setShowAddYearForm(true);
  };

  const handleCancelAddYear = () => {
    setShowAddYearForm(false);
    setNewYear('');
  };

  const handleConfirmAddYear = async () => {
    if (!newYear || isNaN(newYear) || newYear < 2000 || newYear > 2100) {
      setError('Inserisci un anno valido (2000-2100)');
      return;
    }

    if (availableYears.includes(parseInt(newYear))) {
      setError('Questo anno esiste già');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 [ADD YEAR] Adding new year:', newYear);
      
      // Crea solo l'anno nel database, senza addizionali predefinite
      // L'utente dovrà creare manualmente le addizionali
      const response = await apiFetch('/api/taxrates/municipal-additionals/year', {
        method: 'POST',
        body: JSON.stringify({
          year: parseInt(newYear)
        })
      });
      
      console.log('📅 [ADD YEAR] API Response:', response);
      
      if (response.success) {
        console.log('✅ [ADD YEAR] Year added successfully!');
        setSuccessMessage({ isOpen: true, message: `Anno ${newYear} aggiunto con successo. Ora puoi creare le addizionali manualmente.` });
        setShowAddYearForm(false);
        setNewYear('');
        
        // Cambia automaticamente al nuovo anno
        setSelectedYear(parseInt(newYear));
        
        // Aggiorna la lista degli anni disponibili
        await fetchAvailableYears();
      } else {
        console.error('❌ [ADD YEAR] Failed to add year:', response.error);
        setError(response.error || 'Errore nell\'aggiunta del nuovo anno');
      }
    } catch (err) {
      console.error('❌ [ADD YEAR] Exception during add year:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  // Gestione eliminazione anno
  const handleDeleteYear = (year) => {
    setYearToDelete(year);
    setShowDeleteYearDialog(true);
  };

  const handleCancelDeleteYear = () => {
    setShowDeleteYearDialog(false);
    setYearToDelete(null);
  };

  const handleConfirmDeleteYear = async () => {
    if (!yearToDelete) return;

    try {
      setLoading(true);
      console.log('🗑️ [DELETE YEAR] Deleting year:', yearToDelete);
      
      const response = await apiFetch(`/api/taxrates/municipal-additionals/${yearToDelete}`, {
        method: 'DELETE'
      });

      console.log('🗑️ [DELETE YEAR] Response:', response);

      if (response.success) {
        console.log('✅ [DELETE YEAR] Year deleted successfully');
        setDeleteYearSuccess({ isOpen: true, message: `Anno ${yearToDelete} eliminato con successo!` });
        await fetchAvailableYears(); // Ricarica gli anni disponibili
        
        // Se l'anno eliminato era selezionato, resetta la selezione
        if (selectedYear === yearToDelete) {
          setSelectedYear('');
        }
      } else {
        console.error('❌ [DELETE YEAR] Failed to delete year:', response.error);
        alert(`Errore: ${response.error || 'Impossibile eliminare l\'anno'}`);
      }
    } catch (error) {
      console.error('❌ [DELETE YEAR] Error deleting year:', error);
      alert('Errore durante l\'eliminazione dell\'anno');
    } finally {
      setLoading(false);
      setShowDeleteYearDialog(false);
      setYearToDelete(null);
    }
  };

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
      
      const response = await apiFetch('/api/taxrates/municipal-additionals', {
        method: 'POST',
        body: JSON.stringify(dataToSend)
      });
      console.log('🟢 Risposta ricevuta:', response);
      console.log('🔵 Risposta API:', response);
      
      if (response.success) {
        await loadAdditionals();
        setShowAddForm(false);
        resetForm();
        setEditingId(null);
        setError(null);
      } else {
        setError(response.error || 'Errore nel salvataggio');
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
      const response = await apiFetch(`/api/taxrates/municipal-additionals/${deleteConfirm.additional.id}`, {
        method: 'DELETE'
      });
      if (response.success) {
        await loadAdditionals();
        setDeleteConfirm({
          isOpen: false,
          additional: null
        });
      } else {
        setError(response.error || 'Errore nell\'eliminazione');
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
    setSelectedRegion(additional.region); // ← AGGIORNA IL DROPDOWN REGIONE!
    setSelectedMunicipality(additional.municipality); // ← AGGIORNA IL DROPDOWN COMUNE!

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
    return <GlobalLoader sectionName="Contratti e Finanze" fullscreen />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestione Addizionali Comunali"
        subtitle="Visualizza e gestisci le addizionali comunali per i calcoli fiscali"
        icon={CheckCircle}
      />

      {/* Selezione Anno e Aggiungi Anno */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Anno:</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="input-base w-full sm:w-32"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddYear}
                variant="secondary"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Aggiungi Anno
              </Button>
              {selectedYear && (
                <Button 
                  onClick={() => handleDeleteYear(selectedYear)}
                  variant="destructive"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Elimina Anno
                </Button>
              )}
            </div>
          </div>
          
          {/* Form Aggiungi Anno */}
          {showAddYearForm && (
            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-foreground">Nuovo Anno:</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="Es. 2026"
                    min="2000"
                    max="2100"
                    className="input-base w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleConfirmAddYear}
                    variant="primary"
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? 'Aggiungendo...' : 'Conferma'}
                  </Button>
                  <Button 
                    onClick={handleCancelAddYear}
                    variant="secondary"
                    size="sm"
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Regione:</label>
              <select 
                value={selectedRegion} 
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="input-base w-full sm:w-64"
              >
                <option value="">Tutte le regioni</option>
                <option value="Marche">Marche</option>
                <option value="Lombardia">Lombardia</option>
                <option value="Lazio">Lazio</option>
                <option value="Campania">Campania</option>
                <option value="Piemonte">Piemonte</option>
                <option value="Veneto">Veneto</option>
                <option value="Emilia-Romagna">Emilia-Romagna</option>
                <option value="Toscana">Toscana</option>
                <option value="Puglia">Puglia</option>
                <option value="Sicilia">Sicilia</option>
                <option value="Calabria">Calabria</option>
                <option value="Sardegna">Sardegna</option>
                <option value="Abruzzo">Abruzzo</option>
                <option value="Umbria">Umbria</option>
                <option value="Basilicata">Basilicata</option>
                <option value="Molise">Molise</option>
                <option value="Valle d'Aosta">Valle d'Aosta</option>
                <option value="Trentino-Alto Adige">Trentino-Alto Adige</option>
                <option value="Friuli-Venezia Giulia">Friuli-Venezia Giulia</option>
                <option value="Liguria">Liguria</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Comune:</label>
              <select 
                value={selectedMunicipality} 
                onChange={(e) => setSelectedMunicipality(e.target.value)}
                className="input-base w-full sm:w-64"
              >
                <option value="">Tutti i comuni</option>
                {getFilteredMunicipalities().map((municipality, idx) => {
                  const key = `${municipality.region}::${municipality.name}`;
                  return (
                    <option key={key} value={municipality.name}>
                      {municipality.name}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              variant="primary"
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
            </Button>
          </div>
        </CardHeader>
      </Card>

      {showAddForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Plus size={20} className="text-primary" />
              Aggiungi Addizionale Comunale
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Anno:</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min="2020"
                    max="2030"
                    required
                    className="input-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Regione:</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    required
                    className="input-base"
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
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Comune:</label>
                  <input
                    type="text"
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleInputChange}
                    placeholder="es. Pesaro, Milano, Roma..."
                    required
                    className="input-base"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isProgressive"
                  name="isProgressive"
                  checked={formData.isProgressive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <label htmlFor="isProgressive" className="text-sm font-medium text-foreground">
                  Addizionale progressiva (a scaglioni)
                </label>
              </div>

              {formData.isProgressive ? (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">Scaglioni</h4>
                  {formData.brackets.map((bracket, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Da (€):</label>
                        <input
                          type="number"
                          value={bracket.min}
                          onChange={(e) => updateBracket(index, 'min', e.target.value)}
                          min="0"
                          step="0.01"
                          className="input-base"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">A (€):</label>
                        <input
                          type="number"
                          value={bracket.max || ''}
                          onChange={(e) => updateBracket(index, 'max', e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="Lasciare vuoto per ∞"
                          className="input-base"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Aliquota (%):</label>
                        <input
                          type="number"
                          value={bracket.rate}
                          onChange={(e) => updateBracket(index, 'rate', e.target.value)}
                          min="0"
                          max="10"
                          step="0.01"
                          className="input-base"
                        />
                      </div>
                      
                      <div className="flex items-end gap-2">
                        <Button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); addBracket(); }}
                          variant="primary"
                          size="sm"
                          className="min-w-[32px] h-8"
                          title="Aggiungi scaglione"
                        >
                          <Plus size={14} />
                        </Button>
                        
                        <Button 
                          type="submit"
                          variant="success"
                          size="sm"
                          className="min-w-[32px] h-8"
                          title="Salva addizionale"
                        >
                          <Save size={14} />
                        </Button>
                        
                        {formData.brackets.length > 1 && (
                          <Button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeBracket(index); }}
                            variant="destructive"
                            size="sm"
                            className="min-w-[32px] h-8"
                            title="Elimina scaglione"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tasso Fisso (%):</label>
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
                      className="input-base"
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <Button type="submit" variant="success">
                      <Save size={16} />
                      Salva Addizionale
                    </Button>
                  </div>
                </div>
              )}

            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle size={20} className="text-primary" />
            Addizionali Comunali Configurate
          </h3>
        </CardHeader>
        <CardContent>
          {additionals.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Nessuna addizionale comunale trovata"
              description="Usa il pulsante 'Aggiungi Addizionale' per crearne di nuove."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="dashboard-table w-full">
                <thead>
                  <tr>
                    <th className="text-center">Anno</th>
                    <th className="text-center">Regione</th>
                    <th className="text-center">Comune</th>
                    <th className="text-center">Tipo</th>
                    <th className="text-center">Configurazione</th>
                    <th className="text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {additionals
                    .filter(additional => 
                      (!selectedRegion || additional.region === selectedRegion) &&
                      (!selectedMunicipality || additional.municipality === selectedMunicipality)
                    )
                    .map((additional) => (
                    <tr key={additional.id}>
                      <td className="text-center">{additional.year}</td>
                      <td className="text-center">{additional.region}</td>
                      <td className="text-center">{additional.municipality}</td>
                      <td className="text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          additional.is_progressive 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {additional.is_progressive ? 'Progressiva' : 'Fissa'}
                        </span>
                      </td>
                      <td className="text-center">
                        {additional.is_progressive ? (
                          <span>{additional.tax_municipal_additional_bracket?.length || 0} scaglioni</span>
                        ) : (
                          <span>{additional.flat_rate}%</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="info"
                            size="sm"
                            onClick={() => handleEdit(additional)}
                            title="Modifica"
                            className="min-w-[32px] h-8"
                          >
                            <Edit3 size={16} />
                          </Button>
                          <Button 
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(additional)}
                            title="Elimina"
                            className="min-w-[32px] h-8"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog di conferma eliminazione */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && handleCancelDelete()}
        onConfirm={handleConfirmDelete}
        title="Elimina Addizionale Comunale"
        message={`Sei sicuro di voler eliminare l'addizionale comunale per ${deleteConfirm.additional?.municipality} (${deleteConfirm.additional?.year})?`}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      {/* Dialog di conferma eliminazione anno */}
      <ConfirmDialog
        open={showDeleteYearDialog}
        onOpenChange={(open) => !open && handleCancelDeleteYear()}
        onConfirm={handleConfirmDeleteYear}
        title="Elimina Anno"
        message={`Sei sicuro di voler eliminare l'anno ${yearToDelete}? Questa operazione eliminerà tutte le addizionali comunali per questo anno.`}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      {/* Dialog di successo eliminazione anno */}
      <ConfirmDialog
        open={deleteYearSuccess.isOpen}
        onOpenChange={(open) => setDeleteYearSuccess({ isOpen: open, message: '' })}
        onConfirm={() => setDeleteYearSuccess({ isOpen: false, message: '' })}
        title="Anno Eliminato"
        message={deleteYearSuccess.message}
        confirmText="Chiudi"
        showCancel={false}
        cancelText={null}
      />

      {/* Dialog di successo */}
      <ConfirmDialog
        open={successMessage.isOpen}
        onOpenChange={(open) => setSuccessMessage({ isOpen: open, message: '' })}
        onConfirm={() => setSuccessMessage({ isOpen: false, message: '' })}
        title="Successo"
        message={successMessage.message}
        confirmText="Chiudi"
        showCancel={false}
        cancelText={null}
      />
    </div>
  );
};

export default MunicipalAdditionalsPage;
