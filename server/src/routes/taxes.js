// server/src/routes/taxes.js
const express = require('express');
const router = express.Router();
const { calcolaStipendioCompleto, calcolaLordoDaNetto } = require('../utils/taxCalculator');

// ➕ Lordo → Netto
router.post('/net-from-gross', async (req, res) => {
  try {
    const { grossSalary, taxRates, year, region, municipality, contractType, opts } = req.body;
    if (!grossSalary || grossSalary <= 0) {
      return res.status(400).json({ success: false, error: 'grossSalary obbligatorio' });
    }

    // Estrai parametri da opts se presenti
    const finalYear = year || opts?.year || 2025;
    const finalRegion = region || opts?.region || 'Marche';
    const finalMunicipality = municipality || opts?.municipality || 'Pesaro';
    const finalContractType = contractType || opts?.contractType || null;

    console.log('🔵 Parametri per calcolo lordo → netto:', { grossSalary, finalYear, finalRegion, finalMunicipality, finalContractType });

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
    const { netSalary, taxRates, year, region, municipality, contractType, opts } = req.body;
    if (!netSalary || netSalary <= 0) {
      return res.status(400).json({ success: false, error: 'netSalary obbligatorio' });
    }

    const finalYear = year || opts?.year || 2025;
    const finalRegion = region || opts?.region || 'Marche';
    const finalMunicipality = municipality || opts?.municipality || 'Pesaro';
    const finalContractType = contractType || opts?.contractType || null;

    const result = await calcolaLordoDaNetto(netSalary, taxRates, finalYear, finalRegion, finalMunicipality, finalContractType);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Errore gross-from-net:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;