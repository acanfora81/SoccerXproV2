// server/src/routes/taxes.js
const express = require('express');
const router = express.Router();
const { calcolaStipendioCompleto, calcolaLordoDaNetto } = require('../utils/taxCalculator');
const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

// New V2 imports
const { loadFiscalProfile } = require('../services/fiscalProfileLoader');
const engine = require('../lib/tax/engine-dynamic');

// Helper: load tax rates from DB by team/year/type
async function loadTaxRatesFromDb(teamId, year, contractType) {
  if (!teamId || !year || !contractType) return null;
  const normalizedType = String(contractType).toUpperCase();
  const found = await prisma.taxRate.findFirst({
    where: { teamId, year: parseInt(year), type: normalizedType }
  });
  if (!found) return null;
  return {
    inpsWorker: parseFloat(found.inpsWorker),
    inpsEmployer: parseFloat(found.inpsEmployer),
    ffcWorker: parseFloat(found.ffcWorker),
    ffcEmployer: parseFloat(found.ffcEmployer),
    inailEmployer: parseFloat(found.inailEmployer || 0),
    solidarityWorker: parseFloat(found.solidarityWorker || 0),
    solidarityEmployer: parseFloat(found.solidarityEmployer || 0)
  };
}

// ➕ Lordo → Netto
router.post('/net-from-gross', async (req, res) => {
  try {
    const { grossSalary, taxRates: clientTaxRates, year, region, municipality, contractType, teamId, opts } = req.body;
    console.log('🟦 [BE] /api/taxes/net-from-gross REQUEST:', { grossSalary, year, region, municipality, contractType, teamId, hasClientRates: !!clientTaxRates });
    if (!grossSalary || grossSalary <= 0) {
      return res.status(400).json({ success: false, error: 'grossSalary obbligatorio' });
    }

    // Estrai parametri da opts se presenti
    const finalYear = year || opts?.year || 2025;
    const finalRegion = region || opts?.region || 'Marche';
    const finalMunicipality = municipality || opts?.municipality || 'Pesaro';
    const finalContractType = contractType || opts?.contractType || null;
    const finalTeamId = req.user?.profile?.teamId || teamId || opts?.teamId || null;

    // DB-first tax rates (merge con client e default sicuri)
    const defaults = { inpsWorker: 9.19, ffcWorker: 1.25, inpsEmployer: 29.58, inailEmployer: 7.9, ffcEmployer: 6.25, solidarityWorker: 0.5, solidarityEmployer: 0 };
    let dbRates = await loadTaxRatesFromDb(finalTeamId, finalYear, finalContractType);
    const taxRates = { ...defaults, ...(clientTaxRates || {}), ...(dbRates || {}) };

    const result = await calcolaStipendioCompleto(grossSalary, taxRates, finalYear, finalRegion, finalMunicipality, finalContractType, finalTeamId);
    console.log('🟩 [BE] /api/taxes/net-from-gross RESPONSE:', result);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Errore net-from-gross:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🔄 Netto → Lordo diretto
router.post('/gross-from-net', async (req, res) => {
  try {
    const { netSalary, taxRates: clientTaxRates, year, region, municipality, contractType, teamId, opts } = req.body;
    console.log('🟦 [BE] /api/taxes/gross-from-net REQUEST:', { netSalary, year, region, municipality, contractType, teamId, hasClientRates: !!clientTaxRates });
    if (!netSalary || netSalary <= 0) {
      return res.status(400).json({ success: false, error: 'netSalary obbligatorio' });
    }

    const finalYear = year || opts?.year || 2025;
    const finalRegion = region || opts?.region || 'Marche';
    const finalMunicipality = municipality || opts?.municipality || 'Pesaro';
    const finalContractType = contractType || opts?.contractType || null;
    const finalTeamId = req.user?.profile?.teamId || teamId || opts?.teamId || null;

    // DB-first tax rates (merge con client e default sicuri)
    const defaults = { inpsWorker: 9.19, ffcWorker: 0.5, inpsEmployer: 30, inailEmployer: 1.5, ffcEmployer: 6.25, solidarityWorker: 0, solidarityEmployer: 0 };
    let dbRates = await loadTaxRatesFromDb(finalTeamId, finalYear, finalContractType);
    const taxRates = { ...defaults, ...(clientTaxRates || {}), ...(dbRates || {}) };

    const result = await calcolaLordoDaNetto(netSalary, taxRates, finalYear, finalRegion, finalMunicipality, finalContractType, finalTeamId);
    console.log('🟩 [BE] /api/taxes/gross-from-net RESPONSE:', result);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Errore gross-from-net:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================
// V2 ENDPOINTS - DB-DRIVEN ARCHITECTURE
// ========================================

/**
 * POST /api/taxes/v2/net-from-gross
 * Calcola netto da lordo usando nuovo motore + DB parlante
 */
router.post('/v2/net-from-gross', async (req, res) => {
  try {
    const { grossSalary, year, contractType, region, municipality, teamId } = req.body;
    
    console.log('🟦 [V2] /api/taxes/v2/net-from-gross REQUEST:', { 
      grossSalary, year, contractType, region, municipality, teamId 
    });
    
    if (!grossSalary || grossSalary <= 0) {
      return res.status(400).json({ error: 'grossSalary required' });
    }
    
    const finalTeamId = req.user?.profile?.teamId || teamId;
    const finalYear = parseInt(year || 2025);
    const finalContractType = contractType || 'PROFESSIONAL';
    const finalRegion = region || null;
    const finalMunicipality = municipality || null;
    
    // Carica profilo fiscale
    const profile = await loadFiscalProfile({
      teamId: finalTeamId,
      year: finalYear,
      contractType: finalContractType,
      region: finalRegion,
      municipality: finalMunicipality
    });
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'Fiscal profile not found. Please configure tax rates first.' 
      });
    }
    
    // Calcola con motore dinamico
    const result = engine.computeFromLordoDynamic(grossSalary, profile);
    
    // Aggiungi contributi employer (per costo azienda)
    const G = grossSalary;
    const inpsEmployer = G * (profile._rawRates.inpsEmployer / 100);
    const inailEmployer = G * (profile._rawRates.inailEmployer / 100);
    const ffcEmployer = G * (profile._rawRates.ffcEmployer / 100);
    const solidarityEmployer = G * (profile._rawRates.solidarityEmployer / 100);
    const totaleContributiEmployer = inpsEmployer + inailEmployer + ffcEmployer + solidarityEmployer;
    const companyCost = G + totaleContributiEmployer + (G * profile.fondoRate);
    // Breakdown lavoratore: ripartiamo il totale in proporzione alle % raw
    const workerRateSum = (profile._rawRates.inpsWorker || 0) + (profile._rawRates.ffcWorker || 0) + (profile._rawRates.solidarityWorker || 0);
    const inpsWorkerAmt = workerRateSum > 0 ? (result.contrib * (profile._rawRates.inpsWorker || 0) / workerRateSum) : 0;
    const ffcWorkerAmt = workerRateSum > 0 ? (result.contrib * (profile._rawRates.ffcWorker || 0) / workerRateSum) : 0;
    const solidarityWorkerAmt = workerRateSum > 0 ? (result.contrib * (profile._rawRates.solidarityWorker || 0) / workerRateSum) : 0;
    
    const response = {
      grossSalary: result.lordo,
      netSalary: result.netto,
      totaleContributiWorker: result.contrib,
      inpsWorker: Math.round(inpsWorkerAmt * 100) / 100,
      ffcWorker: Math.round(ffcWorkerAmt * 100) / 100,
      solidarityWorker: Math.round(solidarityWorkerAmt * 100) / 100,
      // Employer breakdown (per UI)
      inpsEmployer: Math.round(inpsEmployer * 100) / 100,
      inailEmployer: Math.round(inailEmployer * 100) / 100,
      ffcEmployer: Math.round(ffcEmployer * 100) / 100,
      solidarityEmployer: Math.round(solidarityEmployer * 100) / 100,
      totaleContributiEmployer: Math.round(totaleContributiEmployer * 100) / 100,
      companyCost: Math.round(companyCost * 100) / 100,
      // Compatibilità nomi
      imponibileFiscale: result.imponibile,
      taxableIncome: result.imponibile,
      irpef: result.irpef,
      detrazione: result.detraz,
      l207Discount: result.l207Discount,
      l207ExtraDeduction: result.l207Extra,
      irpefAfterL207: result.irpefAfterL207,
      addRegionale: result.addReg,
      addComunale: result.addCity,
      addizionali: Math.round((result.addReg + result.addCity) * 100) / 100,
      totalTax: result.totalTax,
      _rawRates: profile._rawRates
    };
    
    console.log('🟩 [V2] /api/taxes/v2/net-from-gross RESPONSE:', response);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Error in /v2/net-from-gross:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/taxes/v2/gross-from-net
 * Calcola lordo da netto usando nuovo motore + DB parlante
 */
router.post('/v2/gross-from-net', async (req, res) => {
  try {
    const { netSalary, year, contractType, region, municipality, teamId } = req.body;
    
    console.log('🟦 [V2] /api/taxes/v2/gross-from-net REQUEST:', { 
      netSalary, year, contractType, region, municipality, teamId 
    });
    
    if (!netSalary || netSalary <= 0) {
      return res.status(400).json({ error: 'netSalary required' });
    }
    
    const finalTeamId = req.user?.profile?.teamId || teamId;
    const finalYear = parseInt(year || 2025);
    const finalContractType = contractType || 'PROFESSIONAL';
    const finalRegion = region || null;
    const finalMunicipality = municipality || null;
    
    // Carica profilo fiscale
    const profile = await loadFiscalProfile({
      teamId: finalTeamId,
      year: finalYear,
      contractType: finalContractType,
      region: finalRegion,
      municipality: finalMunicipality
    });
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'Fiscal profile not found. Please configure tax rates first.' 
      });
    }
    
    // Calcola con motore dinamico (binary search)
    const result = engine.computeFromNettoDynamic(netSalary, profile);
    
    // Aggiungi contributi employer (per costo azienda)
    const G = result.lordo;
    const inpsEmployer = G * (profile._rawRates.inpsEmployer / 100);
    const inailEmployer = G * (profile._rawRates.inailEmployer / 100);
    const ffcEmployer = G * (profile._rawRates.ffcEmployer / 100);
    const solidarityEmployer = G * (profile._rawRates.solidarityEmployer / 100);
    const totaleContributiEmployer = inpsEmployer + inailEmployer + ffcEmployer + solidarityEmployer;
    const companyCost = G + totaleContributiEmployer + (G * profile.fondoRate);
    // Breakdown lavoratore: ripartiamo il totale in proporzione alle % raw
    const workerRateSum2 = (profile._rawRates.inpsWorker || 0) + (profile._rawRates.ffcWorker || 0) + (profile._rawRates.solidarityWorker || 0);
    const inpsWorkerAmt2 = workerRateSum2 > 0 ? (result.contrib * (profile._rawRates.inpsWorker || 0) / workerRateSum2) : 0;
    const ffcWorkerAmt2 = workerRateSum2 > 0 ? (result.contrib * (profile._rawRates.ffcWorker || 0) / workerRateSum2) : 0;
    const solidarityWorkerAmt2 = workerRateSum2 > 0 ? (result.contrib * (profile._rawRates.solidarityWorker || 0) / workerRateSum2) : 0;
    
    const response = {
      grossSalary: result.lordo,
      netSalary: result.netto,
      totaleContributiWorker: result.contrib,
      inpsWorker: Math.round(inpsWorkerAmt2 * 100) / 100,
      ffcWorker: Math.round(ffcWorkerAmt2 * 100) / 100,
      solidarityWorker: Math.round(solidarityWorkerAmt2 * 100) / 100,
      // Employer breakdown (per UI)
      inpsEmployer: Math.round(inpsEmployer * 100) / 100,
      inailEmployer: Math.round(inailEmployer * 100) / 100,
      ffcEmployer: Math.round(ffcEmployer * 100) / 100,
      solidarityEmployer: Math.round(solidarityEmployer * 100) / 100,
      totaleContributiEmployer: Math.round(totaleContributiEmployer * 100) / 100,
      companyCost: Math.round(companyCost * 100) / 100,
      // Compatibilità nomi
      imponibileFiscale: result.imponibile,
      taxableIncome: result.imponibile,
      irpef: result.irpef,
      detrazione: result.detraz,
      l207Discount: result.l207Discount,
      l207ExtraDeduction: result.l207Extra,
      irpefAfterL207: result.irpefAfterL207,
      addRegionale: result.addReg,
      addComunale: result.addCity,
      addizionali: Math.round((result.addReg + result.addCity) * 100) / 100,
      totalTax: result.totalTax,
      _rawRates: profile._rawRates
    };
    
    console.log('🟩 [V2] /api/taxes/v2/gross-from-net RESPONSE:', response);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Error in /v2/gross-from-net:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// ========================================
// Endpoint diagnostico L207 (temporaneo)
// ========================================
// POST /api/taxes/diagnostics/l207
// Body: { grossSalary, year, region, municipality, contractType, teamId, taxRates? }
router.post('/diagnostics/l207', async (req, res) => {
  try {
    const { grossSalary, year, region, municipality, contractType, teamId, taxRates: clientTaxRates } = req.body || {};
    if (!grossSalary || grossSalary <= 0) return res.status(400).json({ success: false, error: 'grossSalary obbligatorio' });

    const finalYear = parseInt(year || 2025);
    const finalRegion = region || null;
    const finalMunicipality = municipality || null;
    const finalContractType = contractType || null;
    const finalTeamId = req.user?.profile?.teamId || teamId || null;

    // Carica aliquote dal DB, fallback a payload
    let taxRates = await loadTaxRatesFromDb(finalTeamId, finalYear, finalContractType);
    if (!taxRates) taxRates = clientTaxRates;
    if (!taxRates) return res.status(400).json({ success: false, error: 'Aliquote (taxRates) mancanti' });

    // Contributi lavoratore
    const inpsWorker = grossSalary * (parseFloat(taxRates.inpsWorker) / 100);
    const ffcWorker = grossSalary * (parseFloat(taxRates.ffcWorker) / 100);
    const solidarityWorker = grossSalary * (parseFloat(taxRates.solidarityWorker || 0) / 100);
    const totaleContributiWorker = inpsWorker + ffcWorker + solidarityWorker;
    const taxableIncome = grossSalary - totaleContributiWorker;

    // Breakdown IRPEF
    const { calcolaIrpef, calcolaAddizionali } = require('../utils/taxCalculator');
    const irpefBreak = await calcolaIrpef(taxableIncome, finalYear, finalTeamId);
    const irpefLorda = irpefBreak.lorda;
    const detrazioni = irpefBreak.detrazioni;
    const irpefDopoDetrazioni = Math.max(irpefLorda - detrazioni, 0);

    // Regole L207
    const rules = await prisma.tax_bonus_l207_rule.findMany({
      where: { year: finalYear, teamId: finalTeamId },
      orderBy: { min_income: 'asc' }
    });

    const now = new Date();
    const selectedRule = rules.find(r => {
      const inRange = taxableIncome >= r.min_income && (r.max_income == null || taxableIncome < r.max_income);
      const okDate = (!r.valid_from || now >= r.valid_from) && (!r.valid_to || now <= r.valid_to);
      const okContract = !r.eligible_contract_types?.length || r.eligible_contract_types.includes(finalContractType || '');
      return inRange && okDate && okContract;
    }) || null;

    let mode = null, perc = 0, baseSconto = 0, cap = null, sconto = 0, irpefPostBonus = irpefDopoDetrazioni;
    if (selectedRule) {
      perc = Math.max(0, Math.min(100, selectedRule.bonus_percentage || 0));
      mode = selectedRule.mode || 'on_lorda';
      cap = selectedRule.cap_amount ?? null;

      switch (mode) {
        case 'on_netta': baseSconto = irpefDopoDetrazioni; break;
        case 'on_income': baseSconto = taxableIncome; break;
        case 'on_bonus_component': baseSconto = parseFloat(taxRates?.bonusAmount || 0); break;
        case 'on_lorda': default: baseSconto = irpefLorda; break;
      }
      sconto = (baseSconto * perc) / 100; if (cap != null) sconto = Math.min(sconto, cap);
      if (mode === 'on_lorda') {
        const irpefPostScontoLorda = Math.max(irpefLorda - sconto, 0);
        irpefPostBonus = Math.max(irpefPostScontoLorda - detrazioni, 0);
      } else {
        irpefPostBonus = Math.max(irpefDopoDetrazioni - sconto, 0);
      }
    }

    const addizionali = await calcolaAddizionali(taxableIncome, finalYear, finalRegion, finalMunicipality, finalTeamId);
    const netSalary = grossSalary - totaleContributiWorker - irpefPostBonus - addizionali;

    return res.json({
      success: true,
      data: {
        inputs: { grossSalary, year: finalYear, region: finalRegion, municipality: finalMunicipality, contractType: finalContractType, teamId: finalTeamId },
        taxRates,
        workerContributions: { inpsWorker, ffcWorker, solidarityWorker, totaleContributiWorker },
        taxableIncome,
        irpef: { lorda: irpefLorda, detrazioni, dopoDetrazioni: irpefDopoDetrazioni, dopoBonus: irpefPostBonus },
        bonusL207: selectedRule ? { mode, perc, baseSconto, cap, sconto, ruleId: selectedRule.id, range: [selectedRule.min_income, selectedRule.max_income] } : null,
        addizionali,
        netSalary
      }
    });
  } catch (err) {
    console.error('Errore diagnostics/l207:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});