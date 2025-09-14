import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook unificato per gestire TUTTI i calcoli fiscali
 * Gestisce stipendio, bonus e tutti i campi monetari in modo unificato
 */
export const useUnifiedFiscalCalculation = (teamId, contractYear, contractType) => {
  const [taxRates, setTaxRates] = useState(null);
  const [bonusTaxRates, setBonusTaxRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Recupera tutte le aliquote fiscali
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
      
      // Recupera aliquote stipendio
      const taxResponse = await axios.get(`/api/taxrates?teamId=${teamId}`);
      if (taxResponse.data.success) {
        console.log('🔵 TUTTE LE ALIQUOTE DISPONIBILI:', taxResponse.data.data);
        
        // Controllo sia valori inglesi che italiani per compatibility
        const contractTypeMapping = {
          'PROFESSIONAL': ['PROFESSIONAL', 'Professionista'],
          'APPRENTICESHIP': ['APPRENTICESHIP', 'Apprendistato'],
          'TRAINING_AGREEMENT': ['TRAINING_AGREEMENT', 'Accordo formativo'],
          'AMATEUR': ['AMATEUR', 'Dilettante'],
          'YOUTH': ['YOUTH', 'Giovanile'],
          'LOAN': ['LOAN', 'Prestito'],
          'PERMANENT': ['PERMANENT', 'Permanente'],
          'TRIAL': ['TRIAL', 'Prova']
        };
        
        // Cerca con entrambe le varianti (inglese e italiana)
        const possibleTypes = contractTypeMapping[contractType.toUpperCase()] || [contractType.toUpperCase()];
        
        const rate = taxResponse.data.data.find(r => {
          const yearMatch = r.year === parseInt(contractYear);
          const typeMatch = possibleTypes.includes(r.type);
          console.log('🔵 CONFRONTO ALIQUOTA:', { 
            rateYear: r.year, 
            rateType: r.type, 
            yearMatch, 
            typeMatch,
            possibleTypes,
            aliquota: r
          });
          return yearMatch && typeMatch;
        });
        
        console.log('🔵 RICERCA ALIQUOTE PER:', { 
          contractType, 
          possibleTypes, 
          year: contractYear, 
          yearType: typeof contractYear 
        });
        
        console.log('🔵 ALIQUOTE STIPENDIO:', rate ? 'TROVATE' : 'NON TROVATE', { contractType, possibleTypes, year: contractYear, rate });
        
        if (rate) {
          console.log('🔵 DETTAGLIO ALIQUOTA TROVATA:', {
            inps: rate.inps,
            inail: rate.inail,
            ffc: rate.ffc,
            inpsType: typeof rate.inps,
            inailType: typeof rate.inail,
            ffcType: typeof rate.ffc
          });
        }
        
        setTaxRates(rate || null);
      }

      // Recupera aliquote bonus
      console.log('🔵 Chiamando API bonus con URL:', `/api/bonustaxrates?teamId=${teamId}`);
      const bonusResponse = await axios.get(`/api/bonustaxrates?teamId=${teamId}`);
      console.log('🔵 RISPOSTA ALIQUOTE BONUS:', bonusResponse.data);
      
      if (bonusResponse.data.success) {
        console.log('🔵 TUTTE LE ALIQUOTE BONUS DISPONIBILI:', bonusResponse.data.data);
        
        const allRates = bonusResponse.data.data;
        const relevantRates = allRates.filter(rate => rate.year === contractYear);
        
        console.log('🔵 ALIQUOTE BONUS PER ANNO', contractYear, ':', relevantRates);
        
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
      setError('Errore nel recupero delle aliquote fiscali');
      setTaxRates(null);
      setBonusTaxRates(null);
    } finally {
      setLoading(false);
    }
  }, [teamId, contractYear, contractType]);

  // Calcola stipendio dal netto
  const calculateSalaryFromNet = useCallback((netSalary) => {
    if (!taxRates || !netSalary || netSalary <= 0) {
      return {
        netSalary: 0,
        inps: 0,
        inail: 0,
        ffc: 0,
        totalContributions: 0,
        grossSalary: 0
      };
    }

    // Le aliquote vengono dal database con nomi: inps, inail, ffc (non inpsRate, inailRate, ffcRate)
    const inpsRate = parseFloat(taxRates.inps) || 0;
    const inailRate = parseFloat(taxRates.inail) || 0;
    const ffcRate = parseFloat(taxRates.ffc) || 0;
    
    console.log('🔵 CONVERSIONE ALIQUOTE DAL NETTO:', {
      inpsRaw: taxRates.inps,
      inailRaw: taxRates.inail,
      ffcRaw: taxRates.ffc,
      inpsRate,
      inailRate,
      ffcRate
    });

    const inps = netSalary * (inpsRate / 100);
    const inail = netSalary * (inailRate / 100);
    const ffc = netSalary * (ffcRate / 100);
    const totalContributions = inps + inail + ffc;
    const grossSalary = netSalary + totalContributions;

    console.log('🔵 CALCOLO DAL NETTO:', {
      netSalary,
      inpsRate,
      inailRate,
      ffcRate,
      inps,
      inail,
      ffc,
      totalContributions,
      grossSalary
    });

    return {
      netSalary,
      inps,
      inail,
      ffc,
      totalContributions,
      grossSalary
    };
  }, [taxRates]);

  // Calcola stipendio dal lordo
  const calculateSalaryFromGross = useCallback((grossSalary) => {
    if (!taxRates || !grossSalary || grossSalary <= 0) {
      return {
        netSalary: 0,
        inps: 0,
        inail: 0,
        ffc: 0,
        totalContributions: 0,
        grossSalary: 0
      };
    }

    // Le aliquote vengono dal database con nomi: inps, inail, ffc (non inpsRate, inailRate, ffcRate)
    const inpsRate = parseFloat(taxRates.inps) || 0;
    const inailRate = parseFloat(taxRates.inail) || 0;
    const ffcRate = parseFloat(taxRates.ffc) || 0;
    
    console.log('🔵 CONVERSIONE ALIQUOTE DAL LORDO:', {
      inpsRaw: taxRates.inps,
      inailRaw: taxRates.inail,
      ffcRaw: taxRates.ffc,
      inpsRate,
      inailRate,
      ffcRate
    });

    // I contributi si calcolano sul LORDO, non sul netto
    const inps = grossSalary * (inpsRate / 100);
    const inail = grossSalary * (inailRate / 100);
    const ffc = grossSalary * (ffcRate / 100);
    const totalContributions = inps + inail + ffc;
    
    // Il netto è il lordo MENO i contributi
    const netSalary = grossSalary - totalContributions;

    console.log('🔵 CALCOLO DAL LORDO:', {
      grossSalary,
      inpsRate,
      inailRate,
      ffcRate,
      inps,
      inail,
      ffc,
      totalContributions,
      netSalary
    });

    return {
      netSalary,
      inps,
      inail,
      ffc,
      totalContributions,
      grossSalary
    };
  }, [taxRates]);

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
  const calculateUnified = useCallback((data) => {
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

    // Calcola stipendio
    let salaryCalculation = null;
    if (calculationMode === 'net' && netSalary > 0) {
      salaryCalculation = calculateSalaryFromNet(netSalary);
    } else if (calculationMode === 'gross' && salary > 0) {
      salaryCalculation = calculateSalaryFromGross(salary);
    }

    // Calcola bonus con aliquote personalizzate e modalità individuali
    const bonusCalculation = calculateAllBonuses(cleanBonusData, customTaxRates, bonusModes);
    
    console.log('🔵 calculateUnified risultato finale:', {
      salary: salaryCalculation,
      bonuses: bonusCalculation,
      inputData: { cleanBonusData, customTaxRates, bonusModes }
    });

    return {
      salary: salaryCalculation,
      bonuses: bonusCalculation,
      total: {
        gross: (salaryCalculation?.grossSalary || 0) + bonusCalculation.totalGross,
        net: (salaryCalculation?.netSalary || 0) + bonusCalculation.totalNet,
        taxes: (salaryCalculation?.totalContributions || 0) + bonusCalculation.totalTax
      }
    };
  }, [calculateSalaryFromNet, calculateSalaryFromGross, calculateAllBonuses]);

  useEffect(() => {
    console.log('🔵 useEffect hook triggered con parametri:', { teamId, contractYear, contractType });
    // Chiama fetchAllTaxRates solo se tutti i parametri sono disponibili
    if (teamId && contractYear && contractType) {
      console.log('🟢 Tutti i parametri presenti, chiamando fetchAllTaxRates');
      fetchAllTaxRates();
    } else {
      console.log('🔴 Parametri mancanti, non recupero aliquote');
    }
  }, [teamId, contractYear, contractType, fetchAllTaxRates]);

  return {
    // Stato
    taxRates,
    bonusTaxRates,
    loading,
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
