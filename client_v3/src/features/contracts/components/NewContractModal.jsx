// client_v3/src/features/contracts/components/NewContractModal.jsx
// Modale per creazione/modifica contratto – coerente con client_v3

import { useState, useEffect, useCallback } from 'react';
import { X, Save, FileText, Euro, Percent, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/utils/apiFetch';
import useAuthStore from '@/store/authStore';
import ConfirmDialog from '@/design-system/ds/ConfirmDialog';
import { useUnifiedFiscalCalculation } from '@/lib/hooks/useUnifiedFiscalCalculation';
import { parseItalianNumberToFloat, formatItalianNumber } from '@/lib/utils/italianNumbers';
import BonusField from './BonusField';
import BonusCalculationDisplay from './BonusCalculationDisplay';
import SalaryCalculationDisplay from './SalaryCalculationDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/design-system/ds/Dialog';
import Card, { CardContent, CardHeader } from '@/design-system/ds/Card';
import Button from '@/design-system/ds/Button';

const NewContractModal = ({ isOpen, onClose, onSuccess, editingContract = null }) => {
  const { user, isAuthenticated } = useAuthStore();

  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    const num = typeof value === 'string' ? parseItalianNumberToFloat(value) : Number(value);
    if (Number.isNaN(num)) return '';
    return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const [formData, setFormData] = useState({
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

    isOfficialRenewal: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [players, setPlayers] = useState([]);
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

  const [calculationMode, setCalculationMode] = useState('net'); // 'net' | 'gross'

  const [bonusModes, setBonusModes] = useState({
    imageRights: 'gross',
    loyaltyBonus: 'gross',
    signingBonus: 'gross',
    accommodationBonus: 'gross',
    carAllowance: 'gross',
    transferAllowance: 'gross',
  });

  const [unifiedCalculations, setUnifiedCalculations] = useState(null);

  const hookParams = {
    teamId: user?.teamId,
    contractYear: formData.startDate ? new Date(formData.startDate).getFullYear() : null,
    contractType: formData.contractType,
  };

  const {
    taxRates,
    bonusTaxRates,
    loading: taxLoading,
    calculating: taxCalculating,
    error: taxError,
    calculateUnified,
    calculateSalaryFromNet,
  } = useUnifiedFiscalCalculation(
    hookParams.teamId,
    hookParams.contractYear,
    hookParams.contractType,
  );

  const performUnifiedCalculation = useCallback(() => {
    if (!taxRates) {
      setUnifiedCalculations(null);
      return;
    }

    const calculationData = {
      salary: parseItalianNumberToFloat(formData.salary),
      netSalary: parseItalianNumberToFloat(formData.netSalary),
      calculationMode,
      bonusModes,
      imageRights: parseItalianNumberToFloat(formData.imageRights),
      loyaltyBonus: parseItalianNumberToFloat(formData.loyaltyBonus),
      signingBonus: parseItalianNumberToFloat(formData.signingBonus),
      accommodationBonus: parseItalianNumberToFloat(formData.accommodationBonus),
      carAllowance: parseItalianNumberToFloat(formData.carAllowance),
      transferAllowance: parseItalianNumberToFloat(formData.transferAllowance),
      customImageRightsTax: formData.customImageRightsTax ? parseItalianNumberToFloat(formData.customImageRightsTax) : undefined,
      customLoyaltyBonusTax: formData.customLoyaltyBonusTax ? parseItalianNumberToFloat(formData.customLoyaltyBonusTax) : undefined,
      customSigningBonusTax: formData.customSigningBonusTax ? parseItalianNumberToFloat(formData.customSigningBonusTax) : undefined,
      customAccommodationBonusTax: formData.customAccommodationBonusTax ? parseItalianNumberToFloat(formData.customAccommodationBonusTax) : undefined,
      customCarAllowanceTax: formData.customCarAllowanceTax ? parseItalianNumberToFloat(formData.customCarAllowanceTax) : undefined,
      customTransferAllowanceTax: formData.customTransferAllowanceTax ? parseItalianNumberToFloat(formData.customTransferAllowanceTax) : undefined,
    };

    if (calculationMode === 'net' && parseItalianNumberToFloat(formData.netSalary) > 0) {
      calculateSalaryFromNet(parseItalianNumberToFloat(formData.netSalary))
        .then((backendResult) => {
          const bonusOnlyData = { ...calculationData, salary: 0, netSalary: 0, calculationMode: 'gross' };
          return calculateUnified(bonusOnlyData).then((bonusCalculations) => {
            const combinedResult = {
              salary: backendResult,
              bonuses: bonusCalculations.bonuses,
              total: {
                gross: (backendResult?.grossSalary || 0) + (bonusCalculations.bonuses?.totalGross || 0),
                net: (backendResult?.netSalary || 0) + (bonusCalculations.bonuses?.totalNet || 0),
                taxes: (backendResult?.totaleContributiWorker || 0) + (bonusCalculations.bonuses?.totalTax || 0),
                employerContributions: backendResult?.totaleContributiEmployer || 0,
                companyCost: (backendResult?.companyCost || 0) + (bonusCalculations.bonuses?.totalGross || 0),
              },
            };
            setUnifiedCalculations(combinedResult);
          });
        })
        .catch(() => setUnifiedCalculations(null));
    } else {
      calculateUnified(calculationData)
        .then((calculations) => setUnifiedCalculations(calculations))
        .catch(() => setUnifiedCalculations(null));
    }
  }, [taxRates, bonusTaxRates, calculationMode, formData, bonusModes, calculateUnified, calculateSalaryFromNet]);

  const handleNumberInput = useCallback((e, fieldName) => {
    const { value } = e.target;
    let cleanValue = value.replace(/[^\d,]/g, '');
    const commaIndex = cleanValue.indexOf(',');
    let beforeComma = '';
    let afterComma = '';
    if (commaIndex !== -1) {
      beforeComma = cleanValue.substring(0, commaIndex);
      afterComma = cleanValue.substring(commaIndex + 1).replace(/,/g, '').substring(0, 2);
    } else {
      beforeComma = cleanValue;
    }
    const finalValue = beforeComma + (afterComma ? `,${afterComma}` : '');
    setFormData((prev) => ({ ...prev, [fieldName]: finalValue }));
  }, []);

  const handleNumberBlur = useCallback((e, fieldName) => {
    const { value } = e.target;
    if (!value) return;
    const numericValue = parseItalianNumberToFloat(value);
    if (!Number.isNaN(numericValue)) {
      const formattedValue = formatItalianNumber(numericValue);
      setFormData((prev) => ({ ...prev, [fieldName]: formattedValue }));
      performUnifiedCalculation();
    }
  }, [performUnifiedCalculation]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    if (
      [
        'netSalary',
        'salary',
        'imageRights',
        'loyaltyBonus',
        'signingBonus',
        'accommodationBonus',
        'carAllowance',
        'transferAllowance',
        'taxRate',
        'customImageRightsTax',
        'customLoyaltyBonusTax',
        'customSigningBonusTax',
        'customAccommodationBonusTax',
        'customCarAllowanceTax',
        'customTransferAllowanceTax',
      ].includes(name)
    ) {
      handleNumberInput(e, name);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: null }));
    }

    if (name === 'contractType' || name === 'startDate') {
      performUnifiedCalculation();
    }
  }, [validationErrors, performUnifiedCalculation, handleNumberInput]);

  const getBonusCalculation = (bonusField) => unifiedCalculations?.bonuses?.details?.[bonusField] || null;

  useEffect(() => {
    if (editingContract) {
      // Debug: log della struttura del contratto
      console.log('🔵 editingContract ricevuto:', editingContract);
      console.log('🔵 editingContract.playerId:', editingContract.playerId);
      console.log('🔵 editingContract.players:', editingContract.players);
      
      // Gestisce sia la struttura con playerId che quella con players
      const playerId = editingContract.playerId || (editingContract.players && editingContract.players.id);
      console.log('🔵 playerId calcolato:', playerId);
      
      const newFormData = {
        startDate: editingContract.startDate ? new Date(editingContract.startDate).toISOString().split('T')[0] : '',
        endDate: editingContract.endDate ? new Date(editingContract.endDate).toISOString().split('T')[0] : '',
        salary: editingContract.salary ? formatItalianNumber(editingContract.salary) : '',
        currency: editingContract.currency || 'EUR',
        contractType: editingContract.contractType || '',
        playerId: playerId ? String(playerId) : '',
        status: editingContract.status || 'DRAFT',
        signedDate: editingContract.signedDate ? new Date(editingContract.signedDate).toISOString().split('T')[0] : '',
        notes: editingContract.notes || '',
        agentContact: editingContract.agentContact || '',
        buyOption: !!editingContract.buyOption,
        buyPrice: editingContract.buyPrice ? formatItalianNumber(editingContract.buyPrice) : '',
        contractRole: editingContract.contractRole || '',
        depositDate: editingContract.depositDate ? new Date(editingContract.depositDate).toISOString().split('T')[0] : '',
        loanFromClub: editingContract.loanFromClub || '',
        loanToClub: editingContract.loanToClub || '',
        obligationToBuy: !!editingContract.obligationToBuy,
        paymentFrequency: editingContract.paymentFrequency || '',
        protocolNumber: editingContract.protocolNumber || '',
        responsibleUserId: editingContract.responsibleUserId ? String(editingContract.responsibleUserId) : '',
        isOfficialRenewal: false,
        netSalary: editingContract.netSalary ? formatItalianNumber(editingContract.netSalary) : '',
        imageRights: editingContract.imageRights ? formatItalianNumber(editingContract.imageRights) : '',
        loyaltyBonus: editingContract.loyaltyBonus ? formatItalianNumber(editingContract.loyaltyBonus) : '',
        signingBonus: editingContract.signingBonus ? formatItalianNumber(editingContract.signingBonus) : '',
        accommodationBonus: editingContract.accommodationBonus ? formatItalianNumber(editingContract.accommodationBonus) : '',
        carAllowance: editingContract.carAllowance ? formatItalianNumber(editingContract.carAllowance) : '',
        transferAllowance: editingContract.transferAllowance ? formatItalianNumber(editingContract.transferAllowance) : '',
        taxRegime: editingContract.taxRegime || '',
        taxRate: editingContract.taxRate ? formatItalianNumber(editingContract.taxRate) : '',
        socialContributions: editingContract.socialContributions || '',
        contractNumber: editingContract.contractNumber || '',
        fifaId: editingContract.fifaId || '',
        leagueRegistrationId: editingContract.leagueRegistrationId || '',
        insuranceValue: editingContract.insuranceValue || '',
        insuranceProvider: editingContract.insuranceProvider || '',
        medicalInsurance: !!editingContract.medicalInsurance,
      };
      
      console.log('🔵 FormData che verrà impostato:', newFormData);
      console.log('🔵 playerId nel formData:', newFormData.playerId);
      
      setFormData(newFormData);
    } else {
      setFormData((prev) => ({
        ...prev,
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
        netSalary: '',
        imageRights: '',
        loyaltyBonus: '',
        signingBonus: '',
        accommodationBonus: '',
        carAllowance: '',
        transferAllowance: '',
      }));
    }
  }, [editingContract]);

  const getPositionLabel = (position) => {
    switch (position) {
      case 'GOALKEEPER': return 'Portiere';
      case 'DEFENDER': return 'Difensore';
      case 'MIDFIELDER': return 'Centrocampista';
      case 'FORWARD': return 'Attaccante';
      default: return position;
    }
  };

  const getSortedPlayers = () => {
    console.log('🔵 getSortedPlayers chiamata - players.length:', players.length);
    console.log('🔵 players array:', players);
    
    const roleOrder = { GOALKEEPER: 1, DEFENDER: 2, MIDFIELDER: 3, FORWARD: 4 };
    const sorted = [...players].sort((a, b) => {
      const roleA = roleOrder[a.position] || 999;
      const roleB = roleOrder[b.position] || 999;
      if (roleA !== roleB) return roleA - roleB;
      return a.lastName.localeCompare(b.lastName, 'it');
    });
    
    console.log('🔵 getSortedPlayers risultato - sorted.length:', sorted.length);
    return sorted;
  };

  useEffect(() => { if (isOpen) fetchPlayers(); }, [isOpen]);

  const fetchPlayers = async () => {
    try {
      console.log('🔵 Caricamento giocatori...');
      const response = await apiFetch('/api/players');
      console.log('🔵 Risposta API giocatori:', response);
      
      // apiFetch già restituisce i dati JSON, non serve response.json()
      setPlayers(response.data || response || []);
      console.log('🔵 Giocatori caricati:', response.data || response || []);
    } catch (err) {
      console.error('❌ Errore caricamento giocatori:', err);
      setPlayers([]);
    }
  };

  const toggleBonusMode = useCallback((bonusField) => {
    const newMode = bonusModes[bonusField] === 'gross' ? 'net' : 'gross';
    setBonusModes((prev) => ({ ...prev, [bonusField]: newMode }));
    if (unifiedCalculations?.bonuses?.details?.[bonusField]) {
      const calc = unifiedCalculations.bonuses.details[bonusField];
      const newValue = newMode === 'net' ? calc.netAmount : calc.grossAmount;
      setFormData((prev) => ({ ...prev, [bonusField]: formatNumber(newValue) }));
    }
  }, [bonusModes, unifiedCalculations]);

  useEffect(() => {
    if (
      taxRates &&
      bonusTaxRates &&
      (formData.salary || formData.imageRights || formData.loyaltyBonus || formData.signingBonus || formData.accommodationBonus || formData.carAllowance || formData.transferAllowance)
    ) {
      performUnifiedCalculation();
    }
  }, [calculationMode, taxRates, bonusTaxRates, performUnifiedCalculation]);

  const validateForm = () => {
    const errors = {};
    if (!formData.startDate) errors.startDate = 'Data inizio è obbligatoria';
    if (!formData.endDate) errors.endDate = 'Data fine è obbligatoria';
    const salaryValue = calculationMode === 'net' ? formData.netSalary : formData.salary;
    const salaryNumeric = parseItalianNumberToFloat(salaryValue);
    if (!salaryValue || salaryNumeric <= 0) {
      errors.salary = calculationMode === 'net' ? 'Stipendio netto deve essere maggiore di 0' : 'Stipendio lordo deve essere maggiore di 0';
    }
    if (!formData.contractType) errors.contractType = 'Tipo contratto è obbligatorio';
    if (!formData.playerId) errors.playerId = 'Giocatore è obbligatorio';
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) errors.endDate = 'La data di fine deve essere successiva alla data di inizio';
    }
    if (formData.buyOption && formData.buyPrice && Number(formData.buyPrice) <= 0) {
      errors.buyPrice = 'Prezzo riscatto deve essere maggiore di 0';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Devi essere autenticato per creare/modificare un contratto');
      return;
    }
    if (!validateForm()) return;

    if (calculationMode === 'net' && (!unifiedCalculations?.salary?.grossSalary || unifiedCalculations.salary.grossSalary <= 0)) {
      setError('Impossibile calcolare il lordo dal netto inserito. Verifica che le aliquote fiscali siano caricate.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contractData = {
        ...formData,
        salary: (() => {
          if (calculationMode === 'net') {
            const grossSalary = unifiedCalculations?.salary?.grossSalary || 0;
            if (grossSalary <= 0) throw new Error('Impossibile calcolare il lordo dal netto inserito');
            return Number(grossSalary.toFixed(2));
          }
          const s = parseItalianNumberToFloat(formData.salary);
          if (s <= 0) throw new Error('Lo stipendio lordo deve essere maggiore di 0');
          return Number(s.toFixed(2));
        })(),
        netSalary: (() => {
          const netValue = calculationMode === 'net' ? parseItalianNumberToFloat(formData.netSalary) : (unifiedCalculations?.salary?.netSalary || 0);
          return Number(netValue.toFixed(2));
        })(),
        buyPrice: formData.buyPrice ? parseItalianNumberToFloat(formData.buyPrice) : null,
        responsibleUserId: formData.responsibleUserId || null,
        imageRights: formData.imageRights ? parseItalianNumberToFloat(formData.imageRights) : 0,
        loyaltyBonus: formData.loyaltyBonus ? parseItalianNumberToFloat(formData.loyaltyBonus) : 0,
        signingBonus: formData.signingBonus ? parseItalianNumberToFloat(formData.signingBonus) : 0,
        accommodationBonus: formData.accommodationBonus ? parseItalianNumberToFloat(formData.accommodationBonus) : 0,
        carAllowance: formData.carAllowance ? parseItalianNumberToFloat(formData.carAllowance) : 0,
        transferAllowance: formData.transferAllowance ? parseItalianNumberToFloat(formData.transferAllowance) : 0,
      };

      let response;
      if (editingContract) {
        response = await apiFetch(`/api/contracts/${editingContract.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contractData),
        });
      } else {
        response = await apiFetch('/api/contracts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contractData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Errore ${response.status}`);
      }

      const saved = await response.json();
      setSuccessDialog({ isOpen: true, message: editingContract ? 'Contratto modificato con successo!' : 'Contratto creato con successo!' });

      setFormData((prev) => ({
        ...prev,
        startDate: '', endDate: '', salary: '', currency: 'EUR', contractType: '', playerId: '', status: 'DRAFT',
        signedDate: '', notes: '', agentContact: '', buyOption: false, buyPrice: '', contractRole: '', depositDate: '',
        loanFromClub: '', loanToClub: '', obligationToBuy: false, paymentFrequency: '', protocolNumber: '', responsibleUserId: '',
      }));

      onSuccess?.(saved.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError(null);
    setValidationErrors({});
    onClose();
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialog({ isOpen: false, message: '' });
    onSuccess && onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col p-0">
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={24} className="text-primary" />
              {editingContract ? 'Modifica Contratto' : 'Nuovo Contratto'}
            </DialogTitle>
            <DialogDescription>
              {editingContract ? 'Modifica i dettagli del contratto esistente' : 'Crea un nuovo contratto per il giocatore'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 space-y-6">
          {/* Informazioni base */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} className="text-blue-500" />
                Informazioni Base
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="playerId" className="text-sm font-medium text-foreground">Giocatore *</label>
                  <select 
                    id="playerId" 
                    name="playerId" 
                    value={formData.playerId} 
                    onChange={(e) => {
                      console.log('🔵 Cambio giocatore - valore selezionato:', e.target.value);
                      handleChange(e);
                    }}
                    onFocus={() => console.log('🔵 Focus su select giocatore - valore corrente:', formData.playerId)}
                    required 
                    disabled={loading} 
                    className={`input-base ${validationErrors.playerId ? 'border-red-500' : ''}`}
                  >
                    <option value="">Seleziona giocatore</option>
                    {getSortedPlayers().map((p) => {
                      const isSelected = String(p.id) === String(formData.playerId);
                      if (isSelected) {
                        console.log('🔵 Giocatore che dovrebbe essere selezionato:', p.firstName, p.lastName, 'ID:', p.id);
                      }
                      return (
                        <option key={p.id} value={p.id}>
                          {p.lastName.toUpperCase()} {p.firstName} - {getPositionLabel(p.position)}
                        </option>
                      );
                    })}
                  </select>
                  {validationErrors.playerId && <span className="text-sm text-red-500">{validationErrors.playerId}</span>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="contractType" className="text-sm font-medium text-foreground">Tipo Contratto *</label>
                  <select 
                    id="contractType" 
                    name="contractType" 
                    value={formData.contractType} 
                    onChange={handleChange} 
                    required 
                    disabled={loading} 
                    className={`input-base ${validationErrors.contractType ? 'border-red-500' : ''}`}
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
                  {validationErrors.contractType && <span className="text-sm text-red-500">{validationErrors.contractType}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startDate" className="text-sm font-medium text-foreground">Data Inizio *</label>
                  <input 
                    type="date" 
                    id="startDate" 
                    name="startDate" 
                    value={formData.startDate} 
                    onChange={handleChange} 
                    required 
                    disabled={loading} 
                    className={`input-base ${validationErrors.startDate ? 'border-red-500' : ''}`} 
                  />
                  {validationErrors.startDate && <span className="text-sm text-red-500">{validationErrors.startDate}</span>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="endDate" className="text-sm font-medium text-foreground">Data Fine *</label>
                  <input 
                    type="date" 
                    id="endDate" 
                    name="endDate" 
                    value={formData.endDate} 
                    onChange={handleChange} 
                    required 
                    disabled={loading} 
                    className={`input-base ${validationErrors.endDate ? 'border-red-500' : ''}`} 
                  />
                  {validationErrors.endDate && <span className="text-sm text-red-500">{validationErrors.endDate}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium text-foreground">Stato</label>
                  <select 
                    id="status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    disabled={loading} 
                    className="input-base"
                  >
                    <option value="DRAFT">Bozza</option>
                    <option value="ACTIVE">Attivo</option>
                    <option value="SUSPENDED">Sospeso</option>
                    <option value="EXPIRED">Non Attivo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="signedDate" className="text-sm font-medium text-foreground">Data Firma</label>
                  <input 
                    type="date" 
                    id="signedDate" 
                    name="signedDate" 
                    value={formData.signedDate} 
                    onChange={handleChange} 
                    disabled={loading} 
                    className="input-base" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dati Economici */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Euro size={20} className="text-green-500" />
                Dati Economici
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Toggle Stipendio */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-foreground">Tipo Stipendio:</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={calculationMode === 'net' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCalculationMode('net'); }}
                      disabled={loading}
                    >
                      Stipendio Netto
                    </Button>
                    <Button
                      type="button"
                      variant={calculationMode === 'gross' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCalculationMode('gross'); }}
                      disabled={loading}
                    >
                      Stipendio Lordo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor={calculationMode === 'net' ? 'netSalary' : 'salary'} className="text-sm font-medium text-foreground">
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
                      className={`input-base ${validationErrors.salary ? 'border-red-500' : ''}`} 
                    />
                    {validationErrors.salary && <span className="text-sm text-red-500">{validationErrors.salary}</span>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="currency" className="text-sm font-medium text-foreground">Valuta</label>
                    <select 
                      id="currency" 
                      name="currency" 
                      value={formData.currency} 
                      onChange={handleChange} 
                      disabled={loading} 
                      className="input-base"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Calcoli Fiscali */}
              <div className="space-y-4">
                {taxError && (
                  <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                        <AlertTriangle size={16} />
                        <span>{taxError}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!taxRates && !taxLoading && (formData.netSalary || formData.salary) && (
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Percent size={16} />
                        <span>Nessuna aliquota fiscale trovata per {formData.startDate ? new Date(formData.startDate).getFullYear() : 'questo anno'} e tipo contratto "{formData.contractType}". Carica le aliquote dalla sezione "Carica Aliquote".</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {taxRates && (
                  <SalaryCalculationDisplay
                    calculation={unifiedCalculations?.salary}
                    calculationMode={calculationMode}
                    inputAmount={calculationMode === 'net' ? formatNumber(formData.netSalary) : formatNumber(formData.salary)}
                    totalCalculation={unifiedCalculations}
                    calculating={taxCalculating}
                  />
                )}

                {taxRates && !unifiedCalculations?.salary && (formData.netSalary || formData.salary) && (
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Percent size={16} />
                        <span>Inserisci un valore per {calculationMode === 'net' ? 'lo stipendio netto' : 'lo stipendio lordo'} per vedere i calcoli automatici</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="paymentFrequency" className="text-sm font-medium text-foreground">Frequenza Pagamento</label>
                  <select 
                    id="paymentFrequency" 
                    name="paymentFrequency" 
                    value={formData.paymentFrequency} 
                    onChange={handleChange} 
                    disabled={loading} 
                    className="input-base"
                  >
                    <option value="">Seleziona frequenza</option>
                    <option value="MONTHLY">Mensile</option>
                    <option value="BIMONTHLY">Bimensile</option>
                    <option value="QUARTERLY">Trimestrale</option>
                    <option value="ANNUAL">Annuale</option>
                    <option value="PER_APPEARANCE">A partita</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="contractRole" className="text-sm font-medium text-foreground">Ruolo Contrattuale</label>
                  <select 
                    id="contractRole" 
                    name="contractRole" 
                    value={formData.contractRole} 
                    onChange={handleChange} 
                    disabled={loading} 
                    className="input-base"
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
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-foreground">Bonus e Indennità</h4>

                {taxError && (
                  <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                        <AlertTriangle size={16} />
                        <div className="flex items-center gap-2">
                          <span>{taxError}</span>
                          <Button 
                            onClick={() => (window.location.href = '/dashboard/bonustaxrates/upload')} 
                            variant="outline" 
                            size="sm"
                          >
                            Carica Aliquote
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!bonusTaxRates && !taxLoading && (
                  parseItalianNumberToFloat(formData.imageRights) > 0 ||
                  parseItalianNumberToFloat(formData.loyaltyBonus) > 0 ||
                  parseItalianNumberToFloat(formData.signingBonus) > 0 ||
                  parseItalianNumberToFloat(formData.accommodationBonus) > 0 ||
                  parseItalianNumberToFloat(formData.carAllowance) > 0 ||
                  parseItalianNumberToFloat(formData.transferAllowance) > 0
                ) && (
                  <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 text-yellow-700 dark:text-yellow-300">
                        <AlertTriangle size={16} className="mt-0.5" />
                        <div className="space-y-2">
                          <strong>Aliquote bonus non disponibili</strong>
                          <p>Nessuna aliquota bonus trovata per {formData.startDate ? new Date(formData.startDate).getFullYear() : 'questo anno'}.</p>
                          <p>Carica le aliquote bonus dalla sezione <strong>"Carica Aliquote Bonus"</strong> per vedere i calcoli automatici.</p>
                          <Button 
                            onClick={() => (window.location.href = '/dashboard/bonustaxrates/upload')} 
                            variant="primary" 
                            size="sm"
                          >
                            Carica Aliquote Bonus
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {taxLoading && (
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Caricamento aliquote bonus...</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Calcolo Individuale:</strong> Ogni bonus può essere impostato come Lordo o Netto indipendentemente. Usa i pulsanti L/N accanto a ogni campo per scegliere la modalità.
                    </p>
                  </div>

                  <BonusField bonusField="imageRights" label="Diritti Immagine" taxPlaceholder="es. 23,00" bonusMode={bonusModes.imageRights} fieldValue={formData.imageRights || ''} customTaxValue={formData.customImageRightsTax || ''} loading={loading} onToggleMode={toggleBonusMode} onChange={handleChange} onBlur={handleNumberBlur} />
                  <BonusCalculationDisplay bonusField="imageRights" label="Diritti Immagine" fieldValue={formData.imageRights || ''} calc={getBonusCalculation('imageRights')} bonusMode={bonusModes.imageRights} />

                  <BonusField bonusField="loyaltyBonus" label="Bonus Fedeltà" taxPlaceholder="es. 38,00" bonusMode={bonusModes.loyaltyBonus} fieldValue={formData.loyaltyBonus || ''} customTaxValue={formData.customLoyaltyBonusTax || ''} loading={loading} onToggleMode={toggleBonusMode} onChange={handleChange} onBlur={handleNumberBlur} />
                  <BonusCalculationDisplay bonusField="loyaltyBonus" label="Bonus Fedeltà" fieldValue={formData.loyaltyBonus || ''} calc={getBonusCalculation('loyaltyBonus')} bonusMode={bonusModes.loyaltyBonus} />

                  <BonusField bonusField="signingBonus" label="Bonus Firma" taxPlaceholder="es. 38,00" bonusMode={bonusModes.signingBonus} fieldValue={formData.signingBonus || ''} customTaxValue={formData.customSigningBonusTax || ''} loading={loading} onToggleMode={toggleBonusMode} onChange={handleChange} onBlur={handleNumberBlur} />
                  <BonusCalculationDisplay bonusField="signingBonus" label="Bonus Firma" fieldValue={formData.signingBonus || ''} calc={getBonusCalculation('signingBonus')} bonusMode={bonusModes.signingBonus} />

                  <BonusField bonusField="accommodationBonus" label="Bonus Alloggio" taxPlaceholder="es. 38,00" bonusMode={bonusModes.accommodationBonus} fieldValue={formData.accommodationBonus || ''} customTaxValue={formData.customAccommodationBonusTax || ''} loading={loading} onToggleMode={toggleBonusMode} onChange={handleChange} onBlur={handleNumberBlur} />
                  <BonusCalculationDisplay bonusField="accommodationBonus" label="Bonus Alloggio" fieldValue={formData.accommodationBonus || ''} calc={getBonusCalculation('accommodationBonus')} bonusMode={bonusModes.accommodationBonus} />

                  <BonusField bonusField="carAllowance" label="Indennità Auto" taxPlaceholder="es. 38,00" bonusMode={bonusModes.carAllowance} fieldValue={formData.carAllowance || ''} customTaxValue={formData.customCarAllowanceTax || ''} loading={loading} onToggleMode={toggleBonusMode} onChange={handleChange} onBlur={handleNumberBlur} />
                  <BonusCalculationDisplay bonusField="carAllowance" label="Indennità Auto" fieldValue={formData.carAllowance || ''} calc={getBonusCalculation('carAllowance')} bonusMode={bonusModes.carAllowance} />

                  <BonusField bonusField="transferAllowance" label="Indennità di Trasferta" taxPlaceholder="es. 38,00" bonusMode={bonusModes.transferAllowance} fieldValue={formData.transferAllowance || ''} customTaxValue={formData.customTransferAllowanceTax || ''} loading={loading} onToggleMode={toggleBonusMode} onChange={handleChange} onBlur={handleNumberBlur} />
                  <BonusCalculationDisplay bonusField="transferAllowance" label="Indennità di Trasferta" fieldValue={formData.transferAllowance || ''} calc={getBonusCalculation('transferAllowance')} bonusMode={bonusModes.transferAllowance} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clausole e opzioni */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} className="text-purple-500" />
                Clausole e Opzioni
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="buyOption" 
                    name="buyOption" 
                    checked={formData.buyOption} 
                    onChange={handleChange} 
                    disabled={loading}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="buyOption" className="text-sm font-medium text-foreground">
                    Opzione di riscatto
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="obligationToBuy" 
                    name="obligationToBuy" 
                    checked={formData.obligationToBuy} 
                    onChange={handleChange} 
                    disabled={loading}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="obligationToBuy" className="text-sm font-medium text-foreground">
                    Obbligo di riscatto
                  </label>
                </div>
              </div>

              {formData.buyOption && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="buyPrice" className="text-sm font-medium text-foreground">Prezzo Riscatto</label>
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
                      className={`input-base ${validationErrors.buyPrice ? 'border-red-500' : ''}`} 
                    />
                    {validationErrors.buyPrice && <span className="text-sm text-red-500">{validationErrors.buyPrice}</span>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="depositDate" className="text-sm font-medium text-foreground">Data Deposito</label>
                  <input 
                    type="date" 
                    id="depositDate" 
                    name="depositDate" 
                    value={formData.depositDate} 
                    onChange={handleChange} 
                    disabled={loading} 
                    className="input-base" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="protocolNumber" className="text-sm font-medium text-foreground">Numero Protocollo</label>
                  <input 
                    type="text" 
                    id="protocolNumber" 
                    name="protocolNumber" 
                    value={formData.protocolNumber} 
                    onChange={handleChange} 
                    disabled={loading} 
                    placeholder="Es. 2024/001" 
                    className="input-base" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identificativi e Registrazioni */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} className="text-indigo-500" />
                Identificativi e Registrazioni
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="contractNumber" className="text-sm font-medium text-foreground">Numero Contratto</label>
                  <input 
                    type="text" 
                    id="contractNumber" 
                    name="contractNumber" 
                    value={formData.contractNumber} 
                    onChange={handleChange} 
                    disabled={loading} 
                    placeholder="Es. CON-2024-001" 
                    className="input-base" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="fifaId" className="text-sm font-medium text-foreground">ID FIFA</label>
                  <input 
                    type="text" 
                    id="fifaId" 
                    name="fifaId" 
                    value={formData.fifaId} 
                    onChange={handleChange} 
                    disabled={loading} 
                    placeholder="ID FIFA del giocatore" 
                    className="input-base" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="leagueRegistrationId" className="text-sm font-medium text-foreground">ID Registrazione Lega</label>
                  <input 
                    type="text" 
                    id="leagueRegistrationId" 
                    name="leagueRegistrationId" 
                    value={formData.leagueRegistrationId} 
                    onChange={handleChange} 
                    disabled={loading} 
                    placeholder="ID registrazione lega" 
                    className="input-base" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errori */}
          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertTriangle size={20} />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          </div>
          
          {/* Azioni - sempre visibili */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
              variant="secondary"
            >
              <X size={20} />
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
            >
              {loading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  {editingContract ? 'Salvataggio...' : 'Creazione...'}
                </>
              ) : (
                <>
                  <Save size={20} />
                  {editingContract ? 'Salva Modifiche' : 'Crea Contratto'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
      
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
    </Dialog>
  );
};

export default NewContractModal;