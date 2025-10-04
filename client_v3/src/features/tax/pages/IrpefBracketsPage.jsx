import React, { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { apiFetch } from '@/lib/utils/apiFetch';
import { Plus, Trash2, Save, Clock, XCircle, BarChart3 } from 'lucide-react';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import Button from '@/design-system/ds/Button';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import PageHeader from '@/design-system/ds/PageHeader';
import EmptyState from '@/design-system/ds/EmptyState';
import DataTable from '@/design-system/ds/DataTable';

const IrpefBracketsPage = () => {
  const { user } = useAuthStore();
  const [brackets, setBrackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, year: null });
  const [deleteBracketConfirm, setDeleteBracketConfirm] = useState({ isOpen: false, index: null });
  const [successMessage, setSuccessMessage] = useState({ isOpen: false, message: '' });
  const [showAddYearForm, setShowAddYearForm] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    fetchBrackets();
  }, [selectedYear]);

  useEffect(() => {
    fetchAvailableYears();
  }, []); // Solo al mount iniziale

  // Aggiorna gli anni disponibili quando si eliminano scaglioni o anni
  useEffect(() => {
    if (successMessage.isOpen && successMessage.message.includes('eliminati')) {
      fetchAvailableYears();
    }
  }, [successMessage]);

  const fetchAvailableYears = async () => {
    try {
      console.log('📅 [FETCH YEARS] Loading available years...');
      const response = await apiFetch('/api/taxrates/irpef-brackets/years');
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

  const fetchBrackets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 [FETCH] Loading brackets for year:', selectedYear);
      const response = await apiFetch(`/api/taxrates/irpef-brackets?year=${selectedYear}`);
      
      console.log('📥 [FETCH] Response received:', response);
      
      if (response.success) {
        console.log('📥 [FETCH] Brackets loaded:', response.data);
        // Filtra i record dummy (min: -1)
        const realBrackets = response.data.filter(bracket => bracket.min !== -1);
        console.log('📥 [FETCH] Real brackets (excluding dummy):', realBrackets);
        console.log('📥 [FETCH] Number of real brackets:', realBrackets.length);
        setBrackets(realBrackets);
      } else {
        console.error('❌ [FETCH] Error in response:', response);
        setError('Errore nel recupero degli scaglioni IRPEF');
      }
    } catch (err) {
      console.error('❌ [FETCH] Exception during fetch:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrackets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💾 [MANUAL SAVE] Starting save process...');
      console.log('💾 [MANUAL SAVE] Year:', selectedYear);
      console.log('💾 [MANUAL SAVE] Brackets to save:', brackets);
      
      const response = await apiFetch('/api/taxrates/irpef-brackets', {
        method: 'POST',
        body: JSON.stringify({
          year: selectedYear,
          brackets: brackets
        })
      });
      
      console.log('💾 [MANUAL SAVE] API Response:', response);
      
      if (response.success) {
        console.log('✅ [MANUAL SAVE] Save successful!');
        setSuccessMessage({ isOpen: true, message: response.message });
        
        console.log('🔄 [MANUAL SAVE] Refreshing data from database...');
        await fetchBrackets();
        await fetchAvailableYears(); // Aggiorna anche la lista degli anni disponibili
        console.log('✅ [MANUAL SAVE] Data refreshed successfully');
      } else {
        console.error('❌ [MANUAL SAVE] Save failed:', response.error);
        setError(response.error || 'Errore nel salvataggio');
      }
    } catch (err) {
      console.error('❌ [MANUAL SAVE] Exception during save:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYear = () => {
    setDeleteConfirm({ isOpen: true, year: selectedYear });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, year: null });
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFetch(`/api/taxrates/irpef-brackets/${deleteConfirm.year}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setSuccessMessage({ isOpen: true, message: response.message });
        setBrackets([]);
        
        // Aggiorna la lista degli anni disponibili dopo l'eliminazione
        await fetchAvailableYears();
        
        // Se l'anno eliminato era quello selezionato, cambia al primo anno disponibile
        if (availableYears.length > 1) {
          const remainingYears = availableYears.filter(year => year !== deleteConfirm.year);
          if (remainingYears.length > 0) {
            setSelectedYear(remainingYears[0]);
          } else {
            setSelectedYear(new Date().getFullYear());
          }
        } else {
          setSelectedYear(new Date().getFullYear());
        }
      } else {
        setError(response.error || 'Errore nell\'eliminazione');
      }
    } catch (err) {
      console.error('Errore eliminazione brackets:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
      setDeleteConfirm({ isOpen: false, year: null });
    }
  };

  const updateBracket = (index, field, value) => {
    const updated = [...brackets];
    if (field === 'max' && value === '') {
      updated[index][field] = null;
    } else {
      updated[index][field] = field === 'rate' ? parseFloat(value) : parseFloat(value);
    }
    setBrackets(updated);
  };

  const addBracket = () => {
    const newBracket = { 
      id: `temp-${Date.now()}`, // ID temporaneo per i nuovi scaglioni
      min: 0, 
      max: null, 
      rate: 0,
      year: selectedYear
    };
    setBrackets([...brackets, newBracket]);
  };

  const removeBracket = (index) => {
    if (brackets.length > 1) {
      setDeleteBracketConfirm({ isOpen: true, index: index });
    }
  };

  const handleCancelBracketDelete = () => {
    setDeleteBracketConfirm({ isOpen: false, index: null });
  };

  const handleConfirmBracketDelete = () => {
    if (deleteBracketConfirm.index !== null) {
      setBrackets(brackets.filter((_, i) => i !== deleteBracketConfirm.index));
    }
    setDeleteBracketConfirm({ isOpen: false, index: null });
  };

  const handleAddYear = () => {
    setShowAddYearForm(true);
    setNewYear('');
  };

  const handleCancelAddYear = () => {
    setShowAddYearForm(false);
    setNewYear('');
  };

  const handleConfirmAddYear = async () => {
    if (!newYear || isNaN(newYear) || newYear < 2020 || newYear > 2030) {
      setError('Inserisci un anno valido (2020-2030)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 [ADD YEAR] Adding new year:', newYear);
      
      // Crea solo l'anno nel database, senza scaglioni predefiniti
      // L'utente dovrà creare manualmente gli scaglioni
      const response = await apiFetch('/api/taxrates/irpef-brackets/year', {
        method: 'POST',
        body: JSON.stringify({
          year: parseInt(newYear)
        })
      });
      
      console.log('📅 [ADD YEAR] API Response:', response);
      
      if (response.success) {
        console.log('✅ [ADD YEAR] Year added successfully!');
        setSuccessMessage({ isOpen: true, message: `Anno ${newYear} aggiunto con successo. Ora puoi creare gli scaglioni manualmente.` });
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

  // Definizione colonne per DataTable
  const columns = [
    {
      header: 'Da (€)',
      accessor: (bracket, index) => (
        <input
          type="number"
          value={bracket.min}
          onChange={(e) => updateBracket(index, 'min', e.target.value)}
          className="input-base w-full text-center"
          min="0"
          step="0.01"
        />
      )
    },
    {
      header: 'A (€)',
      accessor: (bracket, index) => (
        <input
          type="number"
          value={bracket.max || ''}
          onChange={(e) => updateBracket(index, 'max', e.target.value)}
          className="input-base w-full text-center"
          min="0"
          step="0.01"
          placeholder="∞"
        />
      )
    },
    {
      header: 'Aliquota (%)',
      accessor: (bracket, index) => (
        <input
          type="number"
          value={bracket.rate}
          onChange={(e) => updateBracket(index, 'rate', e.target.value)}
          className="input-base w-full text-center"
          min="0"
          max="100"
          step="0.01"
        />
      )
    },
    {
      header: 'Azioni',
      accessor: (bracket, index) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeBracket(index)}
            className="min-w-[32px] h-8"
            title="Elimina scaglione"
            disabled={brackets.length <= 1}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ];

  if (loading && brackets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock size={32} className="animate-spin text-blue-600" />
        <span className="ml-3 text-lg">Caricamento scaglioni IRPEF...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestione Scaglioni IRPEF"
        subtitle="Visualizza e gestisci gli scaglioni IRPEF per i calcoli fiscali"
        icon={BarChart3}
      />

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle size={20} className="text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Anno:</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="input-base"
                >
                  {availableYears.length > 0 ? (
                    availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))
                  ) : (
                    <option value={selectedYear}>{selectedYear}</option>
                  )}
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleAddYear}
                disabled={loading}
              >
                <Plus size={16} />
                Aggiungi Anno
              </Button>
              
              <Button
                variant="primary"
                onClick={addBracket}
                disabled={loading}
              >
                <Plus size={16} />
                Aggiungi Scaglione
              </Button>
              
              <Button
                variant="success"
                onClick={handleSaveBrackets}
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
                    Salva Modifiche
                  </>
                )}
              </Button>
              
              {brackets.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteYear}
                  disabled={loading}
                >
                  <Trash2 size={16} />
                  Elimina Anno
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add Year Form */}
      {showAddYearForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              📅 Aggiungi Nuovo Anno
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Anno:</label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  min="2020"
                  max="2030"
                  placeholder="es. 2026"
                  className="input-base"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Verranno creati scaglioni predefiniti per l'anno selezionato
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={handleCancelAddYear}
                >
                  Annulla
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmAddYear}
                  disabled={loading || !newYear}
                >
                  {loading ? (
                    <>
                      <Clock size={16} />
                      Creazione...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Crea Anno
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brackets List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            📋 Scaglioni IRPEF per l'anno {selectedYear}
          </h3>
        </CardHeader>
        <CardContent>
          {brackets.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title={`Nessuno scaglione IRPEF trovato per l'anno ${selectedYear}`}
              description="Usa il pulsante 'Aggiungi Scaglione' per crearne di nuovi."
              action={
                <Button
                  variant="primary"
                  onClick={addBracket}
                >
                  <Plus size={16} />
                  Aggiungi Primo Scaglione
                </Button>
              }
            />
          ) : (
            <DataTable
              data={brackets}
              columns={columns}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog di conferma eliminazione */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && handleCancelDelete()}
        onConfirm={handleConfirmDelete}
        title="Elimina Scaglioni IRPEF"
        message={`Sei sicuro di voler eliminare tutti gli scaglioni IRPEF per l'anno ${deleteConfirm.year}?`}
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      {/* Dialog di conferma eliminazione singolo scaglione */}
      <ConfirmDialog
        open={deleteBracketConfirm.isOpen}
        onOpenChange={(open) => !open && handleCancelBracketDelete()}
        onConfirm={handleConfirmBracketDelete}
        title="Elimina Scaglione"
        message="Sei sicuro di voler eliminare questo scaglione?"
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
      />

      {/* Dialog di successo */}
      <ConfirmDialog
        open={successMessage.isOpen}
        onOpenChange={(open) => !open && setSuccessMessage({ isOpen: false, message: '' })}
        onConfirm={() => setSuccessMessage({ isOpen: false, message: '' })}
        title="Operazione Completata"
        message={successMessage.message}
        confirmText="Ok"
        cancelText=""
        type="success"
        showCancel={false}
      />
    </div>
  );
};

export default IrpefBracketsPage;
