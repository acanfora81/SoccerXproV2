// server/src/lib/tax/engine-dynamic.js
// Motore di calcolo fiscale dinamico con supporto per scaglioni/lookup
// Patch 2025-10-16: fix applicazione 'fixed' dei bracket (solo nel bracket corrente),
// ordine e basi di calcolo confermati secondo TUIR art.13 e addizionali regionali/comunali (D.Lgs. 446/1997).

/**
 * Transform utilities per convertire dati DB in formati usabili dal motore
 */
function transformBracketRows(rows) {
  if (!rows || rows.length === 0) return [];
  return rows
    .map((r) => ({
      from: Number(r.min || r.from_amount || 0),
      to: r.max ?? r.to_amount ?? null,
      rate: Number(r.rate) / 100, // da % a decimale
      fixed: Number(r.fixed || 0), // cumulata del bracket (da applicare SOLO nel bracket corrente)
    }))
    .sort((a, b) => a.from - b.from);
}

function transformPoints(points) {
  if (!points || points.length === 0) return null;
  return points
    .map((p) => ({
      x: Number(p.gross || p.x_income),
      y: Number(p.contrib || p.y_amount),
    }))
    .sort((a, b) => a.x - b.x);
}

function transformL207Bands(bands) {
  if (!bands || bands.length === 0) return [];
  return bands
    .map((b) => ({
      max: Number(b.max_amount || b.max_income),
      pct: Number(b.pct || b.bonus_percentage) / 100,
    }))
    .sort((a, b) => a.max - b.max);
}

/**
 * Calcola contributi da lordo (lookup o piecewise)
 * - LOOKUP: interpolazione lineare su punti (G, contrib)
 * - PIECEWISE: scaglioni su G; 'fixed' viene applicato SOLO nel bracket corrente
 */
function calcContrib(gross, mode, points, brackets) {
  // LOOKUP
  if (mode === "LOOKUP" && points && points.length > 0) {
    if (gross <= points[0].x) return round2(points[0].y);
    if (gross >= points[points.length - 1].x) return round2(points[points.length - 1].y);

    for (let i = 0; i < points.length - 1; i++) {
      if (gross >= points[i].x && gross <= points[i + 1].x) {
        const slope = (points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x);
        return round2(points[i].y + slope * (gross - points[i].x));
      }
    }
    return 0;
  }

  // PIECEWISE
  if (!brackets || brackets.length === 0) return 0;

  let total = 0;
  let lastBracketWithIncome = null;

  for (const br of brackets) {
    const min = br.from;
    const max = br.to ?? Infinity;
    if (gross > min) {
      const taxable = Math.min(gross, max) - min;
      if (taxable > 0) {
        total += taxable * (br.rate || 0);
        lastBracketWithIncome = br;
      }
    }
  }

  // Applica l'eventuale 'fixed' SOLO nel bracket in cui cade il lordo
  if (lastBracketWithIncome && lastBracketWithIncome.fixed) {
    total += lastBracketWithIncome.fixed;
  }

  return round2(total);
}

/**
 * Calcola IRPEF progressiva su R (imponibile fiscale)
 * 'fixed' viene applicato SOLO nel bracket in cui cade l'imponibile.
 */
function calcIRPEF(taxableIncome, brackets) {
  if (!brackets || brackets.length === 0) return 0;

  let totalTax = 0;
  let lastBracketWithIncome = null;

  for (const br of brackets) {
    const min = br.from;
    const max = br.to ?? Infinity;
    if (taxableIncome > min) {
      const taxable = Math.min(taxableIncome, max) - min;
      if (taxable > 0) {
        totalTax += taxable * (br.rate || 0);
        lastBracketWithIncome = br;
      }
    }
  }

  if (lastBracketWithIncome && lastBracketWithIncome.fixed) {
    totalTax += lastBracketWithIncome.fixed;
  }

  return round2(totalTax);
}

// Funzione standard art.13 (fallback)
function detrazioneArt13Default(taxableIncome) {
  const ti = Number(taxableIncome) || 0;
  if (ti <= 15000) {
    const base = (1955 * (15000 - ti)) / 15000;
    return Math.max(base, 690);
  }
  if (ti <= 28000) {
    return 1910 + (1190 * (28000 - ti)) / 13000;
  }
  if (ti <= 50000) {
    return (1910 * (50000 - ti)) / 22000;
  }
  return 0;
}

/**
 * Calcola detrazione art.13 (override a punti > funzione custom > default)
 */
function calcDetraction(taxableIncome, overridePoints, detrazStdFn) {
  // 1) Override a punti: priorità massima
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
  if (typeof detrazStdFn === "function") {
    return detrazStdFn(taxableIncome);
  }

  // 3) Default nazionale
  return detrazioneArt13Default(taxableIncome);
}

/**
 * Calcola addizionale (flat o progressiva) su R (base IRPEF)
 */
function calcAdditional(taxableIncome, brackets) {
  if (!brackets || brackets.length === 0) return 0;

  // Flat (un solo bracket da 0)
  if (brackets.length === 1 && brackets[0].from === 0 && (brackets[0].to === null || brackets[0].to === undefined)) {
    return round2(taxableIncome * (brackets[0].rate || 0));
  }

  // Progressiva
  let total = 0;
  for (const br of brackets) {
    const min = br.from;
    const max = br.to ?? Infinity;
    if (taxableIncome > min) {
      const taxable = Math.min(taxableIncome, max) - min;
      if (taxable > 0) total += taxable * (br.rate || 0);
    }
  }
  return round2(total);
}

/**
 * Calcola bonus L.207 su R
 */
function calcL207(taxableIncome, bands, extraFull, extraFullTo, extraFadeTo) {
  let discount = 0;

  // Sconto percentuale IRPEF da bande
  for (const band of bands || []) {
    if (taxableIncome <= band.max) {
      discount = band.pct || 0;
      break;
    }
  }

  // Ulteriore detrazione (lineare in fade)
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
    discount: round4(discount),
    extraDeduction: round2(extraDeduction),
  };
}

/**
 * LORDO → NETTO
 * Sequenza: G → contributi → R → IRPEF lorda → detrazioni → L.207 → addizionali(R) → netto
 */
function computeFromLordoDynamic(grossSalary, p) {
  const G = Number(grossSalary) || 0;

  // 1) Contributi lavoratore
  const contrib = calcContrib(G, p.contribMode || "PIECEWISE", p.contribPoints, p.contribBrackets);

  // 2) Imponibile fiscale
  const R = G - contrib;

  // 3) IRPEF lorda
  const irpef = calcIRPEF(R, p.irpefBrackets || []);

  // 4) Detrazione art.13
  const detraz = calcDetraction(R, p.detrazOverride, p.detrazStd);

  // 5) L.207 su IRPEF netta post-detrazioni
  const l207 = calcL207(R, p.l207Bands || [], p.l207Full, p.l207FullTo, p.l207FadeTo);
  const irpefAfterDetraz = Math.max(0, irpef - detraz);
  const irpefAfterL207 = Math.max(0, irpefAfterDetraz * (1 - (l207.discount || 0)) - (l207.extraDeduction || 0));

  // 6) Addizionali su R (base IRPEF), indipendenti da detrazioni
  const addReg = calcAdditional(R, p.addRegionBrackets || []);
  const addCity = calcAdditional(R, p.addCityBrackets || []);

  // 7) Imposta totale & netto
  const totalTax = round2(irpefAfterL207 + addReg + addCity);
  const net = round2(R - totalTax); // = G - contrib - totalTax

  return {
    lordo: round2(G),
    netto: net,
    contrib,
    imponibile: round2(R),
    irpef: round2(irpef),
    detraz: round2(detraz),
    l207Discount: l207.discount,
    l207Extra: l207.extraDeduction,
    irpefAfterL207: round2(irpefAfterL207),
    addReg,
    addCity,
    totalTax,
  };
}

/**
 * NETTO → LORDO (ricerca binaria)
 */
function computeFromNettoDynamic(targetNet, p, maxIter = 50) {
  const tol = 0.01; // 1 cent di tolleranza (più precisa)
  let low = Number(targetNet) || 0;
  let high = Math.max(low * 4, low + 50000); // margine più ampio per stipendi alti
  let bestG = low;
  let bestDiff = Infinity;

  console.log(`🔍 [Netto→Lordo] Target: €${targetNet}, Range: €${low} - €${high}`);

  for (let iter = 0; iter < maxIter; iter++) {
    const mid = (low + high) / 2;
    const result = computeFromLordoDynamic(mid, p);
    const diff = result.netto - targetNet;
    const absDiff = Math.abs(diff);

    console.log(`   Iter ${iter}: G=€${mid.toFixed(2)}, N=€${result.netto.toFixed(2)}, diff=€${diff.toFixed(2)}`);

    // Tieni traccia del miglior risultato
    if (absDiff < bestDiff) {
      bestDiff = absDiff;
      bestG = mid;
    }

    if (absDiff <= tol) {
      console.log(`✅ [Netto→Lordo] Convergenza raggiunta: G=€${mid.toFixed(2)}, N=€${result.netto.toFixed(2)}`);
      bestG = mid;
      break;
    }
    if (diff < 0) {
      // netto troppo basso ⇒ serve più lordo
      low = mid;
    } else {
      // netto troppo alto ⇒ serve meno lordo
      high = mid;
    }
  }

  const finalResult = computeFromLordoDynamic(bestG, p);
  console.log(`🎯 [Netto→Lordo] Finale: G=€${finalResult.lordo.toFixed(2)}, N=€${finalResult.netto.toFixed(2)}, diff=€${(finalResult.netto - targetNet).toFixed(2)}`);
  
  return finalResult;
}

/** Helpers */
function round2(v) {
  return Math.round((Number(v) || 0) * 100) / 100;
}
function round4(v) {
  return Math.round((Number(v) || 0) * 10000) / 10000;
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
  detrazioneArt13Default,
  computeFromLordoDynamic,
  computeFromNettoDynamic,
};
