// server/src/services/fiscalProfileLoader.js
const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();
const engine = require('../lib/tax/engine-dynamic');

/**
 * Ritorna oggetto "p" per engine-dynamic in base a team/year/contractType/region/municipality
 */
async function loadFiscalProfile({ teamId, year, contractType, region, municipality }) {
  console.log(`[FiscalProfileLoader] Loading profile for team=${teamId}, year=${year}, type=${contractType}, region=${region}, municipality=${municipality}`);
  
  // Rates base (worker/employer + fondo)
  const base = await prisma.tax_rate_v2.findFirst({ 
    where: { teamId, year, contractType } 
  });
  
  if (!base) {
    console.warn(`⚠️ [FiscalProfileLoader] No tax_rate found for teamId=${teamId}, year=${year}, contractType=${contractType}`);
    return null;
  }

  // Contributi (mode + dati)
  const profile = await prisma.tax_contribution_profile.findFirst({ 
    where: { teamId, year, contractType } 
  });
  
  let contribMode = profile?.mode || 'PIECEWISE';
  let contribPoints = null, contribBrackets = null;
  
  if (contribMode === 'LOOKUP') {
    const pts = await prisma.tax_contribution_point.findMany({ 
      where: { teamId, year, contractType },
      orderBy: { gross: 'asc' }
    });
    contribPoints = engine.transformPoints(pts);
    console.log(`   └─ Contributi LOOKUP: ${pts.length} punti`);
  } else {
    const rows = await prisma.tax_contribution_bracket.findMany({ 
      where: { teamId, year, contractType },
      orderBy: { from_amount: 'asc' }
    });
    contribBrackets = engine.transformBracketRows(rows);
    console.log(`   └─ Contributi PIECEWISE: ${rows.length} scaglioni`);
  }

  // IRPEF
  const irpefRows = await prisma.tax_irpef_bracket.findMany({ 
    where: { teamId, year },
    orderBy: { min: 'asc' }
  });
  const irpefBrackets = engine.transformBracketRows(irpefRows);
  console.log(`   └─ IRPEF: ${irpefRows.length} scaglioni`);

  // Detrazione art.13 override
  const detOver = await prisma.tax_irpef_detraction_override.findMany({ 
    where: { teamId, year },
    orderBy: { x_income: 'asc' }
  });
  const detrazOverride = detOver?.length ? engine.transformPoints(detOver) : null;
  if (detrazOverride) {
    console.log(`   └─ Detrazione art.13 OVERRIDE: ${detOver.length} punti`);
  }

  // L207 disattivata temporaneamente
  const l207Bands = [];
  const extra = null;

  // Addizionale regionale
  let regBr = [];
  if (region) {
    const reg = await prisma.tax_regional_additional.findFirst({ 
      where: { teamId, year, region }
    });
    
    if (reg?.is_progressive) {
      const brackets = await prisma.tax_regional_additional_bracket_v2.findMany({ 
        where: { teamId, year, region },
        orderBy: { min: 'asc' }
      });
      regBr = engine.transformBracketRows(brackets);
      console.log(`   └─ Add. Regionale PROGRESSIVA: ${brackets.length} scaglioni`);
    } else if (reg?.flat_rate) {
      regBr = [{ from: 0, to: null, rate: Number(reg.flat_rate) / 100, fixed: 0 }];
      console.log(`   └─ Add. Regionale FLAT: ${reg.flat_rate}%`);
    } else {
      console.log(`   └─ Add. Regionale: NESSUNA`);
    }
  } else {
    console.log(`   └─ Add. Regionale: NESSUNA (region non specificata)`);
  }
  
  // Addizionale comunale
  const mun = municipality ? await prisma.tax_municipal_additional.findFirst({ 
    where: { teamId, year, region, municipality }
  }) : null;
  
  let munBr = [];
  if (mun?.is_progressive) {
    const brackets = await prisma.tax_municipal_additional_bracket_v2.findMany({ 
      where: { teamId, year, region, municipality },
      orderBy: { min: 'asc' }
    });
    munBr = engine.transformBracketRows(brackets);
    console.log(`   └─ Add. Comunale PROGRESSIVA: ${brackets.length} scaglioni`);
  } else if (mun?.flat_rate) {
    munBr = [{ from: 0, to: null, rate: Number(mun.flat_rate) / 100, fixed: 0 }];
    console.log(`   └─ Add. Comunale FLAT: ${mun.flat_rate}%`);
  } else {
    console.log(`   └─ Add. Comunale: NESSUNA`);
  }

  const fiscalProfile = {
    // contributi (solo lavoratore: engine calcola R = G - contributi lavoratore)
    contribMode,
    contribPoints,
    contribBrackets,
    
    // IRPEF
    irpefBrackets,
    detrazOverride,
    detrazStd: undefined, // usa default interna se non override
    
    // L207 extra detrazione
    l207Bands,
    l207Full: 0,
    l207FullTo: 0,
    l207FadeTo: 0,
    
    // Addizionali
    addRegionBrackets: regBr,
    addCityBrackets: munBr,
    
    // Fondo (employer "costo"), percentuale -> decimale
    fondoRate: Number(base.fondoRatePct) / 100,
    
    // Mettiamo a disposizione rawRate per FE breakdown employer (opzionale)
    _rawRates: {
      inpsWorker: Number(base.inpsWorkerPct),
      ffcWorker: Number(base.ffcWorkerPct),
      inpsEmployer: Number(base.inpsEmployerPct),
      inailEmployer: Number(base.inailEmployerPct),
      ffcEmployer: Number(base.ffcEmployerPct),
      solidarityWorker: Number(base.solidarityWorkerPct),
      solidarityEmployer: Number(base.solidarityEmployerPct),
      fondoRate: Number(base.fondoRatePct),
    }
  };
  
  console.log(`✅ [FiscalProfileLoader] Profile loaded successfully`);
  return fiscalProfile;
}

module.exports = { loadFiscalProfile };

