/*
  Usage:
  node server/src/scripts/diagnose_l207.js 55000 2025 PROFESSIONAL "Lombardia" "Milano" <TEAM_ID>
  node server/src/scripts/diagnose_l207.js --net 33500 2025 PROFESSIONAL "Lombardia" "Milano" <TEAM_ID>
*/
const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();
const { calcolaIrpef, calcolaAddizionali, calcolaLordoDaNetto } = require('../utils/taxCalculator');

function round2(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }

async function main() {
  const isNetMode = process.argv[2] === '--net';
  const grossSalary = isNetMode ? null : parseFloat(process.argv[2] || '55000');
  const netSalary = isNetMode ? parseFloat(process.argv[3] || '33500') : null;
  const year = parseInt(isNetMode ? process.argv[4] : process.argv[3] || '2025');
  const contractType = isNetMode ? process.argv[5] : process.argv[4] || 'PROFESSIONAL';
  const region = isNetMode ? process.argv[6] : process.argv[5] || null;
  const municipality = isNetMode ? process.argv[7] : process.argv[6] || null;
  const teamId = isNetMode ? process.argv[8] : process.argv[7] || null;

  if (!teamId) {
    console.error('Provide TEAM_ID as last arg');
    process.exit(1);
  }

  const rate = await prisma.taxRate.findFirst({ where: { teamId, year, type: contractType } });
  if (!rate) throw new Error('No taxRate found');
  const taxRates = {
    inpsWorker: parseFloat(rate.inpsWorker),
    ffcWorker: parseFloat(rate.ffcWorker),
    solidarityWorker: parseFloat(rate.solidarityWorker || 0),
    inpsEmployer: parseFloat(rate.inpsEmployer),
    ffcEmployer: parseFloat(rate.ffcEmployer),
    inailEmployer: parseFloat(rate.inailEmployer || 0)
  };

  let finalGrossSalary, finalNetSalary;
  if (isNetMode) {
    // Calcolo netto → lordo
    const result = await calcolaLordoDaNetto(netSalary, taxRates, year, region, municipality, contractType, teamId);
    finalGrossSalary = result.grossSalary;
    finalNetSalary = result.netSalary;
  } else {
    // Calcolo lordo → netto
    finalGrossSalary = grossSalary;
    const inpsWorker = grossSalary * (taxRates.inpsWorker / 100);
    const ffcWorker = grossSalary * (taxRates.ffcWorker / 100);
    const solidarityWorker = grossSalary * (taxRates.solidarityWorker / 100);
    const totWorker = inpsWorker + ffcWorker + solidarityWorker;
    const taxableIncome = grossSalary - totWorker;
    const irpefBreak = await calcolaIrpef(taxableIncome, year, teamId);
    const addizionali = await calcolaAddizionali(taxableIncome, year, region, municipality, teamId);
    finalNetSalary = grossSalary - totWorker - irpefBreak.netta - addizionali;
  }

  const inpsWorker = finalGrossSalary * (taxRates.inpsWorker / 100);
  const ffcWorker = finalGrossSalary * (taxRates.ffcWorker / 100);
  const solidarityWorker = finalGrossSalary * (taxRates.solidarityWorker / 100);
  const totWorker = inpsWorker + ffcWorker + solidarityWorker;
  const taxableIncome = finalGrossSalary - totWorker;

  const irpefBreak = await calcolaIrpef(taxableIncome, year, teamId);
  const addizionali = await calcolaAddizionali(taxableIncome, year, region, municipality, teamId);

  const rules = await prisma.tax_bonus_l207_rule.findMany({ where: { teamId, year }, orderBy: { min_income: 'asc' } });
  const now = new Date();
  const rule = rules.find(r => {
    const inRange = taxableIncome >= r.min_income && (r.max_income == null || taxableIncome < r.max_income);
    const okDate = (!r.valid_from || now >= r.valid_from) && (!r.valid_to || now <= r.valid_to);
    const okContract = !r.eligible_contract_types?.length || r.eligible_contract_types.includes(contractType || '');
    return inRange && okDate && okContract;
  }) || null;

  let mode = null, perc = 0, baseSconto = 0, cap = null, sconto = 0, irpefPostBonus = Math.max(irpefBreak.lorda - irpefBreak.detrazioni, 0);
  if (rule) {
    perc = Math.max(0, Math.min(100, rule.bonus_percentage || 0));
    mode = rule.mode || 'on_lorda';
    cap = rule.cap_amount ?? null;
    switch (mode) {
      case 'on_netta': baseSconto = irpefBreak.netta; break;
      case 'on_income': baseSconto = taxableIncome; break;
      case 'on_bonus_component': baseSconto = 0; break;
      case 'on_lorda': default: baseSconto = irpefBreak.lorda; break;
    }
    sconto = (baseSconto * perc) / 100; if (cap != null) sconto = Math.min(sconto, cap);
    if (mode === 'on_lorda') {
      const irpefPostSconto = Math.max(irpefBreak.lorda - sconto, 0);
      irpefPostBonus = Math.max(irpefPostSconto - irpefBreak.detrazioni, 0);
    } else {
      irpefPostBonus = Math.max(irpefBreak.netta - sconto, 0);
    }
  }

  const calculatedNetSalary = finalGrossSalary - totWorker - irpefPostBonus - addizionali;
  console.log(JSON.stringify({
    mode: isNetMode ? 'net-to-gross' : 'gross-to-net',
    inputs: isNetMode ? { netSalary, year, contractType, region, municipality, teamId } : { grossSalary, year, contractType, region, municipality, teamId },
    taxRates,
    worker: { inpsWorker: round2(inpsWorker), ffcWorker: round2(ffcWorker), solidarityWorker: round2(solidarityWorker), totWorker: round2(totWorker) },
    taxableIncome: round2(taxableIncome),
    irpef: irpefBreak,
    l207: rule ? { id: rule.id, mode, perc, baseSconto: round2(baseSconto), cap, sconto: round2(sconto) } : null,
    addizionali: round2(addizionali),
    results: { 
      grossSalary: round2(finalGrossSalary), 
      netSalary: round2(finalNetSalary),
      calculatedNetSalary: round2(calculatedNetSalary),
      difference: round2(Math.abs(finalNetSalary - calculatedNetSalary))
    }
  }, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });

