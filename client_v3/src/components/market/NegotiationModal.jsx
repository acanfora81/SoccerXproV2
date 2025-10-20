// client_v3/src/components/market/NegotiationModal.jsx
// Modal per creazione e modifica trattative di mercato

import React, { useState, useEffect } from 'react';
import { X, Save, Handshake, User, Euro, Star, Calendar, FileText, Building, Phone } from 'lucide-react';
import Button from '@/design-system/ds/Button';
import Card, { CardContent } from '@/design-system/ds/Card';
import SalaryCalculatorCSV from './SalaryCalculatorCSV';

const NegotiationModal = ({ open, onClose, onSubmit, initial, isViewMode = false }) => {
  // Funzione per tradurre gli enum del database in nomi italiani
  const translatePositionToItalian = (positionEnum) => {
    const positionMapping = {
      'GOALKEEPER': 'Portiere',
      'DEFENDER': 'Difensore',
      'MIDFIELDER': 'Centrocampista',
      'FORWARD': 'Attaccante'
    };
    return positionMapping[positionEnum] || positionEnum;
  };

  const [formData, setFormData] = useState({
    targetId: '',
    player_first_name: '',
    player_last_name: '',
    player_nationality: '',
    player_position: '',
    player_age: '',
    player_date_of_birth: '',
    player_snapshot: '',
    stage: 'SCOUTING',
    status: 'OPEN',
    priority: 'MEDIUM',
    counterpart: '',
    notes: '',
    requested_fee: '',
    requested_salary_net: '',
    requested_salary_gross: '',
    requested_salary_company: '',
    requested_currency: 'EUR',
    requested_contract_years: '',
    agent_commission_fee: '',
    bonus_signing_fee: '',
    bonus_performance: '',
    budget_effect_transfer: '',
    budget_effect_wage: '',
    budget_effect_commission: '',
    budget_included: false,
    next_action_date: ''
  });

  const [targets, setTargets] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Funzione per calcolare l'età dalla data di nascita
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };


  // Initialize form data
  useEffect(() => {
    if (initial) {
      const t = initial.target || {};
      const snap = initial.player_snapshot || {};
      const rawDob = initial.player_date_of_birth || t.date_of_birth || snap.date_of_birth || '';
      const resolvedDob = rawDob ? (rawDob.includes('T') ? rawDob.split('T')[0] : rawDob) : '';
      const resolvedAge = initial.player_age || (resolvedDob ? calculateAge(resolvedDob) : (snap.age || ''));
      const resolvedPositionCode = initial.player_position || translatePositionFromEnum(t.position || snap.position || '');


      setFormData({
        targetId: initial.targetId || t.id || '',
        player_first_name: initial.player_first_name || t.first_name || '',
        player_last_name: initial.player_last_name || t.last_name || '',
        player_nationality: initial.player_nationality || t.nationality || snap.nationality || '',
        player_position: resolvedPositionCode,
        player_age: resolvedAge,
        player_date_of_birth: resolvedDob,
        player_snapshot: initial.player_snapshot || '',
        stage: initial.stage || 'SCOUTING',
        status: initial.status || 'OPEN',
        priority: initial.priority || 'MEDIUM',
        counterpart: initial.counterpart || '',
        notes: initial.notes || '',
        requested_fee: initial.requested_fee || '',
        requested_salary_net: initial.requested_salary_net || '',
        requested_salary_gross: initial.requested_salary_gross || '',
        requested_salary_company: initial.requested_salary_company || '',
        requested_currency: initial.requested_currency || 'EUR',
        requested_contract_years: initial.requested_contract_years || '',
        agent_commission_fee: initial.agent_commission_fee || '',
        bonus_signing_fee: initial.bonus_signing_fee || '',
        bonus_performance: initial.bonus_performance || '',
        budget_effect_transfer: initial.budget_effect_transfer || '',
        budget_effect_wage: initial.budget_effect_wage || '',
        budget_effect_commission: initial.budget_effect_commission || '',
        budget_included: initial.budget_included || false,
        next_action_date: initial.next_action_date ? initial.next_action_date.split('T')[0] : ''
      });
    } else {
      // Reset form for new negotiation
      setFormData({
        targetId: '',
    player_first_name: '',
    player_last_name: '',
    player_nationality: '',
    player_position: '',
    player_age: '',
        player_date_of_birth: '',
    player_snapshot: '',
        stage: 'SCOUTING',
        status: 'OPEN',
        priority: 'MEDIUM',
        counterpart: '',
        notes: '',
        requested_fee: '',
        requested_salary_net: '',
        requested_salary_gross: '',
        requested_salary_company: '',
        requested_currency: 'EUR',
        requested_contract_years: '',
        agent_commission_fee: '',
        bonus_signing_fee: '',
        bonus_performance: '',
        budget_effect_transfer: '',
        budget_effect_wage: '',
        budget_effect_commission: '',
        budget_included: false,
        next_action_date: ''
      });
    }
    setErrors({});
  }, [initial, open]);

  // Fetch targets for dropdown
  useEffect(() => {
    if (open) {
      fetchTargets();
    }
  }, [open]);

  const fetchTargets = async () => {
    try {
      console.log('🔍 Fetching targets...');
      const json = await fetch('/api/market/targets').then(res => res.json());
      console.log('📊 Targets response:', json);
      
      if (json?.success) {
        console.log('✅ Targets loaded:', json.data?.length || 0, 'targets');
        setTargets(json.data || []);
      } else {
        console.error('❌ Failed to load targets:', json?.error);
        setTargets([]);
      }
    } catch (error) {
      console.error('❌ Error fetching targets:', error);
      setTargets([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Funzione per formattare i numeri in formato italiano
  const formatCurrency = (value) => {
    if (!value || value === '') return '';
    
    // Se il valore è già formattato (contiene €), restituiscilo così com'è
    if (value.toString().includes('€')) {
      return value;
    }
    
    // Rimuovi tutti i caratteri non numerici tranne punti e virgole
    let numericValue = value.toString().replace(/[^\d.,]/g, '');
    
    // Se è vuoto, restituisci vuoto
    if (!numericValue) return '';
    
    // Gestisci il formato di input
    let number;
    if (numericValue.includes(',')) {
      // Se c'è una virgola, è il separatore decimale
      // Rimuovi i punti (separatori migliaia) e converti virgola in punto
      number = parseFloat(numericValue.replace(/\./g, '').replace(',', '.'));
    } else if (numericValue.includes('.')) {
      // Se c'è solo un punto, potrebbe essere decimale o separatore migliaia
      // Se ha più di 2 cifre dopo il punto, è un separatore migliaia
      const parts = numericValue.split('.');
      if (parts.length === 2 && parts[1].length <= 2) {
        // È un decimale
        number = parseFloat(numericValue);
      } else {
        // È un separatore migliaia, rimuovilo
        number = parseFloat(numericValue.replace(/\./g, ''));
      }
    } else {
      // Solo numeri, converti direttamente
      number = parseFloat(numericValue);
    }
    
    // Se non è un numero valido, restituisci il valore originale
    if (isNaN(number)) return value;
    
    // Formatta in formato italiano
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  // Funzione per rimuovere la formattazione e ottenere il numero puro
  const parseCurrency = (formattedValue) => {
    if (!formattedValue) return '';
    
    // Rimuovi € e spazi
    let cleanValue = formattedValue.replace(/€/g, '').replace(/\s/g, '');
    
    // Se c'è una virgola, è il separatore decimale
    if (cleanValue.includes(',')) {
      // Rimuovi i punti (separatori migliaia) e converti virgola in punto
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
      // Se non c'è virgola, rimuovi solo i punti (separatori migliaia)
      cleanValue = cleanValue.replace(/\./g, '');
    }
    
    return cleanValue;
  };

  // Handler specifico per i campi valuta - solo salva il valore raw
  const handleCurrencyChange = (key, value) => {
    console.log('💰 Input received:', { key, value });
    
    // Salva il valore raw senza formattazione
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  // Handler per quando l'utente finisce di digitare (onBlur)
  const handleCurrencyBlur = (key, value) => {
    console.log('💰 Blur received:', { key, value });
    
    if (!value || value === '') return;
    
    // Formatta solo quando l'utente finisce di digitare
    const numericValue = parseCurrency(value);
    const formattedValue = formatCurrency(numericValue);
    
    console.log('💰 Formatting on blur:', { original: value, numeric: numericValue, formatted: formattedValue });
    
    setFormData(prev => ({
      ...prev,
      [key]: numericValue // Salva il valore numerico per i calcoli
    }));
  };

  // Funzione per tradurre gli enum del database in codici frontend
  const translatePositionFromEnum = (positionEnum) => {
    const enumToCodeMapping = {
      'GOALKEEPER': 'GK',
      'DEFENDER': 'CB', // Default per DEFENDER
      'MIDFIELDER': 'CM', // Default per MIDFIELDER
      'FORWARD': 'ST' // Default per FORWARD
    };
    return enumToCodeMapping[positionEnum] || positionEnum;
  };

  const handleTargetChange = (targetId) => {
    const selectedTarget = targets.find(t => t.id === Number(targetId));
    if (selectedTarget) {
      console.log('🎯 Target selezionato:', selectedTarget);
      console.log('📍 Posizione originale:', selectedTarget.position);
      
      // Calcola l'età dalla data di nascita se disponibile
      let calculatedAge = selectedTarget.age;
      if (selectedTarget.date_of_birth) {
        calculatedAge = calculateAge(selectedTarget.date_of_birth);
      }
      
      // Traduce la posizione da enum a codice per il form
      const translatedPosition = selectedTarget.position ? 
        translatePositionFromEnum(selectedTarget.position) : '';
      
      console.log('🔄 Posizione tradotta:', translatedPosition);
      
      setFormData(prev => ({
      ...prev,
        targetId,
        player_first_name: selectedTarget.first_name,
        player_last_name: selectedTarget.last_name,
        player_nationality: selectedTarget.nationality,
        player_position: translatedPosition,
        player_position_italian: translatePositionToItalian(selectedTarget.position),
        player_age: calculatedAge,
        player_date_of_birth: selectedTarget.date_of_birth ? (selectedTarget.date_of_birth.includes('T') ? selectedTarget.date_of_birth.split('T')[0] : selectedTarget.date_of_birth) : '',
        market_value: selectedTarget.market_value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.player_first_name.trim()) newErrors.player_first_name = 'Nome giocatore è obbligatorio';
    if (!formData.player_last_name.trim()) newErrors.player_last_name = 'Cognome giocatore è obbligatorio';

    // Validate numeric fields
    if (formData.player_age && (isNaN(formData.player_age) || formData.player_age < 16 || formData.player_age > 45)) {
      newErrors.player_age = 'Età deve essere tra 16 e 45 anni';
    }
    if (formData.requested_contract_years && (isNaN(formData.requested_contract_years) || formData.requested_contract_years < 1 || formData.requested_contract_years > 5)) {
      newErrors.requested_contract_years = 'Durata contratto deve essere tra 1 e 5 anni';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare data for submission
      const submitData = { ...formData };

      // Sanitize numeric money fields before submit (round to 2 decimals)
      const toNumber = (v) => {
        if (v == null || v === '') return null;
        const s = String(v).replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
        const n = Number(s);
        if (!Number.isFinite(n)) return null;
        return Number(Math.round((n + Number.EPSILON) * 100) / 100);
      };
      submitData.requested_fee = toNumber(submitData.requested_fee);
      submitData.requested_salary_net = toNumber(submitData.requested_salary_net);
      submitData.requested_salary_gross = toNumber(submitData.requested_salary_gross);
      submitData.requested_salary_company = toNumber(submitData.requested_salary_company);
      submitData.agent_commission_fee = toNumber(submitData.agent_commission_fee);
      submitData.bonus_signing_fee = toNumber(submitData.bonus_signing_fee);
      submitData.budget_effect_transfer = toNumber(submitData.budget_effect_transfer);
      submitData.budget_effect_wage = toNumber(submitData.budget_effect_wage);
      submitData.budget_effect_commission = toNumber(submitData.budget_effect_commission);
      
      // Convert empty strings to null for optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      // Convert numeric fields
      if (submitData.player_age) submitData.player_age = Number(submitData.player_age);
      if (submitData.requested_contract_years) submitData.requested_contract_years = Number(submitData.requested_contract_years);
      if (submitData.targetId) submitData.targetId = Number(submitData.targetId);

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Debug: verifica se siamo in modalità view
  console.log('🔍 NegotiationModal debug:', { isViewMode, open });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Handshake className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isViewMode ? 'Visualizza Trattativa' : initial ? 'Modifica Trattativa' : 'Nuova Trattativa'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Target Selection */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Selezione Target
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target di Mercato
                  </label>
                  <select
                    value={formData.targetId}
                    onChange={(e) => handleTargetChange(e.target.value)}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Seleziona un target (opzionale)</option>
                    {targets.map(target => (
                      <option key={target.id} value={target.id}>
                        {target.first_name} {target.last_name} - {translatePositionToItalian(target.position)} ({target.current_club})
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Player Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informazioni Giocatore
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.player_first_name}
                      onChange={(e) => handleInputChange('player_first_name', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.player_first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.player_first_name && <p className="text-red-500 text-xs mt-1">{errors.player_first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      value={formData.player_last_name}
                      onChange={(e) => handleInputChange('player_last_name', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.player_last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.player_last_name && <p className="text-red-500 text-xs mt-1">{errors.player_last_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nazionalità
                    </label>
                    <input
                      type="text"
                      value={formData.player_nationality}
                      onChange={(e) => handleInputChange('player_nationality', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Posizione
                    </label>
                    <select
                      value={formData.player_position}
                      onChange={(e) => handleInputChange('player_position', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleziona posizione</option>
                      <option value="GK">Portiere</option>
                      <option value="CB">Difensore Centrale</option>
                      <option value="LB">Terzino Sinistro</option>
                      <option value="RB">Terzino Destro</option>
                      <option value="CDM">Centrocampista Difensivo</option>
                      <option value="CM">Centrocampista</option>
                      <option value="CAM">Trequartista</option>
                      <option value="LW">Ala Sinistra</option>
                      <option value="RW">Ala Destra</option>
                      <option value="ST">Attaccante</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Età
                    </label>
                    <input
                      type="number"
                      min="16"
                      max="45"
                      value={formData.player_age}
                      onChange={(e) => handleInputChange('player_age', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.player_age ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.player_age && <p className="text-red-500 text-xs mt-1">{errors.player_age}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data di nascita
                    </label>
                    <input
                      type="date"
                      value={formData.player_date_of_birth || ''}
                      onChange={(e) => {
                        const dob = e.target.value;
                        handleInputChange('player_date_of_birth', dob);
                        handleInputChange('player_age', calculateAge(dob));
                      }}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Negotiation Details */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Handshake className="w-5 h-5 mr-2" />
                  Dettagli Trattativa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fase
                    </label>
                    <select
                      value={formData.stage}
                      onChange={(e) => handleInputChange('stage', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                    <option value="SCOUTING">Scouting</option>
                    <option value="CONTACT">Contatto</option>
                    <option value="OFFER_SENT">Offerta Inviata</option>
                    <option value="COUNTEROFFER">Controfferta</option>
                    <option value="AGREEMENT">Accordo</option>
                    <option value="CLOSED">Chiusa</option>
                    <option value="REJECTED">Rifiutata</option>
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stato
                  </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                    <option value="OPEN">Aperta</option>
                    <option value="AGREEMENT">Accordo</option>
                    <option value="CLOSED">Chiusa</option>
                    <option value="REJECTED">Rifiutata</option>
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priorità
                  </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="CRITICAL">Critica</option>
                      <option value="HIGH">Alta</option>
                      <option value="MEDIUM">Media</option>
                    <option value="LOW">Bassa</option>
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Controparte
                  </label>
                  <input
                      type="text"
                      value={formData.counterpart}
                      onChange={(e) => handleInputChange('counterpart', e.target.value)}
                      disabled={isViewMode}
                      placeholder="Club, agente, etc."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prossima Azione
                </label>
                    <input
                      type="date"
                      value={formData.next_action_date}
                      onChange={(e) => handleInputChange('next_action_date', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Euro className="w-5 h-5 mr-2" />
                  Informazioni Economiche
                </h3>
                
                {/* Transfer Fee */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Costo Trasferimento
                  </label>
                  <input
                    type="text"
                    value={formData.requested_fee || ''}
                    onChange={(e) => handleCurrencyChange('requested_fee', e.target.value)}
                    onBlur={(e) => handleCurrencyBlur('requested_fee', e.target.value)}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Es. 1500000"
                  />
                </div>

                {/* Salary Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stipendio Netto
                  </label>
                  <input
                      type="text"
                      value={formData.requested_salary_net || ''}
                      onChange={(e) => {
                        console.log('💰 Netto input changed:', e.target.value);
                        handleCurrencyChange('requested_salary_net', e.target.value);
                      }}
                      onBlur={(e) => handleCurrencyBlur('requested_salary_net', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Es. 500000"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stipendio Lordo
                  </label>
                  <input
                      type="text"
                      value={formData.requested_salary_gross || ''}
                      onChange={(e) => {
                        console.log('💰 Lordo input changed:', e.target.value);
                        handleCurrencyChange('requested_salary_gross', e.target.value);
                      }}
                      onBlur={(e) => handleCurrencyBlur('requested_salary_gross', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Es. 750000"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stipendio Aziendale
                  </label>
                  <input
                    type="text"
                      value={formData.requested_salary_company || ''}
                      onChange={(e) => {
                        console.log('💰 Aziendale input changed:', e.target.value);
                        handleCurrencyChange('requested_salary_company', e.target.value);
                      }}
                      onBlur={(e) => handleCurrencyBlur('requested_salary_company', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Es. 1000000"
                  />
                </div>
              </div>

                {/* Salary Calculator */}
                <SalaryCalculatorCSV
                  netSalary={formData.requested_salary_net}
                  grossSalary={formData.requested_salary_gross}
                  companyCost={formData.requested_salary_company}
                  onNetChange={(value) => handleInputChange('requested_salary_net', value)}
                  onGrossChange={(value) => handleInputChange('requested_salary_gross', value)}
                  onCompanyChange={(value) => handleInputChange('requested_salary_company', value)}
                  disabled={isViewMode}
                  playerData={{
                    position: formData.player_position_italian || formData.player_position,
                    age: formData.player_age,
                    dateOfBirth: formData.player_date_of_birth,
                    nationality: formData.player_nationality
                  }}
                />

                {/* Contract Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Durata Contratto (anni)
                  </label>
                  <input
                    type="number"
                      min="1"
                      max="5"
                      value={formData.requested_contract_years}
                      onChange={(e) => handleInputChange('requested_contract_years', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.requested_contract_years ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.requested_contract_years && <p className="text-red-500 text-xs mt-1">{errors.requested_contract_years}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valuta
                  </label>
                    <select
                      value={formData.requested_currency}
                      onChange={(e) => handleInputChange('requested_currency', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission and Bonuses */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Commissioni e Bonus
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Commissione Agente
                    </label>
                    <input
                      type="number"
                      value={formData.agent_commission_fee}
                      onChange={(e) => handleInputChange('agent_commission_fee', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bonus Firma
                  </label>
                  <input
                    type="number"
                      value={formData.bonus_signing_fee}
                      onChange={(e) => handleInputChange('bonus_signing_fee', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bonus Performance
                    </label>
                    <input
                      type="text"
                      value={formData.bonus_performance}
                      onChange={(e) => handleInputChange('bonus_performance', e.target.value)}
                      disabled={isViewMode}
                      placeholder="Descrizione bonus performance"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Impact */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Impatto Budget
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Impatto Trasferimento
                  </label>
                  <input
                    type="number"
                      value={formData.budget_effect_transfer}
                      onChange={(e) => handleInputChange('budget_effect_transfer', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Impatto Stipendi
                  </label>
                  <input
                    type="number"
                      value={formData.budget_effect_wage}
                      onChange={(e) => handleInputChange('budget_effect_wage', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Impatto Commissioni
                  </label>
                  <input
                    type="number"
                      value={formData.budget_effect_commission}
                      onChange={(e) => handleInputChange('budget_effect_commission', e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="budget_included"
                      checked={formData.budget_included}
                      onChange={(e) => handleInputChange('budget_included', e.target.checked)}
                      disabled={isViewMode}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="budget_included" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Incluso nel budget
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Note
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Note sulla Trattativa
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    disabled={isViewMode}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          {!isViewMode && (
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
              type="button" 
                variant="outline"
              onClick={onClose}
                disabled={loading}
            >
              Annulla
              </Button>
              <Button
              type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
            >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvataggio...' : (initial ? 'Aggiorna' : 'Crea')}</span>
              </Button>
          </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NegotiationModal;