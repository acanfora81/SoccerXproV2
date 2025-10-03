// client/src/components/contracts/NewContractModal.jsx
// Modale per creazione nuovo contratto - SoccerXpro V2

import { useState, useEffect, useCallback } from 'react';
import { X, Save, FileText, User, Calendar, Euro, Building2, CheckCircle, Calculator, Percent, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../utils/http';
import useAuthStore from '../../store/authStore';
import ConfirmDialog from '../common/ConfirmDialog';
import { useUnifiedFiscalCalculation } from '../../hooks/useUnifiedFiscalCalculation';
import { parseItalianNumber, parseItalianNumberToFloat, formatItalianNumber, formatItalianCurrency } from '../../utils/italianNumbers';
import BonusField from './BonusField';
import BonusCalculationDisplay from './BonusCalculationDisplay';
import SalaryCalculationDisplay from './SalaryCalculationDisplay';
import '../../styles/contract-modal.css';

const NewContractModal = ({ isOpen, onClose, onSuccess, editingContract = null }) => {
  const { user, isAuthenticated } = useAuthStore();

  // Funzione per formattare i numeri in formato italiano con separatori delle migliaia
  const formatNumber = (value) => {
    if (!value || value === '') return '';
    
    // Se è già una stringa formattata, la restituisco
    if (typeof value === 'string' && value.includes(',')) {
      return value;
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    // Formatta con separatori delle migliaia e virgola decimale
    return num.toLocaleString('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Funzione per convertire da formato italiano a numero
  
  const [formData, setFormData] = useState({
    // Campi obbligatori
    startDate: '',
    endDate: '',
    salary: '',
    currency: 'EUR',
    contractType: '',
    playerId: '',
    status: 'DRAFT',
    
    // Campi opzionali esistenti
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
    
    // Nuovi campi estesi
    netSalary: '',
    contractNumber: '',
    fifaId: '',
    leagueRegistrationId: '',
    imageRights: '',
    loyaltyBonus: '',
    signingBonus: '',
    accommodationBonus: '',
    carAllowance: '',
    transferAllowance: '',
    taxRegime: '',
    taxRate: '',
    socialContributions: '',
    
    // Aliquote bonus personalizzate (sovrascrivono quelle caricate)
    customImageRightsTax: '',
    customLoyaltyBonusTax: '',
    customSigningBonusTax: '',
    customAccommodationBonusTax: '',
    customCarAllowanceTax: '',
    customTransferAllowanceTax: '',
    insuranceValue: '',
    insuranceProvider: '',
    medicalInsurance: false,
    autoRenewal: false,
    renewalConditions: '',
    renewalNoticeMonths: '',
    jurisdiction: '',
    arbitrationClause: false,
    confidentialityClause: false,
    nonCompeteClause: false,
    nonCompeteMonths: '',
    isMinor: false,
    parentalConsent: false,
    tutorName: '',
    tutorContact: '',
    educationClause: false,
    languageRequirement: '',
    trainingObligation: false,
    performanceTargets: '',
    kpiTargets: '',
    workPermitRequired: false,
    workPermitStatus: '',
    workPermitExpiry: '',
    visaRequired: false,
    visaType: '',
    relocationPackage: '',
    familySupport: false,
    languageLessons: false,
    mediaObligations: '',
    socialMediaClause: '',
    sponsorshipRights: false,
    medicalExamDate: '',
    medicalExamResult: '',
    medicalRestrictions: '',
    dopingConsent: false,
    lastReviewDate: '',
    nextReviewDate: '',
    complianceStatus: 'PENDING',
    complianceNotes: '',
    priority: 'NORMAL',
    tags: [],
    internalNotes: '',
    
    // Flag per rinnovo ufficiale
    isOfficialRenewal: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [players, setPlayers] = useState([]);
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });
  
  // Stato per calcoli fiscali unificati
  const [calculationMode, setCalculationMode] = useState('net'); // 'net' o 'gross'
  
  // Stato per modalità di calcolo individuale per ogni bonus
  const [bonusModes, setBonusModes] = useState({
    imageRights: 'gross',
    loyaltyBonus: 'gross', 
    signingBonus: 'gross',
    accommodationBonus: 'gross',
    carAllowance: 'gross',
    transferAllowance: 'gross'
  });
  
  const [unifiedCalculations, setUnifiedCalculations] = useState(null);

  // Hook unificato per tutti i calcoli fiscali
  const hookParams = {
    teamId: user?.teamId,
    contractYear: formData.startDate ? new Date(formData.startDate).getFullYear() : null,
    contractType: formData.contractType
  };
  
  const {
    taxRates,
    bonusTaxRates,
    loading: taxLoading,
    calculating: taxCalculating,
    error: taxError,
    calculateUnified,
    calculateSalaryFromNet
  } = useUnifiedFiscalCalculation(
    hookParams.teamId,
    hookParams.contractYear,
    hookParams.contractType
  );

  // Debug dello stato delle aliquote bonus (ridotto per performance)
  // console.log('🔵 Stato aliquote nel componente:', { bonusTaxRates, taxLoading });

  // Funzione per eseguire i calcoli fiscali - MEMOIZZATA
  // Funzione unificata per eseguire tutti i calcoli fiscali
  const performUnifiedCalculation = useCallback(() => {
    // console.log('🔵 performUnifiedCalculation chiamata'); // Ridotto per performance
    
    // Procedi anche se abbiamo solo le aliquote stipendio
    if (!taxRates) {
      console.log('🔴 Nessuna aliquota stipendio disponibile');
      console.log('🔴 Parametri hook:', { teamId: user?.teamId, contractYear: formData.startDate ? new Date(formData.startDate).getFullYear() : null, contractType: formData.contractType });
      setUnifiedCalculations(null);
      return;
    }

    // Prepara i dati per il calcolo unificato (incluse aliquote personalizzate)
    const calculationData = {
      salary: parseItalianNumberToFloat(formData.salary),
      netSalary: parseItalianNumberToFloat(formData.netSalary),
      calculationMode,
      bonusModes, // Modalità individuali per ogni bonus
      imageRights: parseItalianNumberToFloat(formData.imageRights),
      loyaltyBonus: parseItalianNumberToFloat(formData.loyaltyBonus),
      signingBonus: parseItalianNumberToFloat(formData.signingBonus),
      accommodationBonus: parseItalianNumberToFloat(formData.accommodationBonus),
      carAllowance: parseItalianNumberToFloat(formData.carAllowance),
      transferAllowance: parseItalianNumberToFloat(formData.transferAllowance),
      // Aliquote personalizzate (convertite in numero)
      customImageRightsTax: formData.customImageRightsTax ? parseItalianNumberToFloat(formData.customImageRightsTax) : undefined,
      customLoyaltyBonusTax: formData.customLoyaltyBonusTax ? parseItalianNumberToFloat(formData.customLoyaltyBonusTax) : undefined,
      customSigningBonusTax: formData.customSigningBonusTax ? parseItalianNumberToFloat(formData.customSigningBonusTax) : undefined,
      customAccommodationBonusTax: formData.customAccommodationBonusTax ? parseItalianNumberToFloat(formData.customAccommodationBonusTax) : undefined,
      customCarAllowanceTax: formData.customCarAllowanceTax ? parseItalianNumberToFloat(formData.customCarAllowanceTax) : undefined,
      customTransferAllowanceTax: formData.customTransferAllowanceTax ? parseItalianNumberToFloat(formData.customTransferAllowanceTax) : undefined
    };

    // Esegue il calcolo appropriato in base alla modalità
    if (calculationMode === 'net' && parseItalianNumberToFloat(formData.netSalary) > 0) {
      // Modalità netto → usa il backend per il calcolo del lordo
      console.log('🔵 Chiamando calculateSalaryFromNet con:', parseItalianNumberToFloat(formData.netSalary));
      calculateSalaryFromNet(parseItalianNumberToFloat(formData.netSalary))
        .then(backendResult => {
          console.log('🟢 Risultato dal backend:', backendResult);
          
          // FIX: Calcola solo i bonus senza rifare il calcolo stipendio
          // Usa calculateUnified ma con salary = 0 per evitare il calcolo stipendio
          const bonusOnlyData = {
            ...calculationData,
            salary: 0, // Imposta a 0 per evitare calcolo stipendio
            netSalary: 0, // Imposta a 0 per evitare calcolo stipendio
            calculationMode: 'gross' // Modalità gross ma con salary = 0
          };
          
          return calculateUnified(bonusOnlyData).then(bonusCalculations => {
            // Combina il risultato del backend per lo stipendio con i bonus calcolati
            const combinedResult = {
              salary: backendResult, // Usa direttamente il risultato del backend
              bonuses: bonusCalculations.bonuses,
              total: {
                gross: (backendResult?.grossSalary || 0) + (bonusCalculations.bonuses?.totalGross || 0),
                net: (backendResult?.netSalary || 0) + (bonusCalculations.bonuses?.totalNet || 0),
                taxes: (backendResult?.totaleContributiWorker || 0) + (bonusCalculations.bonuses?.totalTax || 0),
                employerContributions: backendResult?.totaleContributiEmployer || 0,
                companyCost: (backendResult?.companyCost || 0) + (bonusCalculations.bonuses?.totalGross || 0)
              }
            };
            
            console.log('🟢 Risultato combinato finale:', combinedResult);
            setUnifiedCalculations(combinedResult);
          });
        })
        .catch(error => {
          console.error('❌ Errore calcolo backend:', error);
          setUnifiedCalculations(null);
        });
    } else {
      // Modalità lordo o altri casi → usa il calcolo locale
      console.log('🔵 Chiamando calculateUnified con dati locali');
      calculateUnified(calculationData).then(calculations => {
        setUnifiedCalculations(calculations);
      }).catch(error => {
        console.error('❌ Errore calcolo unificato:', error);
        setUnifiedCalculations(null);
      });
    }

    // NON aggiornare automaticamente i campi qui per evitare loop infiniti
    // L'aggiornamento automatico avviene solo quando si cambia modalità di calcolo
  }, [taxRates, bonusTaxRates, calculationMode, formData, bonusModes, calculateUnified, calculateSalaryFromNet]);

  // Funzione per gestire l'input dei numeri (solo pulizia, no formattazione) - MEMOIZZATA
  const handleNumberInput = useCallback((e, fieldName) => {
    const { value } = e.target;
    
    // Rimuovi tutti i caratteri non numerici tranne virgola
    let cleanValue = value.replace(/[^\d,]/g, '');
    
    // Gestisci la virgola decimale (solo una)
    const commaIndex = cleanValue.indexOf(',');
    let beforeComma = '';
    let afterComma = '';
    
    if (commaIndex !== -1) {
      // Mantieni solo la prima virgola e massimo 2 cifre dopo
      beforeComma = cleanValue.substring(0, commaIndex);
      afterComma = cleanValue.substring(commaIndex + 1).replace(/,/g, '');
      afterComma = afterComma.substring(0, 2); // Massimo 2 cifre decimali
    } else {
      beforeComma = cleanValue;
      afterComma = '';
    }
    
    // NON formattare durante la digitazione, solo pulire
    let finalValue = '';
    if (beforeComma.length > 0) {
      finalValue = beforeComma;
      if (afterComma.length > 0) {
        finalValue += ',' + afterComma;
      }
    }
    
    // Aggiorna il formData con il valore pulito (senza formattazione)
    setFormData(prev => ({
      ...prev,
      [fieldName]: finalValue
    }));
    
    // NON triggerare calcoli durante la digitazione - solo al blur
    // I calcoli verranno eseguiti solo quando l'utente esce dal campo (onBlur)
  }, [performUnifiedCalculation]);

  // Funzione per formattare quando l'utente esce dal campo (onBlur) - MEMOIZZATA
  const handleNumberBlur = useCallback((e, fieldName) => {
    const { value } = e.target;
    
    console.log('🔵 handleNumberBlur:', { value, fieldName });
    
    if (!value || value === '') return;
    
    // Converti in numero per formattare
    const numericValue = parseItalianNumberToFloat(value);
    
    console.log('🔵 handleNumberBlur: Original value:', value, 'Numeric value:', numericValue);
    
    if (!isNaN(numericValue)) {
      // Formatta con separatori delle migliaia
      const formattedValue = formatItalianNumber(numericValue);
      
      // console.log('🔵 formattedValue on blur:', formattedValue); // Ridotto per performance
      
      // Aggiorna il formData con il valore formattato
      setFormData(prev => ({
        ...prev,
        [fieldName]: formattedValue
      }));
      
      // Calcolo IMMEDIATO quando l'utente esce dal campo
      performUnifiedCalculation();
    }
  }, [performUnifiedCalculation]);

  // Gestione input - MEMOIZZATA per evitare perdita focus
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    // Per i campi numerici, usa la gestione speciale
    if (name === 'netSalary' || name === 'salary' || name === 'imageRights' || 
        name === 'loyaltyBonus' || name === 'signingBonus' || name === 'accommodationBonus' || 
        name === 'carAllowance' || name === 'transferAllowance' || name === 'taxRate' ||
        name === 'customImageRightsTax' || name === 'customLoyaltyBonusTax' || 
        name === 'customSigningBonusTax' || name === 'customAccommodationBonusTax' || 
        name === 'customCarAllowanceTax' || name === 'customTransferAllowanceTax') {
      handleNumberInput(e, name);
      return;
    }
    
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

    // Calcolo automatico SOLO per contractType e startDate (campi critici)
    if (name === 'contractType' || name === 'startDate') {
      // Calcolo immediato per questi campi critici
      performUnifiedCalculation();
    }

    // I calcoli per i campi numerici sono gestiti solo da handleNumberBlur
  }, [validationErrors, performUnifiedCalculation, handleNumberInput]);

  // NON ricalcolare automaticamente quando cambiano le modalità bonus
  // I calcoli verranno eseguiti solo quando l'utente esce dai campi o cambia contractType/date

  // Funzione helper per ottenere il calcolo di un singolo bonus
  const getBonusCalculation = (bonusField) => {
    if (!unifiedCalculations?.bonuses?.details) return null;
    return unifiedCalculations?.bonuses?.details?.[bonusField] || null;
  };



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
        salary: editingContract.salary ? formatItalianNumber(editingContract.salary) : '',
        currency: editingContract.currency || 'EUR',
        contractType: editingContract.contractType || '',
        playerId: editingContract.playerId ? editingContract.playerId.toString() : '',
        status: editingContract.status || 'DRAFT',
        signedDate: editingContract.signedDate ? new Date(editingContract.signedDate).toISOString().split('T')[0] : '',
        notes: editingContract.notes || '',
        agentContact: editingContract.agentContact || '',
        buyOption: editingContract.buyOption === true,
        buyPrice: editingContract.buyPrice ? formatItalianNumber(editingContract.buyPrice) : '',
        contractRole: editingContract.contractRole || '',
        depositDate: editingContract.depositDate ? new Date(editingContract.depositDate).toISOString().split('T')[0] : '',
        loanFromClub: editingContract.loanFromClub || '',
        loanToClub: editingContract.loanToClub || '',
        obligationToBuy: editingContract.obligationToBuy === true,
        paymentFrequency: editingContract.paymentFrequency || '',
        protocolNumber: editingContract.protocolNumber || '',
        responsibleUserId: editingContract.responsibleUserId ? editingContract.responsibleUserId.toString() : '',
        isOfficialRenewal: false, // Sempre false per le modifiche esistenti
        // Bonus fields
        netSalary: editingContract.netSalary ? formatItalianNumber(editingContract.netSalary) : '',
        imageRights: editingContract.imageRights ? formatItalianNumber(editingContract.imageRights) : '',
        loyaltyBonus: editingContract.loyaltyBonus ? formatItalianNumber(editingContract.loyaltyBonus) : '',
        signingBonus: editingContract.signingBonus ? formatItalianNumber(editingContract.signingBonus) : '',
        accommodationBonus: editingContract.accommodationBonus ? formatItalianNumber(editingContract.accommodationBonus) : '',
        carAllowance: editingContract.carAllowance ? formatItalianNumber(editingContract.carAllowance) : ''
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
        isOfficialRenewal: false,
        // Bonus fields
        netSalary: '',
        imageRights: '',
        loyaltyBonus: '',
        signingBonus: '',
        accommodationBonus: '',
        carAllowance: ''
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




  // Toggle tra modalità calcolo netto/lordo
  const toggleCalculationMode = () => {
    const newMode = calculationMode === 'net' ? 'gross' : 'net';
    setCalculationMode(newMode);

    // Se abbiamo calcoli esistenti, aggiorna il campo appropriato
    if (unifiedCalculations?.salary) {
      if (newMode === 'net') {
        // Passando da lordo a netto, aggiorna il campo netSalary
        setFormData(prev => ({
          ...prev,
          netSalary: formatNumber(unifiedCalculations?.salary?.netSalary || 0)
        }));
      } else {
        // Passando da netto a lordo, aggiorna il campo salary
        setFormData(prev => ({
          ...prev,
          salary: formatNumber(unifiedCalculations?.salary?.grossSalary || 0)
        }));
      }
    }
  };

  // Toggle modalità calcolo per un singolo bonus - MEMOIZZATA
  const toggleBonusMode = useCallback((bonusField) => {
    const currentMode = bonusModes[bonusField];
    const newMode = currentMode === 'gross' ? 'net' : 'gross';
    
    setBonusModes(prev => ({
      ...prev,
      [bonusField]: newMode
    }));

    // Aggiorna automaticamente il campo del bonus se abbiamo calcoli esistenti
    if (unifiedCalculations?.bonuses?.details?.[bonusField]) {
      const calc = unifiedCalculations?.bonuses?.details?.[bonusField];
      
      // Se stiamo passando da lordo a netto, mostra il netto calcolato
      // Se stiamo passando da netto a lordo, mostra il lordo calcolato
      let newValue;
      if (newMode === 'net') {
        newValue = calc.netAmount;
      } else {
        newValue = calc.grossAmount;
      }
      
      setFormData(prev => ({
        ...prev,
        [bonusField]: formatNumber(newValue)
      }));
    }
  }, [bonusModes, unifiedCalculations]);

  // Componente BonusField ora è importato da file separato per evitare ricreazione

  // Componente BonusCalculationDisplay ora è importato da file separato per evitare ricreazione

  // Ricalcola quando cambiano le aliquote fiscali - SOLO se abbiamo dati
  useEffect(() => {
    if (taxRates && bonusTaxRates && (formData.salary || formData.imageRights || formData.loyaltyBonus || formData.signingBonus || formData.accommodationBonus || formData.carAllowance || formData.transferAllowance)) {
      performUnifiedCalculation();
    }
  }, [calculationMode, taxRates, bonusTaxRates, performUnifiedCalculation]);

  // Validazione form
  const validateForm = () => {
    const errors = {};

    // Validazione campi obbligatori
    if (!formData.startDate) errors.startDate = 'Data inizio è obbligatoria';
    if (!formData.endDate) errors.endDate = 'Data fine è obbligatoria';
    
    // Validazione stipendio (considera entrambe le modalità)
    const salaryValue = calculationMode === 'net' ? formData.netSalary : formData.salary;
    const salaryNumeric = parseItalianNumberToFloat(salaryValue);
    if (!salaryValue || salaryNumeric <= 0) {
      errors.salary = calculationMode === 'net' ? 'Stipendio netto deve essere maggiore di 0' : 'Stipendio lordo deve essere maggiore di 0';
    }
    
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

    // Verifica che i calcoli fiscali siano stati eseguiti se necessario
    if (calculationMode === 'net' && (!unifiedCalculations?.salary?.grossSalary || unifiedCalculations.salary.grossSalary <= 0)) {
      setError('Impossibile calcolare il lordo dal netto inserito. Verifica che le aliquote fiscali siano caricate.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepara dati per l'invio
      const contractData = {
        ...formData,
        // Usa il valore corretto in base alla modalità di calcolo
        // FIX: Assicurati che il valore sia sempre un numero valido e non troppo grande
        salary: (() => {
          if (calculationMode === 'net') {
            // Se l'utente ha inserito il netto, usa il lordo calcolato
            const grossSalary = unifiedCalculations?.salary?.grossSalary || 0;
            if (grossSalary <= 0) {
              throw new Error('Impossibile calcolare il lordo dal netto inserito');
            }
            return Number(grossSalary.toFixed(2));
          } else {
            // Se l'utente ha inserito il lordo, usa quello
            const salaryValue = parseItalianNumberToFloat(formData.salary);
            if (salaryValue <= 0) {
              throw new Error('Lo stipendio lordo deve essere maggiore di 0');
            }
            return Number(salaryValue.toFixed(2));
          }
        })(),
        netSalary: (() => {
          let netValue;
          if (calculationMode === 'net') {
            netValue = parseItalianNumberToFloat(formData.netSalary);
          } else {
            netValue = unifiedCalculations?.salary?.netSalary || 0;
          }
          return Number(netValue.toFixed(2)); // Forza massimo 2 decimali
        })(),
        buyPrice: formData.buyPrice ? parseItalianNumberToFloat(formData.buyPrice) : null,
        responsibleUserId: formData.responsibleUserId || null,
        // Bonus - invia sempre, anche se 0
        imageRights: formData.imageRights ? parseItalianNumberToFloat(formData.imageRights) : 0,
        loyaltyBonus: formData.loyaltyBonus ? parseItalianNumberToFloat(formData.loyaltyBonus) : 0,
        signingBonus: formData.signingBonus ? parseItalianNumberToFloat(formData.signingBonus) : 0,
        accommodationBonus: formData.accommodationBonus ? parseItalianNumberToFloat(formData.accommodationBonus) : 0,
        carAllowance: formData.carAllowance ? parseItalianNumberToFloat(formData.carAllowance) : 0
      };

      console.log('📤 Invio dati contratto:', contractData);
      console.log('🔍 Debug valori numerici:', {
        originalSalary: formData.salary,
        originalNetSalary: formData.netSalary,
        calculationMode,
        unifiedGrossSalary: unifiedCalculations?.salary?.grossSalary,
        unifiedNetSalary: unifiedCalculations?.salary?.netSalary,
        finalSalary: contractData.salary,
        finalNetSalary: contractData.netSalary
      });
      console.log('🔐 Stato autenticazione:', { isAuthenticated, user: user?.email, role: user?.role });
      console.log('🔍 Debug campi obbligatori:', {
        playerId: contractData.playerId,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        salary: contractData.salary,
        contractType: contractData.contractType
      });

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

          {/* Dati Economici Unificati */}
          <div className="form-section">
            <div className="form-section-header">
              <Euro size={20} />
              <h3 className="form-section-title">Dati Economici</h3>
            </div>
            
            {/* Stipendio Base con Toggle */}
            <div className="salary-input-section">
              <div className="salary-toggle">
                <label className="salary-toggle-label">Tipo Stipendio:</label>
                <div className="salary-toggle-buttons">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCalculationMode('net');
                    }}
                    className={`salary-mode-btn ${calculationMode === 'net' ? 'active' : ''}`}
                    disabled={loading}
                  >
                    Stipendio Netto
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCalculationMode('gross');
                    }}
                    className={`salary-mode-btn ${calculationMode === 'gross' ? 'active' : ''}`}
                    disabled={loading}
                  >
                    Stipendio Lordo
                  </button>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={calculationMode === 'net' ? 'netSalary' : 'salary'} className="form-label">
                    {calculationMode === 'net' ? 'Stipendio Netto' : 'Stipendio Lordo'} *
                  </label>
                              <input
                                type="text"
                                id={calculationMode === 'net' ? 'netSalary' : 'salary'}
                                name={calculationMode === 'net' ? 'netSalary' : 'salary'}
                                value={calculationMode === 'net' ? formData.netSalary : formData.salary}
                                onChange={handleChange}
                                onBlur={(e) => handleNumberBlur(e, calculationMode === 'net' ? 'netSalary' : 'salary')}
                                required
                                disabled={loading}
                                placeholder="0,00"
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
            </div>

            {/* Calcoli Fiscali Automatici */}
            <div className="tax-calculations-integrated">
              {taxError && (
                <div className="alert alert-warning">
                  <AlertTriangle size={16} />
                  {taxError}
                </div>
              )}

              {!taxRates && !taxLoading && (formData.netSalary || formData.salary) && (
                <div className="tax-info">
                  <div className="info-card">
                    <Percent size={16} />
                    <span>Nessuna aliquota fiscale trovata per {formData.startDate ? new Date(formData.startDate).getFullYear() : 'questo anno'} e tipo contratto "{formData.contractType}". Carica le aliquote dalla sezione "Carica Aliquote".</span>
                  </div>
                </div>
              )}

              {/* Nuovo componente di visualizzazione */}
              {taxRates && (
                <SalaryCalculationDisplay 
                  calculation={unifiedCalculations?.salary}
                  calculationMode={calculationMode}
                  inputAmount={calculationMode === 'net' ? 
                    formatItalianNumber(parseItalianNumberToFloat(formData.netSalary)) : 
                    formatItalianNumber(parseItalianNumberToFloat(formData.salary))
                  }
                  totalCalculation={unifiedCalculations}
                  calculating={taxCalculating}
                />
              )}

              {taxRates && !unifiedCalculations?.salary && (formData.netSalary || formData.salary) && (
                <div className="tax-info">
                  <div className="info-card">
                    <Percent size={16} />
                    <span>Inserisci un valore per {calculationMode === 'net' ? 'lo stipendio netto' : 'lo stipendio lordo'} per vedere i calcoli automatici</span>
                  </div>
                </div>
              )}
            </div>

            {/* Frequenza e Ruolo */}
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

            {/* Bonus e Indennità */}
            <div className="bonus-section">
              <h4 className="bonus-title">Bonus e Indennità</h4>
              
              {/* Calcoli Tassazione Bonus */}
              {taxError && (
                <div className="alert alert-warning">
                  <AlertTriangle size={16} />
                  <div>
                    <span>{taxError}</span>
                    <button 
                      onClick={() => window.location.href = '/dashboard/bonustaxrates/upload'}
                      className="btn btn-sm btn-outline ml-2"
                    >
                      Carica Aliquote
                    </button>
                  </div>
                </div>
              )}

              {!bonusTaxRates && !taxLoading && (parseItalianNumberToFloat(formData.imageRights) > 0 || parseItalianNumberToFloat(formData.loyaltyBonus) > 0 || parseItalianNumberToFloat(formData.signingBonus) > 0 || parseItalianNumberToFloat(formData.accommodationBonus) > 0 || parseItalianNumberToFloat(formData.carAllowance) > 0 || parseItalianNumberToFloat(formData.transferAllowance) > 0) && (
                <div className="tax-info">
                  <div className="info-card warning">
                    <AlertTriangle size={16} />
                    <div>
                      <strong>Aliquote bonus non disponibili</strong>
                      <p>Nessuna aliquota bonus trovata per {formData.startDate ? new Date(formData.startDate).getFullYear() : 'questo anno'}.</p>
                      <p>Carica le aliquote bonus dalla sezione <strong>"Carica Aliquote Bonus"</strong> per vedere i calcoli automatici.</p>
                      <button 
                        onClick={() => window.location.href = '/dashboard/bonustaxrates/upload'}
                        className="btn btn-sm btn-primary mt-2"
                      >
                        Carica Aliquote Bonus
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {taxLoading && (
                <div className="tax-info">
                  <div className="info-card">
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Caricamento aliquote bonus...</span>
                  </div>
                </div>
              )}


              {/* Sezione Importi Bonus */}
              <h5 className="form-section-subtitle">Importi Bonus e Indennità</h5>
              
              {/* Info calcolo bonus individuali */}
              <div className="bonus-info">
                <p className="info-text">
                  <strong>Calcolo Individuale:</strong> Ogni bonus può essere impostato come Lordo o Netto indipendentemente. 
                  Usa i pulsanti L/N accanto a ogni campo per scegliere la modalità.
                </p>
                </div>
              <BonusField 
                bonusField="imageRights" 
                label="Diritti Immagine" 
                taxPlaceholder="es. 23,00"
                bonusMode={bonusModes.imageRights}
                fieldValue={formData.imageRights || ''}
                customTaxValue={formData.customImageRightsTax || ''}
                loading={loading}
                onToggleMode={toggleBonusMode}
                onChange={handleChange}
                onBlur={handleNumberBlur}
              />
              <BonusCalculationDisplay 
                bonusField="imageRights" 
                label="Diritti Immagine"
                fieldValue={formData.imageRights || ''}
                calc={getBonusCalculation('imageRights')}
                bonusMode={bonusModes.imageRights}
              />
              
              <BonusField 
                bonusField="loyaltyBonus" 
                label="Bonus Fedeltà" 
                taxPlaceholder="es. 38,00"
                bonusMode={bonusModes.loyaltyBonus}
                fieldValue={formData.loyaltyBonus || ''}
                customTaxValue={formData.customLoyaltyBonusTax || ''}
                loading={loading}
                onToggleMode={toggleBonusMode}
                onChange={handleChange}
                onBlur={handleNumberBlur}
              />
              <BonusCalculationDisplay 
                bonusField="loyaltyBonus" 
                label="Bonus Fedeltà"
                fieldValue={formData.loyaltyBonus || ''}
                calc={getBonusCalculation('loyaltyBonus')}
                bonusMode={bonusModes.loyaltyBonus}
              />
              
              <BonusField 
                bonusField="signingBonus" 
                label="Bonus Firma" 
                taxPlaceholder="es. 38,00"
                bonusMode={bonusModes.signingBonus}
                fieldValue={formData.signingBonus || ''}
                customTaxValue={formData.customSigningBonusTax || ''}
                loading={loading}
                onToggleMode={toggleBonusMode}
                onChange={handleChange}
                onBlur={handleNumberBlur}
              />
              <BonusCalculationDisplay 
                bonusField="signingBonus" 
                label="Bonus Firma"
                fieldValue={formData.signingBonus || ''}
                calc={getBonusCalculation('signingBonus')}
                bonusMode={bonusModes.signingBonus}
              />
              
              <BonusField 
                bonusField="accommodationBonus" 
                label="Bonus Alloggio" 
                taxPlaceholder="es. 38,00"
                bonusMode={bonusModes.accommodationBonus}
                fieldValue={formData.accommodationBonus || ''}
                customTaxValue={formData.customAccommodationBonusTax || ''}
                loading={loading}
                onToggleMode={toggleBonusMode}
                onChange={handleChange}
                onBlur={handleNumberBlur}
              />
              <BonusCalculationDisplay 
                bonusField="accommodationBonus" 
                label="Bonus Alloggio"
                fieldValue={formData.accommodationBonus || ''}
                calc={getBonusCalculation('accommodationBonus')}
                bonusMode={bonusModes.accommodationBonus}
              />
              
              <BonusField 
                bonusField="carAllowance" 
                label="Indennità Auto" 
                taxPlaceholder="es. 38,00"
                bonusMode={bonusModes.carAllowance}
                fieldValue={formData.carAllowance || ''}
                customTaxValue={formData.customCarAllowanceTax || ''}
                loading={loading}
                onToggleMode={toggleBonusMode}
                onChange={handleChange}
                onBlur={handleNumberBlur}
              />
              <BonusCalculationDisplay 
                bonusField="carAllowance" 
                label="Indennità Auto"
                fieldValue={formData.carAllowance || ''}
                calc={getBonusCalculation('carAllowance')}
                bonusMode={bonusModes.carAllowance}
              />
              
              <BonusField 
                bonusField="transferAllowance" 
                label="Indennità di Trasferta" 
                taxPlaceholder="es. 38,00"
                bonusMode={bonusModes.transferAllowance}
                fieldValue={formData.transferAllowance || ''}
                customTaxValue={formData.customTransferAllowanceTax || ''}
                loading={loading}
                onToggleMode={toggleBonusMode}
                onChange={handleChange}
                onBlur={handleNumberBlur}
              />
              <BonusCalculationDisplay 
                bonusField="transferAllowance" 
                label="Indennità di Trasferta"
                fieldValue={formData.transferAllowance || ''}
                calc={getBonusCalculation('transferAllowance')}
                bonusMode={bonusModes.transferAllowance}
              />
            </div>
          </div>

          {/* Clausole e opzioni */}
          <div className="form-section">
            <h3 className="form-section-title">Clausole e Opzioni</h3>
            <div className="form-row">
              <div className="form-group checkbox-group">
                <label htmlFor="buyOption" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="buyOption"
                    name="buyOption"
                    checked={formData.buyOption}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>Opzione di riscatto</span>
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label htmlFor="obligationToBuy" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="obligationToBuy"
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

          {/* Identificativi e Registrazioni */}
          <div className="form-section">
            <h3 className="form-section-title">Identificativi e Registrazioni</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contractNumber" className="form-label">Numero Contratto</label>
                <input
                  type="text"
                  id="contractNumber"
                  name="contractNumber"
                  value={formData.contractNumber}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Es. CON-2024-001"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fifaId" className="form-label">ID FIFA</label>
                <input
                  type="text"
                  id="fifaId"
                  name="fifaId"
                  value={formData.fifaId}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="ID FIFA del giocatore"
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="leagueRegistrationId" className="form-label">ID Registrazione Lega</label>
                <input
                  type="text"
                  id="leagueRegistrationId"
                  name="leagueRegistrationId"
                  value={formData.leagueRegistrationId}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="ID registrazione lega"
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

          {/* Parametri Fiscali e Assicurazioni */}
          <div className="form-section">
            <h3 className="form-section-title">Parametri Fiscali e Assicurazioni</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="taxRegime" className="form-label">Regime Fiscale</label>
                <select
                  id="taxRegime"
                  name="taxRegime"
                  value={formData.taxRegime}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-select"
                >
                  <option value="">Seleziona regime</option>
                  <option value="STANDARD">Standard</option>
                  <option value="BECKHAM_LAW">Beckham Law</option>
                  <option value="IMPATRIATE">Impatriate</option>
                  <option value="NON_RESIDENT">Non Resident</option>
                  <option value="SPECIAL_REGIME">Regime Speciale</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="taxRate" className="form-label">Aliquota Fiscale (%)</label>
                            <input
                              type="text"
                              id="taxRate"
                              name="taxRate"
                              value={formData.taxRate}
                              onChange={handleChange}
                              onBlur={(e) => handleNumberBlur(e, 'taxRate')}
                              disabled={loading}
                              placeholder="0,00"
                              className="form-input"
                            />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="socialContributions" className="form-label">Contributi Sociali</label>
                <input
                  type="number"
                  step="0.01"
                  id="socialContributions"
                  name="socialContributions"
                  value={formData.socialContributions}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0.00"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="insuranceValue" className="form-label">Valore Assicurazione</label>
                <input
                  type="number"
                  step="0.01"
                  id="insuranceValue"
                  name="insuranceValue"
                  value={formData.insuranceValue}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0.00"
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="insuranceProvider" className="form-label">Fornitore Assicurazione</label>
                <input
                  type="text"
                  id="insuranceProvider"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Nome compagnia assicurativa"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="medicalInsurance" className="form-label">
                  <input
                    type="checkbox"
                    id="medicalInsurance"
                    name="medicalInsurance"
                    checked={formData.medicalInsurance}
                    onChange={handleChange}
                    disabled={loading}
                    className="form-checkbox"
                  />
                  Assicurazione Medica
                </label>
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
              <h3 className="form-section-title">Rinnovo Ufficiale</h3>
              <div className="form-group">
                <label htmlFor="isOfficialRenewal" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="isOfficialRenewal"
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

          {/* Riepilogo Totale */}
          {unifiedCalculations && (
            <div className="form-section">
              <h4 className="form-section-title">📊 Riepilogo Totale Contratto</h4>
              <div className="total-summary">
                <div className="summary-grid">
                  {/* Stipendio Base */}
                  {unifiedCalculations.salary && (
                    <div className="summary-item">
                      <div className="summary-label">Stipendio Base:</div>
                      <div className="summary-value">
                        {calculationMode === 'gross' ? (
                          <>
                            <span className="gross">€{formatItalianNumber(parseItalianNumberToFloat(formData.salary))}</span>
                            <span className="arrow">→</span>
                            <span className="net">€{(unifiedCalculations?.salary?.netSalary || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </>
                        ) : (
                          <>
                            <span className="net">€{formatItalianNumber(parseItalianNumberToFloat(formData.netSalary))}</span>
                            <span className="arrow">→</span>
                            <span className="gross">€{(unifiedCalculations?.salary?.grossSalary || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bonus Totali */}
                  {unifiedCalculations?.bonuses && unifiedCalculations.bonuses.totalGross > 0 && (
                    <div className="summary-item">
                      <div className="summary-label">Bonus Totali:</div>
                      <div className="summary-value">
                        <span className="gross">€{(unifiedCalculations?.bonuses?.totalGross || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="arrow">→</span>
                        <span className="net">€{(unifiedCalculations?.bonuses?.totalNet || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}

                  {/* Tasse Totali */}
                  <div className="summary-item">
                    <div className="summary-label">Tasse Totali:</div>
                    <div className="summary-value taxes">
                      €{(unifiedCalculations?.total?.taxes || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* TOTALE CONTRATTO */}
                  <div className="summary-item total">
                    <div className="summary-label">🎯 TOTALE CONTRATTO:</div>
                    <div className="summary-value total">
                      €{(unifiedCalculations?.total?.net || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
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
              <X size={20} />
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
                  {editingContract ? (formData.isOfficialRenewal ? 'Rinnovo Ufficiale' : 'Salva Modifiche') : 'Crea Contratto'}
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
