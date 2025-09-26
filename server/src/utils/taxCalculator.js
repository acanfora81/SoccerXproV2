const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/**
 * Calcolo IRPEF progressiva su imponibile - 100% DATABASE
 */
async function calcolaIrpef(taxableIncome, year) {
  try {
    const validYear = year || 2025;
    
    // Recupera scaglioni IRPEF dal database
    const brackets = await prisma.tax_irpef_bracket.findMany({
      where: { year: validYear },
      orderBy: { min: 'asc' }
    });

    if (brackets.length === 0) {
      throw new Error(`Nessuno scaglione IRPEF trovato per l'anno ${validYear}`);
    }

    let irpefLorda = 0;
    console.log(`🔵 Calcolo IRPEF per imponibile €${taxableIncome} con ${brackets.length} scaglioni`);
    for (const b of brackets) {
      const max = b.max ?? taxableIncome;
      if (taxableIncome > b.min) {
        const base = Math.min(taxableIncome, max) - b.min;
        const tassaScaglione = base * (b.rate / 100);
        irpefLorda += tassaScaglione;
        console.log(`🔵 Scaglione €${b.min}-${b.max || 'illimitato'} al ${b.rate}%: base €${base} = €${tassaScaglione}`);
      }
    }
    console.log(`🔵 IRPEF lorda totale: €${irpefLorda}`);

    // Recupera detrazioni dal database (se assenti, usa default sicuri)
    const taxConfig = await prisma.tax_config.findUnique({
      where: { year: validYear }
    });

    // Calcola detrazioni lavoro dipendente usando formula parametrica per fasce
    let detrazioni = 0;
    const R = taxableIncome;

    const detrazioneFascia1 = taxConfig?.detrazioneFascia1 ?? 1955; // base fascia 0–15k
    const detrazioneMinimo = taxConfig?.detrazioneMinimo ?? 690; // minimo garantito
    const detrazioneFascia2 = taxConfig?.detrazioneFascia2 ?? 1910; // base 15k–28k
    const detrazioneFascia2Max = taxConfig?.detrazioneFascia2Max ?? 1190; // quota aggiuntiva 15k–28k
    const detrazioneFascia3 = taxConfig?.detrazioneFascia3 ?? 1910; // base 28k–50k

    if (R <= 15000) {
      const base = detrazioneFascia1 * (R / 15000);
      detrazioni = Math.max(base, detrazioneMinimo);
      console.log(`🔵 Fascia 0-15k: base €${base}, minimo €${detrazioneMinimo} → €${detrazioni}`);
    } else if (R <= 28000) {
      detrazioni = detrazioneFascia2 + (detrazioneFascia2Max * (28000 - R)) / 13000;
      console.log(`🔵 Fascia 15k-28k: €${detrazioneFascia2} + €${(detrazioneFascia2Max * (28000 - R)) / 13000} → €${detrazioni}`);
    } else if (R <= 50000) {
      detrazioni = Math.max(detrazioneFascia3 * ((50000 - R) / 22000), 0);
      console.log(`🔵 Fascia 28k-50k: €${detrazioneFascia3} × ${((50000 - R) / 22000)} → €${detrazioni}`);
    } else {
      detrazioni = 0;
      console.log(`🔵 Fascia >50k: €${detrazioni}`);
    }

    // ========================================
    // ULTERIORE DETRAZIONE A SCAGLIONI
    // ========================================
    let ulterioreDetrazione = 0;
    try {
      // Recupera regole ulteriore detrazione dal database
      const extraRules = await prisma.tax_extra_deduction_rule.findMany({
        where: { year: validYear },
        orderBy: { min: 'asc' }
      });

      // Applica la regola corrispondente allo scaglione dell'imponibile
      for (const rule of extraRules) {
        const ruleMax = rule.max ?? Infinity;
        if (R >= rule.min && R < ruleMax) {
          // Calcolo con slope: amount + (slope × (reddito - min))
          const baseAmount = rule.amount;
          const slopeAmount = (rule.slope || 0) * (R - rule.min);
          ulterioreDetrazione = baseAmount + slopeAmount;
          console.log(`🔵 Ulteriore detrazione applicata: €${baseAmount} + (${rule.slope || 0} × ${R - rule.min}) = €${ulterioreDetrazione} per scaglione ${rule.min}-${rule.max || 'illimitato'}`);
          break;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Errore recupero ulteriore detrazione per anno ${validYear}:`, error.message);
      // Fallback: usa valore da tax_config se presente
      if (taxConfig?.ulterioredetrazionefixed) {
        ulterioreDetrazione = taxConfig.ulterioredetrazionefixed;
        console.log(`🔵 Ulteriore detrazione fallback da tax_config: €${ulterioreDetrazione}`);
      }
    }

    const totalDetrazioni = detrazioni + ulterioreDetrazione;
    console.log(`🔵 Detrazioni totali: base €${detrazioni} + ulteriore €${ulterioreDetrazione} = €${totalDetrazioni}`);
    
    const irpefFinale = Math.max(irpefLorda - totalDetrazioni, 0);
    console.log(`🔵 IRPEF finale: €${irpefLorda} - €${totalDetrazioni} = €${irpefFinale}`);

    return round2(irpefFinale);
  } catch (error) {
    console.error('❌ Errore calcolo IRPEF:', error);
    throw new Error(`Errore calcolo IRPEF: ${error.message}`);
  }
}

/**
 * Calcolo Addizionali Regionali e Comunali - 100% DATABASE con scaglioni progressivi
 */
async function calcolaAddizionali(taxableIncome, year, region, municipality) {
  try {
    const validYear = year || 2025;
    let totale = 0;

    // Addizionale Regionale
    if (region) {
      const regionalScheme = await prisma.tax_regional_additional_scheme.findFirst({
        where: { 
          year: validYear, 
          region: region,
          is_default: true 
        },
        include: { tax_regional_additional_bracket: { orderBy: { min: 'asc' } } }
      });

      if (regionalScheme) {
        if (regionalScheme.is_progressive && regionalScheme.tax_regional_additional_bracket.length > 0) {
          // Calcolo progressivo per scaglioni
          for (const bracket of regionalScheme.tax_regional_additional_bracket) {
            const max = bracket.max ?? taxableIncome;
            if (taxableIncome > bracket.min) {
              const base = Math.min(taxableIncome, max) - bracket.min;
              totale += base * (bracket.rate / 100);
            }
          }
        } else if (regionalScheme.flat_rate) {
          // Calcolo con tasso fisso
          totale += taxableIncome * (regionalScheme.flat_rate / 100);
        }
      }
    }

    // Addizionale Comunale
    if (municipality) {
      const municipalRule = await prisma.tax_municipal_additional_rule.findFirst({
        where: { 
          year: validYear, 
          region: region,
          municipality: municipality,
          is_default: true 
        },
        include: { tax_municipal_additional_bracket: { orderBy: { min: 'asc' } } }
      });

      if (municipalRule) {
        if (municipalRule.is_progressive && municipalRule.tax_municipal_additional_bracket.length > 0) {
          // Calcolo progressivo per scaglioni
          for (const bracket of municipalRule.tax_municipal_additional_bracket) {
            const max = bracket.max ?? taxableIncome;
            if (taxableIncome > bracket.min) {
              const base = Math.min(taxableIncome, max) - bracket.min;
              totale += base * (bracket.rate / 100);
            }
          }
        } else if (municipalRule.flat_rate) {
          // Calcolo con tasso fisso
          totale += taxableIncome * (municipalRule.flat_rate / 100);
        }
      }
    }

    return round2(totale);
  } catch (error) {
    console.error('❌ Errore calcolo addizionali:', error);
    throw new Error(`Errore calcolo addizionali: ${error.message}`);
  }
}

/**
 * Calcolo completo lordo → netto - 100% DATABASE
 */
async function calcolaStipendioCompleto(grossSalary, taxRates, year, region = null, municipality = null, contractType = null) {
  try {
    const validYear = year || 2025;
    
    // Validazione parametri obbligatori
    if (!taxRates) {
      throw new Error('Aliquote fiscali mancanti');
    }

    // Calcolo contributi worker - 100% dal database
    const inpsWorker = grossSalary * (parseFloat(taxRates.inpsWorker) / 100);
    const ffcWorker = grossSalary * (parseFloat(taxRates.ffcWorker) / 100);
    const solidarityWorker = grossSalary * (parseFloat(taxRates.solidarityWorker || 0) / 100);
    const totaleContributiWorker = inpsWorker + ffcWorker + solidarityWorker;

    const taxableIncome = grossSalary - totaleContributiWorker;
    
    // Calcoli fiscali - 100% dal database
    const irpef = await calcolaIrpef(taxableIncome, validYear);
    const addizionali = await calcolaAddizionali(taxableIncome, validYear, region, municipality);
    
    // ========================================
    // BONUS L207 A SCAGLIONI
    // ========================================
    let bonusL207 = 0;
    try {
      // Recupera regole bonus L207 dal database
      const bonusRules = await prisma.tax_bonus_l207_rule.findMany({
        where: { year: validYear },
        orderBy: { min: 'asc' }
      });

      // Applica la regola corrispondente allo scaglione dell'imponibile
      for (const rule of bonusRules) {
        const ruleMax = rule.max ?? Infinity;
        if (taxableIncome >= rule.min && taxableIncome < ruleMax) {
          // Calcolo con slope: amount + (slope × (reddito - min))
          const baseAmount = rule.amount;
          const slopeAmount = (rule.slope || 0) * (taxableIncome - rule.min);
          bonusL207 = baseAmount + slopeAmount;
          console.log(`🔵 Bonus L207 applicato: €${baseAmount} + (${rule.slope || 0} × ${taxableIncome - rule.min}) = €${bonusL207} per scaglione ${rule.min}-${rule.max || 'illimitato'}`);
          break;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Errore recupero bonus L207 per anno ${validYear}:`, error.message);
      // Fallback: usa valore da tax_config se presente
      if (taxConfig?.bonusl207fixed) {
        bonusL207 = taxConfig.bonusl207fixed;
        console.log(`🔵 Bonus L207 fallback da tax_config: €${bonusL207}`);
      }
    }

    const netSalary = grossSalary - totaleContributiWorker - irpef - addizionali + bonusL207;

    // Calcolo contributi employer - 100% dal database
    const inpsEmployer = grossSalary * (parseFloat(taxRates.inpsEmployer) / 100);
    
    // ✅ INAIL Employer = 0 per contratti di apprendistato
    const inailEmployer = (contractType === 'APPRENTICESHIP') ? 0 : grossSalary * (parseFloat(taxRates.inailEmployer) / 100);
    
    const ffcEmployer = grossSalary * (parseFloat(taxRates.ffcEmployer) / 100);
    // ❗ Fondo di solidarietà è solo a carico lavoratore: non applicare quota datore
    const solidarityEmployer = 0;
    const totaleContributiEmployer = inpsEmployer + inailEmployer + ffcEmployer + solidarityEmployer;

    const companyCost = grossSalary + totaleContributiEmployer;

    return {
      grossSalary: round2(grossSalary),
      netSalary: round2(netSalary),
      inpsWorker: round2(inpsWorker),
      ffcWorker: round2(ffcWorker),
      solidarityWorker: round2(solidarityWorker),
      totaleContributiWorker: round2(totaleContributiWorker),
      taxableIncome: round2(taxableIncome),
      irpef: round2(irpef),
      addizionali: round2(addizionali),
      bonusL207: round2(bonusL207),
      inpsEmployer: round2(inpsEmployer),
      inailEmployer: round2(inailEmployer),
      ffcEmployer: round2(ffcEmployer),
      solidarityEmployer: round2(solidarityEmployer),
      totaleContributiEmployer: round2(totaleContributiEmployer),
      companyCost: round2(companyCost),
      _rawRates: {
        inpsWorker: parseFloat(taxRates.inpsWorker),
        ffcWorker: parseFloat(taxRates.ffcWorker),
        solidarityWorker: parseFloat(taxRates.solidarityWorker || 0),
        inpsEmployer: parseFloat(taxRates.inpsEmployer),
        inailEmployer: parseFloat(taxRates.inailEmployer || 0),
        ffcEmployer: parseFloat(taxRates.ffcEmployer),
        solidarityEmployer: 0
      }
    };
  } catch (error) {
    console.error('❌ Errore calcolo stipendio completo:', error);
    throw new Error(`Errore calcolo stipendio: ${error.message}`);
  }
}

/**
 * Netto → Lordo con ricerca binaria per massima precisione - 100% DATABASE
 */
async function calcolaLordoDaNetto(netSalary, taxRates, year, region = null, municipality = null, contractType = null) {
  try {
    const validYear = year || 2025;
    
    // Validazione parametri obbligatori
    if (!taxRates) {
      throw new Error('Aliquote fiscali mancanti');
    }
    
    // Ricerca binaria per trovare il lordo esatto
    let lo = netSalary; // minimo possibile
    let hi = netSalary * 3; // massimo ragionevole aumentato per sicurezza
    let bestResult = null;
    let bestDiff = Infinity;
    
    // Tolleranza standard: 1 €
    const tolerance = 1.0;
    
           // 14 iterazioni per maggiore precisione
           for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      const result = await calcolaStipendioCompleto(mid, taxRates, validYear, region, municipality, contractType);
      
      const diff = Math.abs(result.netSalary - netSalary);
      
      if (diff < bestDiff) {
        bestDiff = diff;
        bestResult = result;
      }
      
      if (diff <= tolerance) {
        return result;
      }
      
      if (result.netSalary < netSalary) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    
    return bestResult;
  } catch (error) {
    console.error('❌ Errore calcolo lordo da netto:', error);
    throw new Error(`Errore calcolo lordo da netto: ${error.message}`);
  }
}

module.exports = { calcolaStipendioCompleto, calcolaLordoDaNetto };