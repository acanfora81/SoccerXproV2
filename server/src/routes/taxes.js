// server/src/routes/taxes.js
const express = require('express');
const router = express.Router();
const { calcolaStipendioCompleto, calcolaLordoDaNetto } = require('../utils/taxCalculator');
const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

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
    if (!grossSalary || grossSalary <= 0) {
      return res.status(400).json({ success: false, error: 'grossSalary obbligatorio' });
    }

    // Estrai parametri da opts se presenti
    const finalYear = year || opts?.year || 2025;
    const finalRegion = region || opts?.region || 'Marche';
    const finalMunicipality = municipality || opts?.municipality || 'Pesaro';
    const finalContractType = contractType || opts?.contractType || null;
    const finalTeamId = teamId || opts?.teamId || null;

    // DB-first tax rates (fallback al payload client se assenti)
    let taxRates = await loadTaxRatesFromDb(finalTeamId, finalYear, finalContractType);
    if (!taxRates) taxRates = clientTaxRates;

    const result = await calcolaStipendioCompleto(grossSalary, taxRates, finalYear, finalRegion, finalMunicipality, finalContractType);
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
    if (!netSalary || netSalary <= 0) {
      return res.status(400).json({ success: false, error: 'netSalary obbligatorio' });
    }

    const finalYear = year || opts?.year || 2025;
    const finalRegion = region || opts?.region || 'Marche';
    const finalMunicipality = municipality || opts?.municipality || 'Pesaro';
    const finalContractType = contractType || opts?.contractType || null;
    const finalTeamId = teamId || opts?.teamId || null;

    // DB-first tax rates (fallback al payload client se assenti)
    let taxRates = await loadTaxRatesFromDb(finalTeamId, finalYear, finalContractType);
    if (!taxRates) taxRates = clientTaxRates;

    const result = await calcolaLordoDaNetto(netSalary, taxRates, finalYear, finalRegion, finalMunicipality, finalContractType);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Errore gross-from-net:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;