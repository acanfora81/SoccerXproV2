const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();
const { computeFromLordoDynamic, computeFromNettoDynamic, detrazioneArt13Default } = require('../lib/tax/engine-dynamic');

// Helper: mappa righe Prisma → bracket engine (percento → decimale)
function toBrackets(rows) {
  return (rows || [])
    .sort((a, b) => Number(a.min) - Number(b.min))
    .map(r => ({
      from: Number(String(r.min).replace(',', '.')) || 0,
      to: (r.max == null || String(r.max).trim() === '') ? null : Number(String(r.max).replace(',', '.')),
      rate: (Number(String(r.rate).replace(',', '.')) || 0) / 100
    }));
}

function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/**
 * Calcolo IRPEF progressiva su imponibile - 100% DATABASE
 */
async function calcolaIrpef(taxableIncome, year, teamId = null) {
  try {
    const validYear = year || 2025;
    
    // Recupera scaglioni IRPEF dal database (tenant-scoped)
    const brackets = await prisma.tax_irpef_bracket.findMany({
      where: { year: validYear, teamId },
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
        // ✅ normalizza la rate anche se arriva come "23,0" o stringa
        const ratePct = parseFloat(String(b.rate).replace(',', '.'));
        const tassaScaglione = base * ((isNaN(ratePct) ? 0 : ratePct) / 100);
        irpefLorda += tassaScaglione;
        console.log(`🔵 Scaglione €${b.min}-${b.max || 'illimitato'} al ${ratePct}%: base €${base} = €${tassaScaglione}`);
      }
    }
    console.log(`🔵 IRPEF lorda totale: €${irpefLorda}`);

    // --- DETRAZIONI ART. 13 --- con fallback standard 2025 se tax_config è vuota
    const taxConfig = await prisma.tax_config.findFirst({
      where: { year: validYear, teamId }
    });

    const R = taxableIncome;
    let detrazioniBase = 0;

    if (!taxConfig) {
      detrazioniBase = detrazioneArt13Default(R);
      console.log(`🔵 Art.13 (fallback): €${detrazioniBase}`);
    } else {
      const parseNum = (v) => parseFloat(String(v ?? 0).replace(',', '.')) || 0;
      const detrazioneFascia1 = parseNum(taxConfig?.detrazioneFascia1);
      const detrazioneMinimo = parseNum(taxConfig?.detrazioneMinimo);
      const detrazioneFascia2 = parseNum(taxConfig?.detrazioneFascia2);
      const detrazioneFascia2Max = parseNum(taxConfig?.detrazioneFascia2Max);
      const detrazioneFascia3 = parseNum(taxConfig?.detrazioneFascia3);

      if (R <= 15000) {
        detrazioniBase = Math.max(detrazioneFascia1 * (R / 15000), detrazioneMinimo);
      } else if (R <= 28000) {
        detrazioniBase = detrazioneFascia2 + (detrazioneFascia2Max * (28000 - R)) / 13000;
      } else if (R <= 50000) {
        detrazioniBase = Math.max(detrazioneFascia3 * ((50000 - R) / 22000), 0);
      } else {
        detrazioniBase = 0;
      }
      console.log(`🔵 Art.13 (DB): €${detrazioniBase}`);
    }

    // ========================================
    // ULTERIORE DETRAZIONE A SCAGLIONI (override, non somma)
    // ========================================
    // --- "EXTRA" DETRAZIONI --- applica solo se flags richiede (OVERRIDE/ADD)
    let detrazioniFinali = detrazioniBase;
    try {
      const extraRules = await prisma.tax_extra_deduction_rule.findMany({
        where: { year: validYear, teamId },
        orderBy: { min: 'asc' }
      });

      const matchExtra = extraRules?.find((r) => R >= r.min && R < (r.max ?? Infinity));

      if (matchExtra) {
        let amount = parseFloat(String(matchExtra.amount).replace(',', '.')) || 0;
        let slope = parseFloat(String(matchExtra.slope).replace(',', '.')) || 0;
        const extraVal = amount + slope * (R - (matchExtra.min ?? 0));
        const flags = String(matchExtra.flags || '').toUpperCase();

        if (flags.includes('OVERRIDE')) {
          detrazioniFinali = extraVal;
        } else if (flags.includes('ADD')) {
          detrazioniFinali = detrazioniBase + extraVal;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Extra detrazioni non disponibili:`, error.message);
    }

    const totalDetrazioni = detrazioniFinali;
    console.log(`🔵 Detrazioni totali: €${totalDetrazioni} (base €${detrazioniBase}${detrazioniFinali !== detrazioniBase ? ` +/→ extra` : ''})`);
    
    const irpefFinale = Math.max(irpefLorda - totalDetrazioni, 0);
    console.log(`🔵 IRPEF finale: €${irpefLorda} - €${totalDetrazioni} = €${irpefFinale}`);

    return {
      lorda: round2(irpefLorda),
      detrazioni: round2(totalDetrazioni),
      netta: round2(irpefFinale)
    };
  } catch (error) {
    console.error('❌ Errore calcolo IRPEF:', error);
    throw new Error(`Errore calcolo IRPEF: ${error.message}`);
  }
}

/**
 * Calcolo Addizionali Regionali e Comunali - 100% DATABASE con scaglioni progressivi
 */
async function calcolaAddizionali(taxableIncome, year, region, municipality, teamId = null) {
  try {
    const validYear = year || 2025;
    let totale = 0;

    // Addizionale Regionale
    if (region) {
      const regionalScheme = await prisma.tax_regional_additional_scheme.findFirst({
        where: { 
          year: validYear, 
          region: region,
          is_default: true,
          teamId
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
              const ratePct = parseFloat(String(bracket.rate).replace(',', '.'));
              totale += base * ((isNaN(ratePct) ? 0 : ratePct) / 100);
            }
          }
        } else if (regionalScheme.flat_rate) {
          // Calcolo con tasso fisso
          const flatPct = parseFloat(String(regionalScheme.flat_rate).replace(',', '.'));
          totale += taxableIncome * ((isNaN(flatPct) ? 0 : flatPct) / 100);
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
          is_default: true,
          teamId
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
              const ratePct = parseFloat(String(bracket.rate).replace(',', '.'));
              totale += base * ((isNaN(ratePct) ? 0 : ratePct) / 100);
            }
          }
        } else if (municipalRule.flat_rate) {
          // Calcolo con tasso fisso
          const flatPct = parseFloat(String(municipalRule.flat_rate).replace(',', '.'));
          totale += taxableIncome * ((isNaN(flatPct) ? 0 : flatPct) / 100);
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
async function calcolaStipendioCompleto(grossSalary, taxRates, year, region = null, municipality = null, contractType = null, teamId = null) {
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
    const irpefBreak = await calcolaIrpef(taxableIncome, validYear, teamId);
    const addizionali = await calcolaAddizionali(taxableIncome, validYear, region, municipality, teamId);

    // ========================================
    // BONUS L.207/2019 (Regime sportivi) — DB-driven
    // ========================================

    // Calcola IRPEF con breakdown completo (lorda, detrazioni, netta)
    const irpefLorda = irpefBreak.lorda;
    const irpefDopoDetrazioni = Math.max(irpefLorda - irpefBreak.detrazioni, 0);

    let bonusL207 = 0;
    let irpefDopoL207 = 0;

    try {
      const rules = await prisma.tax_bonus_l207_rule.findMany({
        where: { year: validYear, teamId },
        orderBy: { min_income: 'asc' }
      });

      // Trova la regola corretta per reddito e contratto
      const now = new Date();
      const rule = rules.find(r => {
        const inRange = taxableIncome >= r.min_income && (r.max_income == null || taxableIncome < r.max_income);
        const okDate = (!r.valid_from || now >= r.valid_from) && (!r.valid_to || now <= r.valid_to);
        const okContract = !r.eligible_contract_types?.length || r.eligible_contract_types.includes(contractType || '');
        return inRange && okDate && okContract;
      });

      if (rule) {
        const perc = Math.max(0, Math.min(100, rule.bonus_percentage || 0));
        const mode = rule.mode || 'on_lorda';
        const cap = rule.cap_amount ?? null;

        // Determina la base dello sconto in base al "mode"
        let baseSconto = 0;
        switch (mode) {
          case 'on_netta':
            baseSconto = irpefDopoDetrazioni;
            break;
          case 'on_income':
            baseSconto = taxableIncome;
            break;
          case 'on_bonus_component':
            baseSconto = parseFloat(taxRates?.bonusAmount || 0);
            break;
          case 'on_lorda':
          default:
            baseSconto = irpefLorda;
            break;
        }

        let sconto = (baseSconto * perc) / 100;
        if (cap != null) sconto = Math.min(sconto, cap);
        bonusL207 = round2(sconto);

        // Applica lo sconto PRIMA delle detrazioni se mode='on_lorda'
        if (mode === 'on_lorda') {
          const irpefPostSconto = Math.max(irpefLorda - sconto, 0);
          irpefDopoL207 = Math.max(irpefPostSconto - irpefBreak.detrazioni, 0);
        } else {
          // Negli altri casi (on_netta, on_income, etc.) lo sconto agisce come detrazione diretta
          irpefDopoL207 = Math.max(irpefDopoDetrazioni - sconto, 0);
        }

        console.log(
          `🔵 Bonus L.207 applicato: mode=${mode}, ${perc}% su €${baseSconto.toFixed(2)} = sconto €${sconto.toFixed(2)} → IRPEF €${irpefDopoL207.toFixed(2)}`
        );
      } else {
        irpefDopoL207 = irpefDopoDetrazioni; // Nessuna regola trovata
      }
    } catch (error) {
      console.warn('⚠️ Bonus L.207: errore fetch/applicazione', error.message);
      irpefDopoL207 = irpefDopoDetrazioni;
    }

    // Ora aggiorna la variabile "irpef" usata nel resto del calcolo
    const irpef = round2(irpefDopoL207);
    const netSalary = round2(grossSalary - totaleContributiWorker - irpef - addizionali);

    // Calcolo contributi employer - 100% dal database
    const inpsEmployer = grossSalary * (parseFloat(taxRates.inpsEmployer) / 100);
    
    // ✅ INAIL Employer = 0 per contratti di apprendistato
    const inailEmployer = (contractType === 'APPRENTICESHIP') ? 0 : grossSalary * (parseFloat(taxRates.inailEmployer) / 100);
    
    const ffcEmployer = grossSalary * (parseFloat(taxRates.ffcEmployer) / 100);
    // 📝 Solidarity datore: usa valore DB se presente, altrimenti 0
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
      companyCost: round2(companyCost),
      _rawRates: {
        inpsWorker: parseFloat(taxRates.inpsWorker),
        ffcWorker: parseFloat(taxRates.ffcWorker),
        solidarityWorker: parseFloat(taxRates.solidarityWorker || 0),
        inpsEmployer: parseFloat(taxRates.inpsEmployer),
        inailEmployer: parseFloat(taxRates.inailEmployer || 0),
        ffcEmployer: parseFloat(taxRates.ffcEmployer),
        solidarityEmployer: parseFloat(taxRates.solidarityEmployer || 0)
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
async function calcolaLordoDaNetto(netSalary, taxRates, year, region = null, municipality = null, contractType = null, teamId = null) {
  try {
    const validYear = year || 2025;
    if (!taxRates) throw new Error('Aliquote fiscali mancanti');

    const safeRegion = region || 'Marche';
    const safeMunicipality = municipality || 'Pesaro';

    // Brackets IRPEF
    const irpefWhere = { year: validYear };
    if (teamId) irpefWhere.teamId = teamId;
    const irpefRows = await prisma.tax_irpef_bracket.findMany({
      where: irpefWhere,
      orderBy: { min: 'asc' }
    });

    // Addizionali DB (Marche/Pesaro oppure team defaults)
    const regWhereDefault = { year: validYear, region: safeRegion, is_default: true };
    if (teamId) regWhereDefault.teamId = teamId;
    let regionalScheme = await prisma.tax_regional_additional_scheme.findFirst({
      where: regWhereDefault,
      include: { tax_regional_additional_bracket: { orderBy: { min: 'asc' } } }
    });
    if (!regionalScheme) {
      regionalScheme = await prisma.tax_regional_additional_scheme.findFirst({
        where: { year: validYear, region: safeRegion },
        include: { tax_regional_additional_bracket: { orderBy: { min: 'asc' } } },
        orderBy: [{ is_default: 'desc' }]
      });
    }

    const munWhereDefault = { year: validYear, region: safeRegion, municipality: safeMunicipality, is_default: true };
    if (teamId) munWhereDefault.teamId = teamId;
    let municipalRule = await prisma.tax_municipal_additional_rule.findFirst({
      where: munWhereDefault,
      include: { tax_municipal_additional_bracket: { orderBy: { min: 'asc' } } }
    });
    if (!municipalRule) {
      municipalRule = await prisma.tax_municipal_additional_rule.findFirst({
        where: { year: validYear, region: safeRegion, municipality: safeMunicipality },
        include: { tax_municipal_additional_bracket: { orderBy: { min: 'asc' } } },
        orderBy: [{ is_default: 'desc' }]
      });
    }

    // === Detrazioni (DB-driven) per il solver netto→lordo ===
    const taxConfig = await prisma.tax_config.findFirst({ where: { year: validYear, ...(teamId ? { teamId } : {}) } });
    const extraRules = await prisma.tax_extra_deduction_rule.findMany({
      where: { year: validYear, ...(teamId ? { teamId } : {}) },
      orderBy: { min: 'asc' }
    });

    const parseNum = (v) => parseFloat(String(v ?? 0).replace(',', '.')) || 0;
  const detrazStdDb = (R) => {
      let detrazioniBase;
      if (!taxConfig) {
        // Usa la stessa formula standard del percorso lordo→netto per coerenza
        detrazioniBase = detrazioneArt13Default(R);
      } else {
        const detrazioneFascia1 = parseNum(taxConfig?.detrazioneFascia1);
        const detrazioneMinimo = parseNum(taxConfig?.detrazioneMinimo);
        const detrazioneFascia2 = parseNum(taxConfig?.detrazioneFascia2);
        const detrazioneFascia2Max = parseNum(taxConfig?.detrazioneFascia2Max);
        const detrazioneFascia3 = parseNum(taxConfig?.detrazioneFascia3);
        if (R <= 15000) {
          detrazioniBase = Math.max(detrazioneFascia1 * (R / 15000), detrazioneMinimo);
        } else if (R <= 28000) {
          detrazioniBase = detrazioneFascia2 + (detrazioneFascia2Max * (28000 - R)) / 13000;
        } else if (R <= 50000) {
          detrazioniBase = Math.max(detrazioneFascia3 * ((50000 - R) / 22000), 0);
        } else {
          detrazioniBase = 0;
        }
      }
      let detrazioniFinali = detrazioniBase;
      if (extraRules && extraRules.length) {
        const match = extraRules.find((r) => R >= parseNum(r.min) && R < (r.max == null ? Infinity : parseNum(r.max)));
        if (match) {
          const amount = parseNum(match.amount);
          const slope = parseNum(match.slope);
          const baseMin = parseNum(match.min);
          const extraVal = amount + slope * (R - baseMin);
          const flags = String(match.flags || '').toUpperCase();
          if (flags.includes('OVERRIDE')) detrazioniFinali = extraVal;
          else if (flags.includes('ADD')) detrazioniFinali = detrazioniBase + extraVal;
        }
      }
      return detrazioniFinali;
    };

    // Contributi lavoratore complessivi (INPS + FFC + Solidarietà)
    const workerRate = ((parseFloat(taxRates.inpsWorker) || 0) + (parseFloat(taxRates.ffcWorker) || 0) + (parseFloat(taxRates.solidarityWorker) || 0)) / 100;

    const params = {
      irpefBrackets: toBrackets(irpefRows),
      addRegionBrackets: toBrackets(regionalScheme?.tax_regional_additional_bracket || []),
      addCityBrackets: toBrackets(municipalRule?.tax_municipal_additional_bracket || []),
      l207Bands: [],
      detrazStd: detrazStdDb,
      detrazOverride: null,
      l207Full: 0,
      l207FullTo: 0,
      l207FadeTo: 0,
      contribMode: 'PIECEWISE',
      contribBrackets: [{ from: 0, to: null, rate: workerRate }],
      fondoRate: 0
    };

    const dyn = computeFromNettoDynamic(netSalary, params);

    // Contributi datore
    const inpsEmployerRate = (parseFloat(taxRates.inpsEmployer) || 0) / 100;
    const inailEmployerRate = (parseFloat(taxRates.inailEmployer) || 0) / 100;
    const ffcEmployerRate = (parseFloat(taxRates.ffcEmployer) || 0) / 100;
    const solidarityEmployerRate = (parseFloat(taxRates.solidarityEmployer) || 0) / 100;

    // dyn.lordo è già il lordo contrattuale restituito dal motore dinamico
    const workerRateSum = ((parseFloat(taxRates.inpsWorker) || 0) + (parseFloat(taxRates.ffcWorker) || 0) + (parseFloat(taxRates.solidarityWorker) || 0)) / 100;
    const trueGross = dyn.lordo;

    const inpsEmployer = Math.round(trueGross * inpsEmployerRate * 100) / 100;
    const inailEmployer = Math.round(trueGross * inailEmployerRate * 100) / 100;
    const ffcEmployer = Math.round(trueGross * ffcEmployerRate * 100) / 100;
    const solidarityEmployer = Math.round(trueGross * solidarityEmployerRate * 100) / 100;
    const totaleContributiEmployer = Math.round((inpsEmployer + inailEmployer + ffcEmployer + solidarityEmployer) * 100) / 100;
    const companyCost = Math.round((trueGross + totaleContributiEmployer) * 100) / 100;

    const inpsWRate = (parseFloat(taxRates.inpsWorker) || 0) / 100;
    const ffcWRate = (parseFloat(taxRates.ffcWorker) || 0) / 100;
    const solidWRate = (parseFloat(taxRates.solidarityWorker) || 0) / 100;
    const workerRateSum2 = inpsWRate + ffcWRate + solidWRate;

    const inpsWorkerVal = Math.round(dyn.lordo * inpsWRate * 100) / 100;
    const ffcWorkerVal = Math.round(dyn.lordo * ffcWRate * 100) / 100;
    const solidarityWorkerVal = Math.round(dyn.lordo * solidWRate * 100) / 100;
    const totaleContributiWorker = Math.round(dyn.lordo * workerRateSum2 * 100) / 100;

    return {
      grossSalary: Math.round(trueGross * 100) / 100,
      netSalary: Math.round(dyn.netto * 100) / 100,
      taxableIncome: Math.round(dyn.imponibile * 100) / 100,
      irpef: Math.round(dyn.irpefNet * 100) / 100,
      addizionali: Math.round(((dyn.addRegion || 0) + (dyn.addCity || 0)) * 100) / 100,
      bonusL207: 0,
      inpsWorker: inpsWorkerVal,
      ffcWorker: ffcWorkerVal,
      solidarityWorker: solidarityWorkerVal,
      totaleContributiWorker,
      inpsEmployer,
      inailEmployer,
      ffcEmployer,
      solidarityEmployer,
      totaleContributiEmployer: Math.round(totaleContributiEmployer * 100) / 100,
      companyCost: Math.round(companyCost * 100) / 100,
      _rawRates: {
        inpsWorker: parseFloat(taxRates.inpsWorker) || 0,
        ffcWorker: parseFloat(taxRates.ffcWorker) || 0,
        solidarityWorker: parseFloat(taxRates.solidarityWorker) || 0,
        inpsEmployer: parseFloat(taxRates.inpsEmployer) || 0,
        inailEmployer: parseFloat(taxRates.inailEmployer) || 0,
        ffcEmployer: parseFloat(taxRates.ffcEmployer) || 0,
        solidarityEmployer: parseFloat(taxRates.solidarityEmployer) || 0,
      }
    };
  } catch (error) {
    console.error('❌ Errore calcolo lordo da netto (engine):', error);
    throw new Error(`Errore calcolo lordo da netto: ${error.message}`);
  }
}

module.exports = { calcolaStipendioCompleto, calcolaLordoDaNetto, calcolaIrpef, calcolaAddizionali };