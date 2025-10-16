import React, { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { apiFetch } from '@/utils/apiClient';
import { Plus, Trash2, Save, Clock, XCircle, BarChart3, RefreshCw } from 'lucide-react';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import Button from '@/design-system/ds/Button';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import PageHeader from '@/design-system/ds/PageHeader';
import EmptyState from '@/design-system/ds/EmptyState';
import DataTable from '@/design-system/ds/DataTable';
import GlobalLoader from '@/components/ui/GlobalLoader';

const TaxRatesPage = () => {
  const { user } = useAuthStore();
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, year: null });
  const [successMessage, setSuccessMessage] = useState({ isOpen: false, message: '' });
  const [showAddYearForm, setShowAddYearForm] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    if (selectedYear !== null) {
      fetchTaxRates();
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  // Aggiorna gli anni disponibili quando si eliminano aliquote o anni
  useEffect(() => {
    if (successMessage.isOpen && successMessage.message.includes('eliminati')) {
      fetchAvailableYears();
    }
  }, [successMessage]);

  const fetchAvailableYears = async () => {
    try {
      console.log('📅 [FETCH YEARS] Loading available years...');
      const response = await apiFetch('/api/taxrates/tax-rates/years');
      console.log('📅 [FETCH YEARS] Response received:', response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        console.log('📅 [FETCH YEARS] Years loaded:', response.data);
        const sorted = response.data.sort((a, b) => b - a);
        setAvailableYears(sorted);
        if (sorted.length === 0) {
          setSelectedYear(null);
        } else if (selectedYear === null || !sorted.includes(selectedYear)) {
          console.log('📅 [FETCH YEARS] Selecting default year:', sorted[0]);
          setSelectedYear(sorted[0]);
        }
      } else {
        console.error('❌ [FETCH YEARS] Error in response:', response);
        setAvailableYears([]);
        setSelectedYear(null);
      }
    } catch (err) {
      console.error('❌ [FETCH YEARS] Exception:', err);
      setAvailableYears([]);
      setSelectedYear(null);
    }
  };

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 [FETCH] Loading tax rates for year:', selectedYear);
      const response = await apiFetch(`/api/taxrates?year=${selectedYear}`);
      
      console.log('📥 [FETCH] Response received:', response);
      
      if (response.success) {
        console.log('📥 [FETCH] Tax rates loaded:', response.data);
        setTaxRates(response.data);
      } else {
        console.error('❌ [FETCH] Error in response:', response);
        setError('Errore nel recupero delle aliquote contributive');
      }
    } catch (err) {
      console.error('❌ [FETCH] Exception during fetch:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTaxRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💾 [MANUAL SAVE] Starting save process...');
      console.log('💾 [MANUAL SAVE] Year:', selectedYear);
      console.log('💾 [MANUAL SAVE] Tax rates to save:', taxRates);
      
      // Salva ogni aliquota individualmente
      for (const rate of taxRates) {
        const response = await apiFetch('/api/taxrates', {
          method: 'POST',
          body: JSON.stringify({
            teamId: user.teamId,
            year: selectedYear,
            type: rate.type,
            inpsWorker: rate.inpsWorker,
            inpsEmployer: rate.inpsEmployer,
            ffcWorker: rate.ffcWorker,
            ffcEmployer: rate.ffcEmployer,
            inailEmployer: rate.inailEmployer,
            solidarityWorker: rate.solidarityWorker,
            solidarityEmployer: rate.solidarityEmployer
          })
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Errore nel salvataggio');
        }
      }
      
      console.log('✅ [MANUAL SAVE] Save successful!');
      setSuccessMessage({ isOpen: true, message: 'Aliquote contributive salvate con successo!' });
      
      console.log('🔄 [MANUAL SAVE] Refreshing data from database...');
      await fetchTaxRates();
      await fetchAvailableYears();
      console.log('✅ [MANUAL SAVE] Data refreshed successfully');
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
      
      const response = await apiFetch(`/api/taxrates/tax-rates/year/${deleteConfirm.year}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setSuccessMessage({ isOpen: true, message: response.message });
        setTaxRates([]);
        
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
      console.error('Errore eliminazione tax rates:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
      setDeleteConfirm({ isOpen: false, year: null });
    }
  };

  const updateTaxRate = (index, field, value) => {
    const updated = [...taxRates];
    updated[index][field] = parseFloat(value) || 0;
    setTaxRates(updated);
  };

  const handleCreateNewYear = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const year = parseInt(newYear);
      if (!Number.isFinite(year) || year < 2020 || year > 2030) {
        setError('Anno non valido (deve essere tra 2020 e 2030)');
        return;
      }
      
      const response = await apiFetch('/api/taxrates/tax-rates/year', {
        method: 'POST',
        body: JSON.stringify({ year })
      });
      
      if (response.success) {
        setSuccessMessage({ isOpen: true, message: response.message });
        setShowAddYearForm(false);
        setNewYear('');
        await fetchAvailableYears();
        setSelectedYear(year);
      } else {
        setError(response.error || 'Errore nella creazione del nuovo anno');
      }
    } catch (err) {
      console.error('Errore creazione nuovo anno:', err);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
  };

  const columns = [
    {
      Header: 'Tipo Contratto',
      accessor: 'type',
      Cell: ({ value }) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {value === 'DILETTANTE' ? 'Dilettante' : 
           value === 'PROFESSIONISTA' ? 'Professionista' : 
           value === 'APPRENTICESHIP' ? 'Apprendistato' : value}
        </span>
      )
    },
    {
      Header: 'INPS Lavoratore (%)',
      accessor: 'inpsWorker',
      Cell: ({ value, row, rowIndex }) => (
        <input
          type="number"
          step="0.01"
          value={value || ''}
          onChange={(e) => updateTaxRate(rowIndex, 'inpsWorker', e.target.value)}
          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800"
        />
      )
    },
    {
      Header: 'INPS Datore (%)',
      accessor: 'inpsEmployer',
      Cell: ({ value, row, rowIndex }) => (
        <input
          type="number"
          step="0.01"
          value={value || ''}
          onChange={(e) => updateTaxRate(rowIndex, 'inpsEmployer', e.target.value)}
          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800"
        />
      )
    },
    {
      Header: 'FFC Lavoratore (%)',
      accessor: 'ffcWorker',
      Cell: ({ value, row, rowIndex }) => (
        <input
          type="number"
          step="0.01"
          value={value || ''}
          onChange={(e) => updateTaxRate(rowIndex, 'ffcWorker', e.target.value)}
          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800"
        />
      )
    },
    {
      Header: 'FFC Datore (%)',
      accessor: 'ffcEmployer',
      Cell: ({ value, row, rowIndex }) => (
        <input
          type="number"
          step="0.01"
          value={value || ''}
          onChange={(e) => updateTaxRate(rowIndex, 'ffcEmployer', e.target.value)}
          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800"
        />
      )
    },
    {
      Header: 'INAIL Datore (%)',
      accessor: 'inailEmployer',
      Cell: ({ value, row, rowIndex }) => (
        <input
          type="number"
          step="0.01"
          value={value || ''}
          onChange={(e) => updateTaxRate(rowIndex, 'inailEmployer', e.target.value)}
          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800"
        />
      )
    },
    {
      Header: 'Solidarietà Lavoratore (%)',
      accessor: 'solidarityWorker',
      Cell: ({ value, row, rowIndex }) => (
        <input
          type="number"
          step="0.01"
          value={value || ''}
          onChange={(e) => updateTaxRate(rowIndex, 'solidarityWorker', e.target.value)}
          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800"
        />
      )
    },
    {
      Header: 'Solidarietà Datore (%)',
      accessor: 'solidarityEmployer',
      Cell: ({ value, row, rowIndex }) => (
        <input
          type="number"
          step="0.01"
          value={value || ''}
          onChange={(e) => updateTaxRate(rowIndex, 'solidarityEmployer', e.target.value)}
          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800"
        />
      )
    }
  ];

  if (!user?.teamId) {
    return <EmptyState title="Nessun team selezionato" description="Accedi con un team valido per gestire le aliquote contributive." />;
  }

  if (loading && selectedYear !== null) return <GlobalLoader sectionName="Aliquote contributive" fullscreen={false} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aliquote contributive"
        description="Gestisci le aliquote contributive per tipo di contratto e anno."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Anno</label>
              {availableYears.length > 0 ? (
                <select 
                  value={selectedYear ?? ''} 
                  onChange={handleYearChange}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">Nessun anno configurato</span>
              )}
              
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => setShowAddYearForm(!showAddYearForm)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nuovo anno
              </Button>
              
              {showAddYearForm && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="es. 2026"
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    min="2020"
                    max="2030"
                  />
                  <Button size="sm" onClick={handleCreateNewYear}>
                    Imposta
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={fetchTaxRates} 
                variant="ghost" 
                size="sm"
                disabled={loading || selectedYear === null}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSaveTaxRates}
                disabled={loading || taxRates.length === 0 || selectedYear === null}
              >
                <Save className="w-4 h-4 mr-2" />
                Salva modifiche
              </Button>
              
              {availableYears.length > 0 && selectedYear !== null && (
                <Button 
                  variant="danger" 
                  onClick={handleDeleteYear}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina anno
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {selectedYear === null && (
            <div className="mb-5 p-4 border border-blue-200 dark:border-blue-900 rounded-md bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Benvenuto nella gestione delle aliquote contributive.</p>
              <ul className="mt-2 text-sm text-blue-800 dark:text-blue-300 list-disc ml-5 space-y-1">
                <li>Crea un nuovo anno per generare le tre righe predefinite: Dilettante, Professionista, Apprendistato.</li>
                <li>Modifica i valori (%) direttamente nella tabella e premi “Salva modifiche”.</li>
                <li>Puoi eliminare un anno in qualsiasi momento con “Elimina anno”.</li>
              </ul>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          {selectedYear === null ? (
            <EmptyState
              icon={BarChart3}
              title="Nessun anno configurato"
              description="Crea un nuovo anno per iniziare a gestire le aliquote contributive."
            />
          ) : taxRates.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Nessuna aliquota trovata"
              description={`Non ci sono aliquote contributive per l'anno ${selectedYear}. Crea un nuovo anno per iniziare.`}
            />
          ) : (
            <DataTable
              data={taxRates}
              columns={columns}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog di conferma eliminazione */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Elimina anno"
        message={`Sei sicuro di voler eliminare tutte le aliquote contributive per l'anno ${deleteConfirm.year}? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        variant="danger"
      />

      {/* Messaggio di successo */}
      <ConfirmDialog
        isOpen={successMessage.isOpen}
        onClose={() => setSuccessMessage({ isOpen: false, message: '' })}
        onConfirm={() => setSuccessMessage({ isOpen: false, message: '' })}
        title="Operazione completata"
        message={successMessage.message}
        confirmText="OK"
        showCancel={false}
        variant="success"
      />
    </div>
  );
};

export default TaxRatesPage;
