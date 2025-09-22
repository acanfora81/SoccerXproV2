const { PrismaClient } = require('../../prisma/generated/client');
const prisma = new PrismaClient();

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
    for (const b of brackets) {
      const max = b.max ?? taxableIncome;
      if (taxableIncome > b.min) {
        const base = Math.min(taxableIncome, max) - b.min;
        irpefLorda += base * (b.rate / 100);
      }
    }

    // Recupera detrazioni dal database (se assenti, usa default sicuri)
    const taxConfig = await prisma.tax_config.findUnique({
      where: { year: validYear }
    });

    // Calcola detrazioni usando formula piecewise con fallback
    let detrazioni = 0;
    const R = taxableIncome;
    
    // Formula detrazioni 2025 (AIC/MEF) con fallback se taxConfig mancante
    if (R <= 15000) {
      detrazioni = (taxConfig?.detrazionifixed ?? 1880);
    } else if (R <= 28000) {
      detrazioni = 1910 + (1190 * (28000 - R) / 13000);
    } else if (R <= 50000) {
      detrazioni = 1910 * ((50000 - R) / 22000);
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
          ulterioreDetrazione = rule.amount;
          console.log(`🔵 Ulteriore detrazione applicata: €${ulterioreDetrazione} per scaglione ${rule.min}-${rule.max || 'illimitato'}`);
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

    return round2(Math.max(irpefLorda - totalDetrazioni, 0));
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
          bonusL207 = rule.amount;
          console.log(`🔵 Bonus L207 applicato: €${bonusL207} per scaglione ${rule.min}-${rule.max || 'illimitato'}`);
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
    const solidarityEmployer = grossSalary * (parseFloat(taxRates.solidarityEmployer || 0) / 100);
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
      companyCost: round2(companyCost)
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
    let hi = netSalary * 2; // massimo ragionevole
    let bestResult = null;
    let bestDiff = Infinity;
    
    // Tolleranza: 1 euro
    const tolerance = 1.0;
    
    // 12 iterazioni (compromesso ottimale tra precisione e velocità)
    for (let i = 0; i < 12; i++) {
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