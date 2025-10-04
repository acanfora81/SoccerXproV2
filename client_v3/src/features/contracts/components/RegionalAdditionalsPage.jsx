import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import { Plus, Trash2, Edit3, XCircle, Clock, CheckCircle, Save } from 'lucide-react';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';
import EmptyState from '@/design-system/ds/EmptyState';
import PageHeader from '@/design-system/ds/PageHeader';

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
      <div className="space-y-6">
        <PageHeader
          title="Gestione Addizionali Regionali"
          description="Visualizza e gestisci le addizionali regionali per i calcoli fiscali"
        />
        <EmptyState
          icon={Clock}
          title="Caricamento in corso..."
          description="Caricamento addizionali regionali..."
          loading={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestione Addizionali Regionali"
        description="Visualizza e gestisci le addizionali regionali per i calcoli fiscali"
      />

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
                className="flex h-10 w-full sm:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              Aggiungi Addizionale Regionale
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Regione:</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      
                      {formData.brackets.length > 1 && (
                        <Button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); removeBracket(index); }}
                          variant="destructive"
                          size="icon"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button type="button" onClick={(e) => { e.preventDefault(); addBracket(); }} variant="secondary">
                    <Plus size={16} />
                    Aggiungi Scaglione
                  </Button>
                </div>
              ) : (
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  type="submit"
                  variant="primary"
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
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle size={20} className="text-primary" />
            Addizionali Regionali Configurate
          </h3>
        </CardHeader>
        <CardContent>
          {additionals.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Nessuna addizionale regionale trovata"
              description="Usa il pulsante 'Aggiungi Addizionale' per crearne di nuove."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="dashboard-table w-full">
                <thead>
                  <tr>
                    <th className="text-center">Anno</th>
                    <th className="text-center">Regione</th>
                    <th className="text-center">Tipo</th>
                    <th className="text-center">Configurazione</th>
                    <th className="text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {additionals.map((additional) => (
                    <tr key={additional.id}>
                      <td className="text-center">{additional.year}</td>
                      <td className="text-center">{additional.region}</td>
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
                          <span>{additional.tax_regional_additional_bracket?.length || 0} scaglioni</span>
                        ) : (
                          <span>{additional.flat_rate}%</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(additional)}
                            title="Modifica"
                          >
                            <Edit3 size={16} />
                          </Button>
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(additional)}
                            title="Elimina"
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
