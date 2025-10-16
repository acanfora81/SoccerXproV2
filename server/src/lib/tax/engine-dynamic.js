// server/src/lib/tax/engine-dynamic.js
// Motore di calcolo fiscale dinamico con supporto per slope field

/**
 * Transform utilities per convertire dati DB in formati usabili dal motore
 */

function transformBracketRows(rows) {
  if (!rows || rows.length === 0) return [];
  return rows.map(r => ({
    from: Number(r.min || r.from_amount || 0),
    to: r.max || r.to_amount || null,
    rate: Number(r.rate) / 100, // converte % in decimale
    fixed: Number(r.fixed || 0)
  })).sort((a, b) => a.from - b.from);
}

function transformPoints(points) {
  if (!points || points.length === 0) return null;
  return points.map(p => ({
    x: Number(p.gross || p.x_income),
    y: Number(p.contrib || p.y_amount)
  })).sort((a, b) => a.x - b.x);
}

function transformL207Bands(bands) {
  if (!bands || bands.length === 0) return [];
  return bands.map(b => ({
    max: Number(b.max_amount || b.max_income),
    pct: Number(b.pct || b.bonus_percentage) / 100
  })).sort((a, b) => a.max - b.max);
}

/**
 * Calcola contributi da lordo (lookup o piecewise)
 */
function calcContrib(gross, mode, points, brackets) {
  if (mode === 'LOOKUP' && points && points.length > 0) {
    // Interpolazione lineare tra punti
    if (gross <= points[0].x) return points[0].y;
    if (gross >= points[points.length - 1].x) return points[points.length - 1].y;
    
    for (let i = 0; i < points.length - 1; i++) {
      if (gross >= points[i].x && gross <= points[i + 1].x) {
        const slope = (points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x);
        return points[i].y + slope * (gross - points[i].x);
      }
    }
    return 0;
  }
  
  // PIECEWISE con scaglioni
  if (!brackets || brackets.length === 0) return 0;
  
  let total = 0;
  for (const br of brackets) {
    const min = br.from;
    const max = br.to || Infinity;
    if (gross > min) {
      const taxable = Math.min(gross, max) - min;
      total += taxable * br.rate + (br.fixed || 0);
    }
  }
  return Math.round(total * 100) / 100;
}

/**
 * Calcola IRPEF progressiva
 */
function calcIRPEF(taxableIncome, brackets) {
  if (!brackets || brackets.length === 0) return 0;
  
  let totalTax = 0;
  for (const br of brackets) {
    const min = br.from;
    const max = br.to || Infinity;
    if (taxableIncome > min) {
      const taxable = Math.min(taxableIncome, max) - min;
      totalTax += taxable * br.rate + (br.fixed || 0);
    }
  }
  return Math.round(totalTax * 100) / 100;
}

/**
 * Calcola detrazione art.13 (standard, override o funzione personalizzata)
 */
function calcDetraction(taxableIncome, overridePoints, detrazStdFn) {
  // 1) Override a punti: se presente, ha priorità
  if (overridePoints && overridePoints.length > 0) {
    const ti = taxableIncome;
    if (ti <= overridePoints[0].x) return overridePoints[0].y;
    if (ti >= overridePoints[overridePoints.length - 1].x) return overridePoints[overridePoints.length - 1].y;
    for (let i = 0; i < overridePoints.length - 1; i++) {
      if (ti >= overridePoints[i].x && ti <= overridePoints[i + 1].x) {
        const slope = (overridePoints[i + 1].y - overridePoints[i].y) / (overridePoints[i + 1].x - overridePoints[i].x);
        return overridePoints[i].y + slope * (ti - overridePoints[i].x);
      }
    }
    return 0;
  }

  // 2) Funzione personalizzata
  if (typeof detrazStdFn === 'function') {
    return detrazStdFn(taxableIncome);
  }

  // Formula standard art.13
  if (taxableIncome <= 15000) {
    return Math.max(1955 * (15000 - taxableIncome) / 15000, 690);
  } else if (taxableIncome <= 28000) {
    return 1910 + 1190 * (28000 - taxableIncome) / 13000;
  } else if (taxableIncome <= 50000) {
    return 1910 * (50000 - taxableIncome) / 22000;
  }
  return 0;
}

/**
 * Calcola addizionale (flat o progressiva)
 */
function calcAdditional(taxableIncome, brackets) {
  if (!brackets || brackets.length === 0) return 0;
  
  // Se c'è un solo bracket con from=0, è flat
  if (brackets.length === 1 && brackets[0].from === 0) {
    return Math.round(taxableIncome * brackets[0].rate * 100) / 100;
  }
  
  // Altrimenti progressiva
  let total = 0;
  for (const br of brackets) {
    const min = br.from;
    const max = br.to || Infinity;
    if (taxableIncome > min) {
      const taxable = Math.min(taxableIncome, max) - min;
      total += taxable * br.rate;
    }
  }
  return Math.round(total * 100) / 100;
}

/**
 * Calcola bonus L.207
 */
function calcL207(taxableIncome, bands, extraFull, extraFullTo, extraFadeTo) {
  let discount = 0;
  
  // Sconto IRPEF da bande
  for (const band of bands) {
    if (taxableIncome <= band.max) {
      discount = band.pct;
      break;
    }
  }
  
  // Ulteriore detrazione
  let extraDeduction = 0;
  if (extraFull && extraFullTo && extraFadeTo) {
    if (taxableIncome <= extraFullTo) {
      extraDeduction = extraFull;
    } else if (taxableIncome < extraFadeTo) {
      const slope = -extraFull / (extraFadeTo - extraFullTo);
      extraDeduction = extraFull + slope * (taxableIncome - extraFullTo);
    }
  }
  
  return {
    discount: Math.round(discount * 10000) / 10000,
    extraDeduction: Math.round(extraDeduction * 100) / 100
  };
}

/**
 * LORDO → NETTO
 */
function computeFromLordoDynamic(grossSalary, p) {
  const G = grossSalary;
  
  // 1. Contributi lavoratore
  const contrib = calcContrib(G, p.contribMode || 'PIECEWISE', p.contribPoints, p.contribBrackets);
  
  // 2. Imponibile fiscale
  const R = G - contrib;
  
  // 3. IRPEF
  const irpef = calcIRPEF(R, p.irpefBrackets || []);
  
  // 4. Detrazione art.13
  const detraz = calcDetraction(R, p.detrazOverride, p.detrazStd);
  
  // 5. L.207
  const l207 = calcL207(R, p.l207Bands || [], p.l207Full, p.l207FullTo, p.l207FadeTo);
  // Applica prima la detrazione art.13, poi eventuale L.207
  const irpefAfterDetraz = Math.max(0, irpef - detraz);
  const irpefAfterL207 = Math.max(0, irpefAfterDetraz * (1 - l207.discount) - l207.extraDeduction);
  
  // 6. Addizionali
  const addReg = calcAdditional(R, p.addRegionBrackets || []);
  const addCity = calcAdditional(R, p.addCityBrackets || []);
  
  // 7. Netto
  const totalTax = irpefAfterL207 + addReg + addCity;
  const net = Math.round((R - totalTax) * 100) / 100;

  return {
    lordo: G,
    netto: net,
    contrib,
    imponibile: R,
    irpef,
    detraz,
    l207Discount: l207.discount,
    l207Extra: l207.extraDeduction,
    irpefAfterL207,
    addReg,
    addCity,
    totalTax
  };
}

/**
 * NETTO → LORDO (binary search + slope field)
 */
function computeFromNettoDynamic(targetNet, p, maxIter = 50) {
  let low = targetNet;
  let high = targetNet * 3;
  let bestG = targetNet;
  
  for (let iter = 0; iter < maxIter; iter++) {
    const mid = (low + high) / 2;
    const result = computeFromLordoDynamic(mid, p);
    
    if (Math.abs(result.netto - targetNet) < 0.5) {
      bestG = mid;
      break;
    }
    
    if (result.netto < targetNet) {
      low = mid;
    } else {
      high = mid;
    }
    bestG = mid;
  }
  
  return computeFromLordoDynamic(bestG, p);
}

module.exports = {
  transformBracketRows,
  transformPoints,
  transformL207Bands,
  calcContrib,
  calcIRPEF,
  calcDetraction,
  calcAdditional,
  calcL207,
  computeFromLordoDynamic,
  computeFromNettoDynamic
};
