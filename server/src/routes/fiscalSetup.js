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

module.exports = router;

