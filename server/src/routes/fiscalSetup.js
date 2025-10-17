// server/src/routes/fiscalSetup.js
const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

/**
 * GET /api/fiscal-setup/status
 * Ritorna lo stato di completamento della configurazione fiscale
 */
router.get('/status', async (req, res) => {
  try {
    const { teamId, year, contractType, region, municipality } = req.query;
    
    if (!teamId || !year || !contractType) {
      return res.status(400).json({ 
        error: 'Missing required parameters: teamId, year, contractType' 
      });
    }

    const yearInt = parseInt(year);

    // Check rates
    const rates = await prisma.tax_rate_v2.findFirst({
      where: { teamId, year: yearInt, contractType }
    });

    // Check contributions
    const contribProfile = await prisma.tax_contribution_profile.findFirst({
      where: { teamId, year: yearInt, contractType }
    });

    // Check IRPEF
    const irpef = await prisma.tax_irpef_bracket.findFirst({
      where: { teamId, year: yearInt }
    });

    // Check detractions
    const detractions = await prisma.tax_config.findFirst({
      where: { teamId, year: yearInt }
    });

    // Check regional
    const regional = region ? await prisma.tax_regional_additional.findFirst({
      where: { teamId, year: yearInt, region }
    }) : null;

    // Check municipal
    const municipal = (region && municipality) ? await prisma.tax_municipal_additional.findFirst({
      where: { teamId, year: yearInt, region, municipality }
    }) : null;

    // Check L207
    const l207 = await prisma.tax_bonus_l207_band.findFirst({
      where: { teamId, year: yearInt }
    });

    res.json({
      rates: !!rates,
      contributions: !!contribProfile,
      irpef: !!irpef,
      detractions: !!detractions,
      regional: region ? !!regional : null,
      municipal: (region && municipality) ? !!municipal : null,
      l207: !!l207
    });
  } catch (error) {
    console.error('Error in /status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fiscal-setup/step/rates
 * Salva le aliquote base (worker/employer)
 */
router.post('/step/rates', async (req, res) => {
  try {
    const { teamId, year, contractType, rates } = req.body;
    
    if (!teamId || !year || !contractType || !rates) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const yearInt = parseInt(year);

    const data = {
      teamId,
      year: yearInt,
      contractType,
      inpsWorkerPct: rates.inpsWorkerPct || 0,
      ffcWorkerPct: rates.ffcWorkerPct || 0,
      solidarityWorkerPct: rates.solidarityWorkerPct || 0,
      inpsEmployerPct: rates.inpsEmployerPct || 0,
      ffcEmployerPct: rates.ffcEmployerPct || 0,
      inailEmployerPct: rates.inailEmployerPct || 0,
      solidarityEmployerPct: rates.solidarityEmployerPct || 0,
      fondoRatePct: rates.fondoRatePct || 0.5
    };

    const result = await prisma.tax_rate_v2.upsert({
      where: {
        teamId_year_contractType: { teamId, year: yearInt, contractType }
      },
      update: data,
      create: data
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in /step/rates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/fiscal-setup/step/rates
 * Legge le aliquote base salvate
 */
router.get('/step/rates', async (req, res) => {
  try {
    const { teamId, year, contractType } = req.query || {};
    if (!teamId || !year || !contractType) return res.status(400).json({ error: 'Missing required parameters' });
    const found = await prisma.tax_rate_v2.findFirst({ where: { teamId, year: parseInt(year), contractType } });
    res.json({ success: true, data: found || null });
  } catch (error) {
    console.error('Error in GET /step/rates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fiscal-setup/step/contributions
 * Salva il profilo contributi (mode + points/brackets)
 */
router.post('/step/contributions', async (req, res) => {
  try {
    const { teamId, year, contractType, mode, points, brackets } = req.body;
    
    if (!teamId || !year || !contractType || !mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const yearInt = parseInt(year);

    // Salva il profilo
    await prisma.tax_contribution_profile.upsert({
      where: {
        teamId_year_contractType: { teamId, year: yearInt, contractType }
      },
      update: { mode },
      create: { teamId, year: yearInt, contractType, mode }
    });

    // Cancella vecchi dati
    await prisma.tax_contribution_point.deleteMany({
      where: { teamId, year: yearInt, contractType }
    });
    await prisma.tax_contribution_bracket.deleteMany({
      where: { teamId, year: yearInt, contractType }
    });

    // Salva nuovi dati
    if (mode === 'LOOKUP' && points && points.length > 0) {
      await prisma.tax_contribution_point.createMany({
        data: points.map(p => ({
          teamId,
          year: yearInt,
          contractType,
          gross: p.gross,
          contrib: p.contrib
        }))
      });
    } else if (mode === 'PIECEWISE' && brackets && brackets.length > 0) {
      await prisma.tax_contribution_bracket.createMany({
        data: brackets.map(b => ({
          teamId,
          year: yearInt,
          contractType,
          from_amount: b.from_amount,
          to_amount: b.to_amount,
          rate: b.rate,
          fixed: b.fixed || 0
        }))
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in /step/contributions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/fiscal-setup/step/contributions
 */
router.get('/step/contributions', async (req, res) => {
  try {
    const { teamId, year, contractType } = req.query || {};
    if (!teamId || !year || !contractType) return res.status(400).json({ error: 'Missing required parameters' });
    const yearInt = parseInt(year);
    const profile = await prisma.tax_contribution_profile.findFirst({ where: { teamId, year: yearInt, contractType } });
    const mode = profile?.mode || null;
    const points = await prisma.tax_contribution_point.findMany({ where: { teamId, year: yearInt, contractType }, orderBy: { gross: 'asc' } });
    const brackets = await prisma.tax_contribution_bracket.findMany({ where: { teamId, year: yearInt, contractType }, orderBy: { from_amount: 'asc' } });
    res.json({ success: true, data: { mode, points, brackets } });
  } catch (error) {
    console.error('Error in GET /step/contributions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fiscal-setup/step/irpef
 * Salva gli scaglioni IRPEF
 */
router.post('/step/irpef', async (req, res) => {
  try {
    const { teamId, year, brackets } = req.body;
    
    if (!teamId || !year || !brackets || !Array.isArray(brackets)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const yearInt = parseInt(year);

    // Cancella vecchi scaglioni
    await prisma.tax_irpef_bracket.deleteMany({
      where: { teamId, year: yearInt }
    });

    // Crea nuovi scaglioni
    if (brackets.length > 0) {
      await prisma.tax_irpef_bracket.createMany({
        data: brackets.map(b => ({
          teamId,
          year: yearInt,
          min: b.min,
          max: b.max,
          rate: b.rate
        }))
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in /step/irpef:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/fiscal-setup/step/irpef
 */
router.get('/step/irpef', async (req, res) => {
  try {
    const { teamId, year } = req.query || {};
    if (!teamId || !year) return res.status(400).json({ error: 'Missing required parameters' });
    const brackets = await prisma.tax_irpef_bracket.findMany({ where: { teamId, year: parseInt(year) }, orderBy: { min: 'asc' } });
    res.json({ success: true, data: brackets });
  } catch (error) {
    console.error('Error in GET /step/irpef:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fiscal-setup/step/detractions
 * Salva le detrazioni Art. 13 (tax_config)
 */
router.post('/step/detractions', async (req, res) => {
  try {
    const { 
      teamId, 
      year, 
      detrazioneFascia1,
      detrazioneMinimo,
      detrazioneFascia2,
      detrazioneFascia2Max,
      detrazioneFascia3,
      contributionrate,
      solidarityrate
    } = req.body;
    
    if (!teamId || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const yearInt = parseInt(year);

    // Leggi eventuale record esistente (per preservare valori non inviati)
    const existing = await prisma.tax_config.findFirst({ where: { teamId, year: yearInt } });

    const safeNumber = (v, fallback) => {
      const n = v === '' || v === null || v === undefined ? NaN : Number(String(v).replace(',', '.'));
      return Number.isFinite(n) ? n : fallback;
    };

    const data = {
      teamId,
      year: yearInt,
      // campi obbligatori nello schema
      contributionrate: safeNumber(contributionrate, existing?.contributionrate ?? 0),
      solidarityrate: safeNumber(solidarityrate, existing?.solidarityrate ?? 0),
      // fasce art.13
      detrazioneFascia1: safeNumber(detrazioneFascia1, existing?.detrazioneFascia1 ?? 1955),
      detrazioneMinimo: safeNumber(detrazioneMinimo, existing?.detrazioneMinimo ?? 690),
      detrazioneFascia2: safeNumber(detrazioneFascia2, existing?.detrazioneFascia2 ?? 1910),
      detrazioneFascia2Max: safeNumber(detrazioneFascia2Max, existing?.detrazioneFascia2Max ?? 1190),
      detrazioneFascia3: safeNumber(detrazioneFascia3, existing?.detrazioneFascia3 ?? 1910)
    };

    let result;
    if (existing) {
      result = await prisma.tax_config.update({ where: { id: existing.id }, data });
    } else {
      result = await prisma.tax_config.create({ data });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in /step/detractions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/fiscal-setup/step/detractions
 */
router.get('/step/detractions', async (req, res) => {
  try {
    const { teamId, year } = req.query || {};
    if (!teamId || !year) return res.status(400).json({ error: 'Missing required parameters' });
    const found = await prisma.tax_config.findFirst({ where: { teamId, year: parseInt(year) } });
    res.json({ success: true, data: found || null });
  } catch (error) {
    console.error('Error in GET /step/detractions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fiscal-setup/step/regional
 * Salva addizionale regionale
 */
router.post('/step/regional', async (req, res) => {
  try {
    const { teamId, year, region, is_progressive, flat_rate, brackets } = req.body;
    
    if (!teamId || !year || !region) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const yearInt = parseInt(year);

    // Salva configurazione
    await prisma.tax_regional_additional.upsert({
      where: {
        teamId_year_region: { teamId, year: yearInt, region }
      },
      update: {
        is_progressive: !!is_progressive,
        flat_rate: flat_rate || null
      },
      create: {
        teamId,
        year: yearInt,
        region,
        is_progressive: !!is_progressive,
        flat_rate: flat_rate || null
      }
    });

    // Cancella vecchi scaglioni
    await prisma.tax_regional_additional_bracket_v2.deleteMany({
      where: { teamId, year: yearInt, region }
    });

    // Se progressiva, crea scaglioni
    if (is_progressive && brackets && brackets.length > 0) {
      await prisma.tax_regional_additional_bracket_v2.createMany({
        data: brackets.map(b => ({
          teamId,
          year: yearInt,
          region,
          min: b.min,
          max: b.max,
          rate: b.rate
        }))
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in /step/regional:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/step/regional', async (req, res) => {
  try {
    const { teamId, year, region } = req.query || {};
    if (!teamId || !year || !region) return res.status(400).json({ error: 'Missing required parameters' });
    const yearInt = parseInt(year);
    const cfg = await prisma.tax_regional_additional.findFirst({ where: { teamId, year: yearInt, region } });
    const brackets = await prisma.tax_regional_additional_bracket_v2.findMany({ where: { teamId, year: yearInt, region }, orderBy: { min: 'asc' } });
    res.json({ success: true, data: { config: cfg || null, brackets } });
  } catch (error) {
    console.error('Error in GET /step/regional:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fiscal-setup/step/municipal
 * Salva addizionale comunale
 */
router.post('/step/municipal', async (req, res) => {
  try {
    const { teamId, year, region, municipality, is_progressive, flat_rate, brackets } = req.body;
    
    if (!teamId || !year || !region || !municipality) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const yearInt = parseInt(year);

    // Salva configurazione
    await prisma.tax_municipal_additional.upsert({
      where: {
        teamId_year_region_municipality: { teamId, year: yearInt, region, municipality }
      },
      update: {
        is_progressive: !!is_progressive,
        flat_rate: flat_rate || null
      },
      create: {
        teamId,
        year: yearInt,
        region,
        municipality,
        is_progressive: !!is_progressive,
        flat_rate: flat_rate || null
      }
    });

    // Cancella vecchi scaglioni
    await prisma.tax_municipal_additional_bracket_v2.deleteMany({
      where: { teamId, year: yearInt, region, municipality }
    });

    // Se progressiva, crea scaglioni
    if (is_progressive && brackets && brackets.length > 0) {
      await prisma.tax_municipal_additional_bracket_v2.createMany({
        data: brackets.map(b => ({
          teamId,
          year: yearInt,
          region,
          municipality,
          min: b.min,
          max: b.max,
          rate: b.rate
        }))
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in /step/municipal:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/step/municipal', async (req, res) => {
  try {
    const { teamId, year, region, municipality } = req.query || {};
    if (!teamId || !year || !region || !municipality) return res.status(400).json({ error: 'Missing required parameters' });
    const yearInt = parseInt(year);
    const cfg = await prisma.tax_municipal_additional.findFirst({ where: { teamId, year: yearInt, region, municipality } });
    const brackets = await prisma.tax_municipal_additional_bracket_v2.findMany({ where: { teamId, year: yearInt, region, municipality }, orderBy: { min: 'asc' } });
    res.json({ success: true, data: { config: cfg || null, brackets } });
  } catch (error) {
    console.error('Error in GET /step/municipal:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fiscal-setup/step/l207
 * Salva bande L.207 + ulteriore detrazione
 */
router.post('/step/l207', async (req, res) => {
  try {
    const { teamId, year, bands, extraDeduction } = req.body;
    
    if (!teamId || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const yearInt = parseInt(year);

    // Cancella vecchie bande
    await prisma.tax_bonus_l207_band.deleteMany({ where: { teamId, year: yearInt } });

    // Normalizza e crea nuove bande (solo quelle valide)
    const toNumber = (v) => {
      if (v === null || v === undefined || v === '') return NaN;
      const n = typeof v === 'string' ? v.replace(',', '.') : v;
      return Number(n);
    };

    const cleanBands = Array.isArray(bands)
      ? bands
          .map(b => ({
            max_amount: toNumber(b.max_amount),
            pct: toNumber(b.pct)
          }))
          .filter(b => Number.isFinite(b.max_amount) && Number.isFinite(b.pct))
      : [];

    if (cleanBands.length > 0) {
      await prisma.tax_bonus_l207_band.createMany({
        data: cleanBands.map(b => ({ teamId, year: yearInt, max_amount: b.max_amount, pct: b.pct }))
      });
    }

    // Ulteriore detrazione (se valori validi), altrimenti elimina
    const fullN = extraDeduction ? toNumber(extraDeduction.full) : NaN;
    const fullToN = extraDeduction ? toNumber(extraDeduction.full_to) : NaN;
    const fadeToN = extraDeduction ? toNumber(extraDeduction.fade_to) : NaN;

    if (Number.isFinite(fullN) && Number.isFinite(fullToN) && Number.isFinite(fadeToN)) {
      await prisma.tax_extra_deduction_l207.upsert({
        where: { teamId_year: { teamId, year: yearInt } },
        update: { fullAmount: fullN, fullTo: fullToN, fadeTo: fadeToN },
        create: { teamId, year: yearInt, fullAmount: fullN, fullTo: fullToN, fadeTo: fadeToN }
      });
    } else {
      await prisma.tax_extra_deduction_l207.deleteMany({ where: { teamId, year: yearInt } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in /step/l207:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fiscal-setup/copy-from-year
 * Duplica configurazione da un anno all'altro
 */
router.post('/copy-from-year', async (req, res) => {
  try {
    const { teamId, fromYear, toYear, contractType } = req.body;
    
    if (!teamId || !fromYear || !toYear || !contractType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fromYearInt = parseInt(fromYear);
    const toYearInt = parseInt(toYear);

    // Copia rates
    const rates = await prisma.tax_rate_v2.findFirst({
      where: { teamId, year: fromYearInt, contractType }
    });
    if (rates) {
      const { id, createdAt, updatedAt, ...ratesData } = rates;
      await prisma.tax_rate_v2.upsert({
        where: {
          teamId_year_contractType: { teamId, year: toYearInt, contractType }
        },
        update: { ...ratesData, year: toYearInt },
        create: { ...ratesData, year: toYearInt }
      });
    }

    // Copia contribution profile
    const profile = await prisma.tax_contribution_profile.findFirst({
      where: { teamId, year: fromYearInt, contractType }
    });
    if (profile) {
      const { id, createdAt, updatedAt, ...profileData } = profile;
      await prisma.tax_contribution_profile.upsert({
        where: {
          teamId_year_contractType: { teamId, year: toYearInt, contractType }
        },
        update: { ...profileData, year: toYearInt },
        create: { ...profileData, year: toYearInt }
      });
    }

    // Copia IRPEF brackets
    const irpefBrackets = await prisma.tax_irpef_bracket.findMany({
      where: { teamId, year: fromYearInt }
    });
    if (irpefBrackets.length > 0) {
      await prisma.tax_irpef_bracket.deleteMany({
        where: { teamId, year: toYearInt }
      });
      await prisma.tax_irpef_bracket.createMany({
        data: irpefBrackets.map(({ id, createdAt, ...b }) => ({ ...b, year: toYearInt }))
      });
    }

    res.json({ success: true, message: `Copied fiscal setup from ${fromYear} to ${toYear}` });
  } catch (error) {
    console.error('Error in /copy-from-year:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fiscal-setup/year
 * Crea un nuovo anno "vuoto" (opzionale: crea solo un record scenario placeholder)
 * Body: { teamId, year }
 */
router.post('/year', async (req, res) => {
  try {
    const { teamId, year } = req.body || {};
    if (!teamId || !year) return res.status(400).json({ error: 'Missing required fields: teamId, year' });
    const yearInt = parseInt(year);
    // Crea uno scenario placeholder se non esiste nulla per quell'anno
    const existingAny = await prisma.fiscal_scenario.findFirst({ where: { teamId, year: yearInt } });
    if (!existingAny) {
      await prisma.fiscal_scenario.create({
        data: {
          teamId,
          year: yearInt,
          contractType: null,
          region: null,
          municipality: null,
          name: `${yearInt} • Vuoto`,
          isDefault: false
        }
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /year:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/fiscal-setup/year
 * Elimina TUTTE le configurazioni fiscali per un anno del team (operazione distruttiva)
 * Query: teamId, year
 */
router.delete('/year', async (req, res) => {
  try {
    const { teamId, year } = req.query || {};
    if (!teamId || !year) return res.status(400).json({ error: 'Missing required parameters: teamId, year' });
    const yearInt = parseInt(year);

    // Elimina scenari espliciti
    await prisma.fiscal_scenario.deleteMany({ where: { teamId, year: yearInt } });
    // Elimina dati V2 e legacy collegati all'anno
    await prisma.tax_rate_v2.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_contribution_point.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_contribution_bracket.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_contribution_profile.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_irpef_bracket.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_config.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_regional_additional_bracket_v2.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_regional_additional.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_municipal_additional_bracket_v2.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_municipal_additional.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_bonus_l207_band.deleteMany({ where: { teamId, year: yearInt } });
    await prisma.tax_extra_deduction_l207.deleteMany({ where: { teamId, year: yearInt } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /year:', error);
    res.status(500).json({ error: error.message });
  }
});
// ==============================
// SCENARIOS - EXPLICIT METADATA
// ==============================

async function computeScenarioStatus({ teamId, year, contractType, region, municipality }) {
  const yearInt = parseInt(year);
  // Reuse same checks as /status
  const rates = contractType ? await prisma.tax_rate_v2.findFirst({ where: { teamId, year: yearInt, contractType } }) : null;
  const contribProfile = contractType ? await prisma.tax_contribution_profile.findFirst({ where: { teamId, year: yearInt, contractType } }) : null;
  const irpef = await prisma.tax_irpef_bracket.findFirst({ where: { teamId, year: yearInt } });
  const detractions = await prisma.tax_config.findFirst({ where: { teamId, year: yearInt } });
  const regional = region ? await prisma.tax_regional_additional.findFirst({ where: { teamId, year: yearInt, region } }) : null;
  const municipal = (region && municipality) ? await prisma.tax_municipal_additional.findFirst({ where: { teamId, year: yearInt, region, municipality } }) : null;
  const l207 = await prisma.tax_bonus_l207_band.findFirst({ where: { teamId, year: yearInt } });
  return {
    rates: !!rates,
    contributions: !!contribProfile,
    irpef: !!irpef,
    detractions: !!detractions,
    regional: region ? !!regional : null,
    municipal: (region && municipality) ? !!municipal : null,
    l207: !!l207
  };
}

/**
 * GET /api/fiscal-setup/scenarios
 * Lista scenari espliciti (tabella fiscal_scenarios) con completezza
 */
router.get('/scenarios', async (req, res) => {
  try {
    const { teamId, year } = req.query;
    if (!teamId) return res.status(400).json({ error: 'Missing required parameter: teamId' });
    const where = { teamId, ...(year ? { year: parseInt(year) } : {}) };
    const items = await prisma.fiscal_scenario.findMany({
      where,
      orderBy: [{ createdAt: 'asc' }]
    });
    const enriched = await Promise.all(items.map(async (s) => {
      const status = await computeScenarioStatus({ teamId: s.teamId, year: s.year, contractType: s.contractType || undefined, region: s.region || undefined, municipality: s.municipality || undefined });
      return { ...s, status };
    }));
    res.json(enriched);
  } catch (error) {
    console.error('Error in GET /scenarios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/fiscal-setup/scenarios
 * Crea scenario esplicito
 */
router.post('/scenarios', async (req, res) => {
  try {
    const { teamId, year, contractType, region, municipality, name, isDefault } = req.body || {};
    if (!teamId || !year || !name) return res.status(400).json({ error: 'Missing required fields: teamId, year, name' });
    const data = {
      teamId,
      year: parseInt(year),
      contractType: contractType || null,
      region: region || null,
      municipality: municipality || null,
      name,
      isDefault: !!isDefault
    };
    const created = await prisma.fiscal_scenario.upsert({
      where: { id: '00000000-0000-0000-0000-000000000000' },
      update: {},
      create: data
    }).catch(async () => {
      // Fallback safe-upsert per compatibilità con nomi vincoli univoci
      const existing = await prisma.fiscal_scenario.findFirst({
        where: { teamId: data.teamId, year: data.year, contractType: data.contractType, region: data.region, municipality: data.municipality }
      });
      if (existing) {
        return prisma.fiscal_scenario.update({ where: { id: existing.id }, data: { name: data.name, isDefault: data.isDefault } });
      }
      return prisma.fiscal_scenario.create({ data });
    });
    const status = await computeScenarioStatus({ teamId: created.teamId, year: created.year, contractType: created.contractType || undefined, region: created.region || undefined, municipality: created.municipality || undefined });
    res.json({ success: true, data: { ...created, status } });
  } catch (error) {
    console.error('Error in POST /scenarios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/fiscal-setup/scenarios/:id
 * Aggiorna nome o flag default
 */
router.patch('/scenarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isDefault } = req.body || {};
    const updated = await prisma.fiscal_scenario.update({ where: { id }, data: { ...(name != null ? { name } : {}), ...(isDefault != null ? { isDefault: !!isDefault } : {}) } });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in PATCH /scenarios/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/fiscal-setup/scenarios/:id
 */
router.delete('/scenarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fiscal_scenario.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /scenarios/:id:', error);
    res.status(500).json({ error: error.message });
  }
});
/**
 * GET /api/fiscal-setup/scenarios
 * Ritorna tutti gli scenari configurati per teamId e year
 */
router.get('/scenarios', async (req, res) => {
  try {
    const { teamId, year } = req.query;
    
    if (!teamId || !year) {
      return res.status(400).json({ 
        error: 'Missing required parameters: teamId, year' 
      });
    }

    const yearInt = parseInt(year);

    // Trova tutte le combinazioni uniche di contractType + region + municipality
    // che hanno almeno una configurazione salvata
    const scenarios = [];

    // 1. Scenari con aliquote configurate
    const ratesScenarios = await prisma.tax_rate_v2.findMany({
      where: { teamId, year: yearInt },
      select: { contractType: true }
    });

    // 2. Scenari con addizionali regionali
    const regionalScenarios = await prisma.tax_regional_additional.findMany({
      where: { teamId, year: yearInt },
      select: { region: true }
    });

    // 3. Scenari con addizionali comunali
    const municipalScenarios = await prisma.tax_municipal_additional.findMany({
      where: { teamId, year: yearInt },
      select: { region: true, municipality: true }
    });

    // Combina tutti gli scenari unici
    const scenarioMap = new Map();

    // Aggiungi scenari da aliquote (solo contractType)
    ratesScenarios.forEach(rate => {
      const key = `${rate.contractType}|||`;
      if (!scenarioMap.has(key)) {
        scenarioMap.set(key, {
          id: key,
          contractType: rate.contractType,
          region: null,
          municipality: null,
          hasRates: true,
          hasRegional: false,
          hasMunicipal: false
        });
      } else {
        scenarioMap.get(key).hasRates = true;
      }
    });

    // Aggiungi scenari da addizionali regionali
    regionalScenarios.forEach(regional => {
      const key = `|||${regional.region}||`;
      if (!scenarioMap.has(key)) {
        scenarioMap.set(key, {
          id: key,
          contractType: null,
          region: regional.region,
          municipality: null,
          hasRates: false,
          hasRegional: true,
          hasMunicipal: false
        });
      } else {
        scenarioMap.get(key).hasRegional = true;
      }
    });

    // Aggiungi scenari da addizionali comunali
    municipalScenarios.forEach(municipal => {
      const key = `|||${municipal.region}|${municipal.municipality}`;
      if (!scenarioMap.has(key)) {
        scenarioMap.set(key, {
          id: key,
          contractType: null,
          region: municipal.region,
          municipality: municipal.municipality,
          hasRates: false,
          hasRegional: false,
          hasMunicipal: true
        });
      } else {
        scenarioMap.get(key).hasMunicipal = true;
      }
    });

    // Converti in array e genera ID più leggibili
    const scenariosArray = Array.from(scenarioMap.values()).map((scenario, index) => ({
      ...scenario,
      id: `scenario_${index + 1}`,
      displayName: `${scenario.contractType || 'N/A'} - ${scenario.region || 'N/A'}/${scenario.municipality || 'N/A'}`
    }));

    res.json(scenariosArray);
  } catch (error) {
    console.error('Error in /scenarios:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

