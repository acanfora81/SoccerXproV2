import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Base URL per le chiamate API
const API_BASE_URL = 'http://localhost:3001';

/**
 * Hook unificato per gestire TUTTI i calcoli fiscali
 * Gestisce stipendio, bonus e tutti i campi monetari in modo unificato
 */
export const useUnifiedFiscalCalculation = (teamId, contractYear, contractType, region, municipality) => {
  // Con architettura V2 non servono più le aliquote legacy lato FE
  const [taxRates, setTaxRates] = useState(null);
  const [bonusTaxRates, setBonusTaxRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);


  // Recupera solo le aliquote BONUS (le aliquote stipendio legacy non sono più usate)
  const fetchAllTaxRates = useCallback(async () => {
    console.log('🔵 fetchAllTaxRates chiamata con:', { teamId, contractYear, contractType });
    
    if (!teamId || !contractYear || !contractType) {
      console.log('🔴 Parametri mancanti per recupero aliquote:', { teamId: !!teamId, contractYear: !!contractYear, contractType: !!contractType });
      setTaxRates(null);
      setBonusTaxRates(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Non recuperiamo più le aliquote stipendio legacy (tabella tax_rates rimossa)
      setTaxRates(null);

      // Recupera aliquote bonus
      console.log('🔵 Chiamando API bonus con URL:', `${API_BASE_URL}/api/bonustaxrates?teamId=${teamId}`);
      const bonusResponse = await axios.get(`${API_BASE_URL}/api/bonustaxrates?teamId=${teamId}`, {
        withCredentials: true
      });
      console.log('🔵 RISPOSTA ALIQUOTE BONUS:', bonusResponse.data);
      
      if (bonusResponse.data.success) {
        console.log('🔵 TUTTE LE ALIQUOTE BONUS DISPONIBILI:', bonusResponse.data.data);
        const allRates = bonusResponse.data.data;
        const targetYear = parseInt(contractYear);
        const relevantRates = allRates.filter(rate => parseInt(rate.year) === targetYear);
        console.log('🔵 ALIQUOTE BONUS PER ANNO', targetYear, ':', relevantRates);
        
        if (relevantRates.length > 0) {
          const ratesMap = {};
          relevantRates.forEach(rate => {
            ratesMap[rate.type] = rate.taxRate;
          });
          console.log('🔵 MAPPA ALIQUOTE BONUS:', ratesMap);
          setBonusTaxRates(ratesMap);
        } else {
          console.log('🔴 NESSUNA ALIQUOTA BONUS TROVATA PER ANNO', contractYear);
          setBonusTaxRates(null);
        }
      } else {
        console.log('🔴 ERRORE RISPOSTA API BONUS:', bonusResponse.data);
        setBonusTaxRates(null);
      }
    } catch (err) {
      console.error('🔴 Unified Fiscal Calculation: Errore recupero aliquote:', err);
      console.error('🔴 Dettagli errore:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      setError('Errore nel recupero delle aliquote fiscali');
      setTaxRates(null);
      setBonusTaxRates(null);
    } finally {
      setLoading(false);
    }
  }, [teamId, contractYear, contractType]);


  // Calcola stipendio dal netto usando l'API backend V2
  const calculateSalaryFromNet = useCallback(async (netSalary) => {
    if (!netSalary || netSalary <= 0) {
      return { netSalary: 0, grossSalary: 0, companyCost: 0 };
    }

    try {
      setCalculating(true);
      const payload = {
        netSalary,
        year: contractYear || 2025,
        region: region || null,
        municipality: municipality || null,
        contractType: contractType,
        teamId: teamId
      };
      console.log('🟦 [FE] POST /api/taxes/v2/gross-from-net payload:', payload);
      const response = await axios.post(`${API_BASE_URL}/api/taxes/v2/gross-from-net`, payload, {
        withCredentials: true
      });
      console.log('🟩 [FE] Response /api/taxes/v2/gross-from-net:', response.data);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('❌ Errore calcolo stipendio da netto:', error);
      return { netSalary: 0, grossSalary: 0, companyCost: 0 };
    } finally {
      setCalculating(false);
    }
  }, [contractYear, contractType, teamId, region, municipality]);

  // Calcola stipendio dal lordo usando l'API backend V2
  const calculateSalaryFromGross = useCallback(async (grossSalary) => {
    if (!grossSalary || grossSalary <= 0) {
      return { netSalary: 0, grossSalary: 0, companyCost: 0 };
    }
    try {
      setCalculating(true);
      const payload = {
        grossSalary,
        year: contractYear || 2025,
        region: region || null,
        municipality: municipality || null,
        contractType: contractType,
        teamId: teamId
      };
      console.log('🟦 [FE] POST /api/taxes/v2/net-from-gross payload:', payload);
      const response = await axios.post(`${API_BASE_URL}/api/taxes/v2/net-from-gross`, payload, {
        withCredentials: true
      });
      console.log('🟩 [FE] Response /api/taxes/v2/net-from-gross:', response.data);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('❌ Errore calcolo stipendio da lordo:', error);
      return { netSalary: 0, grossSalary: 0, companyCost: 0 };
    } finally {
      setCalculating(false);
    }
  }, [contractYear, contractType, teamId, region, municipality]);

  // Calcola tasse per un bonus specifico (supporta aliquote personalizzate)
  const calculateBonusTax = useCallback((bonusType, grossAmount, customTaxRate = null) => {
    console.log(`🔵 calculateBonusTax INPUT:`, { bonusType, grossAmount, typeOfGrossAmount: typeof grossAmount, customTaxRate });
    
    if (!grossAmount || grossAmount <= 0) {
      return {
        grossAmount: 0,
        taxAmount: 0,
        netAmount: 0,
        taxRate: 0
      };
    }

    let taxRate = 0;
    
    // Usa aliquota personalizzata se fornita
    if (customTaxRate !== null && customTaxRate !== undefined && customTaxRate !== '') {
      // Se è già un numero, usalo direttamente. Se è una stringa, parsalo
      taxRate = typeof customTaxRate === 'number' ? customTaxRate : parseFloat(customTaxRate) || 0;
      console.log('🟢 Bonus Tax: Usando aliquota personalizzata', customTaxRate, 'per', bonusType, '→ taxRate:', taxRate);
    } 
    // Altrimenti usa quella dal database
    else if (bonusTaxRates) {
      console.log('🔵 Bonus Tax: Aliquota personalizzata vuota/assente per', bonusType, '→ usando database');
      console.log('🔵 Bonus Tax: Cercando', bonusType, 'in bonusTaxRates:', bonusTaxRates);
      console.log('🔵 Bonus Tax: Chiavi disponibili:', Object.keys(bonusTaxRates));
      const rawValue = bonusTaxRates[bonusType];
      taxRate = parseFloat(rawValue) || 0;
      console.log('🟢 Bonus Tax: Aliquota trovata dal database:', rawValue, '→ parsedTaxRate:', taxRate, 'per', bonusType);
    } else {
      console.log('🔴 Bonus Tax: bonusTaxRates è null/undefined');
    }
    
    if (taxRate === 0) {
      console.log('🔴 Bonus Tax: Nessuna aliquota trovata per', bonusType, '- customTaxRate:', customTaxRate, '- bonusTaxRates:', bonusTaxRates);
    }
    
    const taxAmount = grossAmount * (taxRate / 100);
    const netAmount = grossAmount - taxAmount;

    const result = {
      grossAmount,
      taxAmount,
      netAmount,
      taxRate
    };
    
    console.log(`🔵 calculateBonusTax RESULT:`, result);
    
    return result;
  }, [bonusTaxRates]);

  // Calcola bonus dal netto al lordo
  const calculateBonusFromNet = useCallback((bonusType, netAmount, customTaxRate = null) => {
    if (!netAmount || netAmount <= 0) {
      return { grossAmount: 0, taxAmount: 0, netAmount: 0, taxRate: 0 };
    }

    let taxRate = 0;
    
    // Usa aliquota personalizzata se fornita
    if (customTaxRate !== null && customTaxRate !== undefined && customTaxRate !== '') {
      // Se è già un numero, usalo direttamente. Se è una stringa, parsalo
      taxRate = typeof customTaxRate === 'number' ? customTaxRate : parseFloat(customTaxRate) || 0;
    } 
    // Altrimenti usa quella dal database
    else if (bonusTaxRates) {
      taxRate = parseFloat(bonusTaxRates[bonusType]) || 0;
    }
    
    if (taxRate === 0) {
      return { grossAmount: netAmount, taxAmount: 0, netAmount, taxRate: 0 };
    }
    
    // Formula: netto = lordo * (1 - taxRate/100)
    // Quindi: lordo = netto / (1 - taxRate/100)
    const grossAmount = netAmount / (1 - taxRate / 100);
    const taxAmount = grossAmount - netAmount;
    
    return { grossAmount, taxAmount, netAmount, taxRate };
  }, [bonusTaxRates]);

  // Calcola tutti i bonus (supporta aliquote personalizzate)
  const calculateAllBonuses = useCallback((bonusData, customTaxRates = {}, bonusModes = {}) => {
    console.log('🔵 calculateAllBonuses chiamata con:', { bonusData, customTaxRates, bonusTaxRates, bonusModes });
    
    // Mapping per supportare sia nomi inglesi che italiani
    const bonusTypes = {
      imageRights: ['IMAGE_RIGHTS', 'Diritti Immagine'],
      loyaltyBonus: ['LOYALTY_BONUS', 'Bonus Fedeltà'],
      signingBonus: ['SIGNING_BONUS', 'Bonus Firma'],
      accommodationBonus: ['ACCOMMODATION_BONUS', 'Bonus Alloggio'],
      carAllowance: ['CAR_ALLOWANCE', 'Indennità Auto'],
      transferAllowance: ['TRANSFER_ALLOWANCE', 'Indennità di Trasferita']
    };

    const details = {};
    let totalGross = 0;
    let totalTax = 0;
    let totalNet = 0;

    Object.entries(bonusTypes).forEach(([field, possibleBonusTypes]) => {
      const inputAmount = bonusData[field] || 0;
      
      // Mappa il campo all'aliquota personalizzata corrispondente
      const customTaxField = {
        imageRights: 'customImageRightsTax',
        loyaltyBonus: 'customLoyaltyBonusTax',
        signingBonus: 'customSigningBonusTax',
        accommodationBonus: 'customAccommodationBonusTax',
        carAllowance: 'customCarAllowanceTax',
        transferAllowance: 'customTransferAllowanceTax'
      }[field];
      
      const customTaxRate = customTaxRates[customTaxField];
      
      // Modalità individuale per questo bonus (fallback a 'gross' se non specificata)
      const fieldMode = bonusModes[field] || 'gross';
      
      console.log(`🔵 Processando ${field}:`, { 
        inputAmount, 
        fieldMode,
        customTaxField, 
        customTaxRate, 
        possibleBonusTypes,
        bonusDataField: bonusData[field],
        typeOfInput: typeof inputAmount
      });
      
      // Calcola in base alla modalità individuale
      let calculation = null;
      
      for (const bonusType of possibleBonusTypes) {
        if (fieldMode === 'net') {
          // L'utente ha inserito il netto, calcoliamo il lordo
          calculation = calculateBonusFromNet(bonusType, inputAmount, customTaxRate);
        } else {
          // L'utente ha inserito il lordo, calcoliamo il netto
          calculation = calculateBonusTax(bonusType, inputAmount, customTaxRate);
        }
        console.log(`🔵 Calcolo ${fieldMode} per ${bonusType}:`, calculation);
        console.log(`🔵 Dettagli calcolo - customTaxRate: ${customTaxRate}, bonusTaxRates:`, bonusTaxRates);
        if (calculation.taxRate > 0) break; // Trovato un'aliquota valida
      }
      
      if (!calculation) {
        // Fallback al primo tipo
        if (fieldMode === 'net') {
          calculation = calculateBonusFromNet(possibleBonusTypes[0], inputAmount, customTaxRate);
        } else {
          calculation = calculateBonusTax(possibleBonusTypes[0], inputAmount, customTaxRate);
        }
        console.log(`🔵 Fallback calcolo ${fieldMode} per ${possibleBonusTypes[0]}:`, calculation);
      }
      
      details[field] = {
        ...calculation,
        bonusType: possibleBonusTypes[0], // Usa il nome inglese per consistenza
        fieldName: field,
        isCustomRate: !!customTaxRate,
        inputMode: fieldMode // Teniamo traccia della modalità input
      };

      totalGross += calculation.grossAmount;
      totalTax += calculation.taxAmount;
      totalNet += calculation.netAmount;
    });

    return {
      details,
      totalGross,
      totalTax,
      totalNet
    };
  }, [bonusTaxRates, calculateBonusTax, calculateBonusFromNet]);

  // Calcolo unificato per tutto
  const calculateUnified = useCallback(async (data) => {
    const { salary, netSalary, calculationMode, bonusModes = {}, ...bonusData } = data;

    // Estrai le aliquote personalizzate dai dati bonus
    const customTaxRates = {
      customImageRightsTax: bonusData.customImageRightsTax,
      customLoyaltyBonusTax: bonusData.customLoyaltyBonusTax,
      customSigningBonusTax: bonusData.customSigningBonusTax,
      customAccommodationBonusTax: bonusData.customAccommodationBonusTax,
      customCarAllowanceTax: bonusData.customCarAllowanceTax,
      customTransferAllowanceTax: bonusData.customTransferAllowanceTax
    };

    // Rimuovi le aliquote personalizzate dai dati bonus per il calcolo
    const { 
      customImageRightsTax, customLoyaltyBonusTax, customSigningBonusTax,
      customAccommodationBonusTax, customCarAllowanceTax, customTransferAllowanceTax,
      ...cleanBonusData 
    } = bonusData;

    // Calcola stipendio (ora async)
    let salaryCalculation = null;
    if (calculationMode === 'net' && netSalary > 0) {
      salaryCalculation = await calculateSalaryFromNet(netSalary);
    } else if (calculationMode === 'gross' && salary > 0) {
      salaryCalculation = await calculateSalaryFromGross(salary);
    }

    // Calcola bonus con aliquote personalizzate e modalità individuali
    const bonusCalculation = calculateAllBonuses(cleanBonusData, customTaxRates, bonusModes);
    
    console.log('🔵 calculateUnified risultato finale:', {
      salary: salaryCalculation,
      bonuses: bonusCalculation,
      inputData: { cleanBonusData, customTaxRates, bonusModes }
    });

    const workerTot = (salaryCalculation?.totaleContributiWorker ?? ( (salaryCalculation?.inpsWorker || 0) + (salaryCalculation?.ffcWorker || 0) + (salaryCalculation?.solidarityWorker || 0) ));
    const employerTot = (salaryCalculation?.totaleContributiEmployer ?? ( (salaryCalculation?.inpsEmployer || 0) + (salaryCalculation?.inailEmployer || 0) + (salaryCalculation?.ffcEmployer || 0) ));

    const result = {
      salary: salaryCalculation,
      bonuses: bonusCalculation,
      total: {
        gross: (salaryCalculation?.grossSalary || 0) + bonusCalculation.totalGross,
        net: (salaryCalculation?.netSalary || 0) + bonusCalculation.totalNet,
        taxes: workerTot + bonusCalculation.totalTax,
        employerContributions: employerTot,
        companyCost: (salaryCalculation?.companyCost || ((salaryCalculation?.grossSalary || 0) + employerTot)) + bonusCalculation.totalGross // costo lordo + bonus
      }
    };

    console.log('🟪 [FE] calculateUnified summary:', result);
    return result;
  }, [calculateSalaryFromNet, calculateSalaryFromGross, calculateAllBonuses]);

  useEffect(() => {
    console.log('🔵 useEffect hook triggered con parametri:', { teamId, contractYear, contractType });
    // Chiama fetchAllTaxRates solo se tutti i parametri sono disponibili
    if (teamId && contractYear && contractType) {
      console.log('🟢 Tutti i parametri presenti, chiamando fetchAllTaxRates');
      fetchAllTaxRates();
    } else {
      console.log('🔴 Parametri mancanti, non recupero aliquote:', { 
        teamId: !!teamId, 
        contractYear: !!contractYear, 
        contractType: !!contractType 
      });
    }
  }, [teamId, contractYear, contractType, fetchAllTaxRates]);

  return {
    // Stato
    taxRates,
    bonusTaxRates,
    loading,
    calculating,
    error,
    
    // Funzioni di calcolo
    calculateSalaryFromNet,
    calculateSalaryFromGross,
    calculateBonusTax,
    calculateBonusFromNet,
    calculateAllBonuses,
    calculateUnified,
    
    // Funzioni di utilità
    refreshRates: fetchAllTaxRates
  };
};
