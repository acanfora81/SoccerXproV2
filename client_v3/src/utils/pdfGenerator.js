// client_v3/src/utils/pdfGenerator.js
// Report PDF professionale per modulo Scouting - Soccer X Pro
import jsPDF from 'jspdf';
import { apiFetch } from './apiClient';

// ===============================
// CONFIGURAZIONE GRAFICA / THEME
// ===============================
const THEME = {
  primary: '#1e40af',      // Blu brand
  secondary: '#64748b',    // Grigio secondario
  text: '#0f172a',         // Testo scuro
  textLight: '#475569',
  surface: '#f8fafc',      // Sfondo box
  accent: '#3b82f6',       // Accent (barre)
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  pitch: '#10b981',        // Verde campo
};

const PAGE = {
  margin: 15,
  headerHeight: 30,
  footerHeight: 14,
};

// ===============================
// UTILITIES DI LAYOUT
// ===============================
const createLayouter = (doc) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = PAGE.margin;
  let cursorY = PAGE.headerHeight + 10;

  const setFont = (size = 10, style = 'normal', color = THEME.text) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    const rgb = hexToRgb(color);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
  };

  const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };

  const addHeader = () => {
    // Barra header
    const { r, g, b } = hexToRgb(THEME.primary);
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageWidth, PAGE.headerHeight, 'F');

    // Titoli
    setFont(16, 'bold', '#ffffff');
    doc.text('SOCCER X PRO', margin, 18);
    setFont(10, 'normal', '#ffffff');
    doc.text('SCOUTING REPORT', margin, 25);
    setFont(8, 'normal', '#ffffff');
    doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth - margin - 50, 25);
  };

  const addFooter = (pageIndex, total) => {
    // Riga sottile
    const { r, g, b } = hexToRgb(THEME.secondary);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - PAGE.footerHeight, pageWidth - margin, pageHeight - PAGE.footerHeight);

    setFont(7, 'normal', THEME.secondary);
    doc.text('© 2025 Soccer X Pro | Sistema di Scouting Professionale', margin, pageHeight - 6);
    doc.text(`Pagina ${pageIndex} di ${total}`, pageWidth - margin - 28, pageHeight - 6);
  };

  const addWatermark = () => {
    setFont(40, 'bold', '#e2e8f0'); // grigio molto chiaro
    doc.text('SOCCER X PRO', pageWidth / 2, pageHeight / 2, { angle: 45, align: 'center' });
  };

  const ensureSpace = (needed = 10) => {
    if (cursorY + needed > pageHeight - PAGE.footerHeight - 6) {
      finalizePage();
      doc.addPage();
      addHeader();
      addWatermark();
      cursorY = PAGE.headerHeight + 10;
    }
  };

  const finalizePage = () => {
    const total = doc.internal.getNumberOfPages();
    const pageIndex = doc.internal.getCurrentPageInfo().pageNumber;
    addFooter(pageIndex, total);
  };

  const sectionTitle = (title) => {
    ensureSpace(16);
    // Banda sottile di sezione
    const { r, g, b } = hexToRgb(THEME.surface);
    doc.setFillColor(r, g, b);
    doc.rect(margin - 2, cursorY - 6, pageWidth - 2 * margin + 4, 12, 'F');
    setFont(12, 'bold', THEME.primary);
    doc.text(title, margin, cursorY + 3);
    cursorY += 14;
  };

  const text = (t, x, y, size = 10, color = THEME.text, style = 'normal') => {
    setFont(size, style, color);
    doc.text(String(t ?? ''), x, y);
  };

  const wrapText = (t, width) => {
    setFont(10);
    return doc.splitTextToSize(String(t ?? ''), width);
  };

  const keyValueTable = (pairs, startX, colWidth, rowH = 8) => {
    console.log('keyValueTable called with:', { startX, colWidth, rowH, pairsCount: pairs.length });
    // box chiaro per riga con label a sinistra e valore centrato
    pairs.forEach(([label, value], i) => {
      ensureSpace(rowH + 2);
      const y = cursorY + i * rowH;
      const rectY = Math.max(0, y - 5); // Assicuriamoci che y non sia negativo
      const { r, g, b } = hexToRgb('#f1f5f9');
      doc.setFillColor(r, g, b);
      
      // Validazione parametri rect
      if (startX >= 0 && colWidth > 0 && rowH > 0 && rectY >= 0) {
        console.log(`Drawing rect: x=${startX}, y=${rectY}, w=${colWidth}, h=${rowH}`);
        doc.rect(startX, rectY, colWidth, rowH, 'F');
      } else {
        console.warn('Invalid rect parameters:', { startX, rectY, colWidth, rowH });
      }
      
      setFont(9, 'bold', THEME.primary);
      doc.text(label, startX + 3, y);
      setFont(9, 'normal', THEME.text);
      doc.text(value || '-', startX + colWidth / 2, y, { align: 'center' });
    });
    cursorY += pairs.length * rowH + 4;
  };

  const twoCols = () => {
    const available = pageWidth - 2 * margin;
    const gap = 10;
    const colW = (available - gap) / 2;
    const result = {
      leftX: margin,
      rightX: margin + colW + gap,
      colW,
    };
    console.log('twoCols result:', result);
    return result;
  };

  const scoreBar = (label, score, x, width) => {
    const h = 5;
    ensureSpace(12);
    setFont(9, 'normal', THEME.text);
    doc.text(`${label} (${score ?? '-'}/10)`, x, cursorY);
    const bg = hexToRgb('#e5e7eb');
    doc.setFillColor(bg.r, bg.g, bg.b);
    doc.rect(x, cursorY + 2, width, h, 'F');
    if (typeof score === 'number') {
      const filled = Math.max(0, Math.min(1, score / 10)) * width;
      const acc = hexToRgb(THEME.accent);
      doc.setFillColor(acc.r, acc.g, acc.b);
      doc.rect(x, cursorY + 2, filled, h, 'F');
    }
    cursorY += 12;
  };

  const bullets = (items, maxWidth) => {
    items.forEach((it) => {
      ensureSpace(8);
      const lines = wrapText(`• ${it}`, maxWidth);
      lines.forEach((ln) => {
        ensureSpace(5);
        setFont(9, 'normal', THEME.text);
        doc.text(ln, margin, cursorY);
        cursorY += 4.5;
      });
    });
    cursorY += 2;
  };

  return {
    pageWidth,
    pageHeight,
    margin,
    get cursorY() { return cursorY; },
    set cursorY(val) { cursorY = val; },
    setFont,
    addHeader,
    addFooter,
    addWatermark,
    ensureSpace,
    finalizePage,
    sectionTitle,
    text,
    wrapText,
    keyValueTable,
    twoCols,
    scoreBar,
    bullets,
    hexToRgb,
  };
};

// ===============================
// FUNZIONI DI DISEGNO SPECIFICHE
// ===============================
const drawPitch = (doc, layout, formations, yStart) => {
  const { pageWidth, margin, hexToRgb } = layout;
  const width = (pageWidth - 2 * margin - 10) / 2;  // per stare in due colonne con gap 10
  const height = 70; // pitch compatto
  const x = margin;  // lo disegno in colonna sinistra
  let y = yStart;

  layout.ensureSpace(height + 14);

  // Sfondo campo
  const pitch = hexToRgb(THEME.pitch);
  doc.setFillColor(pitch.r, pitch.g, pitch.b);
  doc.rect(x, y, width, height, 'F');

  // Bianchi per linee
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  // Bordo
  doc.rect(x, y, width, height);
  // Metà campo
  doc.line(x + width / 2, y, x + width / 2, y + height);
  // Cerchio centrale
  doc.circle(x + width / 2, y + height / 2, 8, 'S');
  // Aree di rigore semplificate
  doc.rect(x, y + height / 2 - 14, 14, 28, 'S');
  doc.rect(x + width - 14, y + height / 2 - 14, 14, 28, 'S');

  // Giocatori
  const prospectFormation = formations.find(f => f.teamSide === 'PROSPECT');
  const opponentFormation = formations.find(f => f.teamSide === 'OPPONENT');

  const drawPlayer = (px, py, color, number) => {
    doc.setFillColor(color.r, color.g, color.b);
    doc.circle(px, py, 2.3, 'F');
    if (number) {
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.text(String(number), px, py + 1.7, { align: 'center' });
    }
  };

  const red = layout.hexToRgb('#dc2626');
  const blue = layout.hexToRgb('#2563eb');

  const placePlayers = (formation, dotColor) => {
    if (!formation?.positions) return;
    formation.positions.forEach((pl) => {
      if (typeof pl.x === 'number' && typeof pl.y === 'number') {
        const px = x + (Math.max(0, Math.min(100, pl.x)) / 100) * width;
        const py = y + (Math.max(0, Math.min(100, pl.y)) / 100) * height;
        drawPlayer(px, py, dotColor, pl.number);
      }
    });
  };

  placePlayers(prospectFormation, red);
  placePlayers(opponentFormation, blue);

  // Didascalie formazioni (colonna destra "info" del campo)
  const infoX = x + width + 8;
  let infoY = y + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  if (prospectFormation?.formation) {
    doc.text(`Prospect: ${prospectFormation.formation}`, infoX, infoY);
    infoY += 6;
  }
  if (opponentFormation?.formation) {
    doc.text(`Avversario: ${opponentFormation.formation}`, infoX, infoY);
    infoY += 6;
  }

  return y + height + 10;
};

const drawAttachments = (doc, layout, data) => {
  const { margin, pageWidth } = layout;
  const colW = pageWidth - 2 * margin;

  layout.sectionTitle('ALLEGATI');
  layout.ensureSpace(10);

  if (data.videoLink) {
    layout.setFont(9, 'bold', THEME.primary);
    doc.text('Video:', margin, layout.cursorY);
    layout.setFont(9, 'normal', THEME.text);
    // Fallback per textWithLink che potrebbe non esistere
    try {
      if (typeof doc.textWithLink === 'function') {
        doc.textWithLink(data.videoLink, margin + 22, layout.cursorY, { url: data.videoLink });
      } else {
        doc.text(data.videoLink, margin + 22, layout.cursorY);
      }
    } catch {
      doc.text(data.videoLink, margin + 22, layout.cursorY);
    }
    layout.cursorY += 8;
  }
  if (data.attachmentUrl) {
    layout.setFont(9, 'bold', THEME.primary);
    doc.text('Allegato:', margin, layout.cursorY);
    layout.setFont(9, 'normal', THEME.text);
    try {
      if (typeof doc.textWithLink === 'function') {
        doc.textWithLink(data.attachmentUrl, margin + 28, layout.cursorY, { url: data.attachmentUrl });
      } else {
        doc.text(data.attachmentUrl, margin + 28, layout.cursorY);
      }
    } catch {
      doc.text(data.attachmentUrl, margin + 28, layout.cursorY);
    }
    layout.cursorY += 8;
  }
  if (!data.videoLink && !data.attachmentUrl) {
    layout.setFont(9, 'normal', THEME.textLight);
    doc.text('Nessun allegato.', margin, layout.cursorY);
    layout.cursorY += 6;
  }
};

const getRoleLabel = (role) => {
  const roles = {
    'GK': 'Portiere',
    'CB': 'Difensore Centrale',
    'FB': 'Terzino',
    'RB': 'Terzino Destro',
    'LB': 'Terzino Sinistro',
    'DM': 'Mediano',
    'CM': 'Centrocampista',
    'AM': 'Trequartista',
    'W': 'Ala',
    'RW': 'Ala Destra',
    'LW': 'Ala Sinistra',
    'CF': 'Attaccante',
    'ST': 'Attaccante',
  };
  return roles[role] || role || 'Non specificato';
};

const fmtDate = (d) => {
  if (!d) return 'Non specificato';
  try { 
    return new Date(d).toLocaleDateString('it-IT'); 
  } catch { 
    return 'Data non valida'; 
  }
};

// Mappers robusti per altezze/pesi che possono avere nomi diversi nelle API
const getHeightLabel = (prospect) => {
  if (!prospect) return '—';
  const cm = [
    prospect.height,
    prospect.heightCm,
    prospect.height_cm,
  ].find(v => typeof v === 'number' || (typeof v === 'string' && v.trim() !== ''));
  return cm ? `${cm} cm` : '—';
};

const getWeightLabel = (prospect) => {
  if (!prospect) return '—';
  const kg = [
    prospect.weight,
    prospect.weightKg,
    prospect.weight_kg,
  ].find(v => typeof v === 'number' || (typeof v === 'string' && v.trim() !== ''));
  return kg ? `${kg} kg` : '—';
};

// ===============================
// DATA LOADER (completo con gestione errori)
// ===============================
const loadCompleteReportData = async (reportId) => {
  try {
    console.log('Loading report data for ID:', reportId);
    // Report
    const report = await apiFetch(`/scouting/reports/${reportId}`);
    console.log('Report response:', report);
    const reportData = report?.data || report || {};
    const prospectId = reportData?.prospect?.id;
    console.log('Prospect ID:', prospectId);

    if (!prospectId) {
      throw new Error('Dati report incompleti (prospect mancante).');
    }

    // Prospect
    console.log('Loading prospect data for ID:', prospectId);
    const prospect = await apiFetch(`/scouting/prospects/${prospectId}`);
    console.log('Prospect response:', prospect);
    const prospectData = prospect?.data || prospect || {};

    // Sessioni del prospect
    let sessionsData = [];
    try {
      console.log('Loading sessions for prospect:', prospectId);
      const sessions = await apiFetch(`/scouting/sessions?prospectId=${prospectId}`);
      sessionsData = sessions?.data || sessions || [];
      console.log('Sessions loaded:', sessionsData.length);
    } catch (error) {
      console.warn('Error loading sessions:', error);
    }

    // Altri report del prospect
    let reportsData = [];
    try {
      console.log('Loading reports for prospect:', prospectId);
      const reports = await apiFetch(`/scouting/reports?prospectId=${prospectId}`);
      reportsData = reports?.data || reports || [];
      console.log('Reports loaded:', reportsData.length);
    } catch (error) {
      console.warn('Error loading reports:', error);
    }

  // Formazioni della sessione corrente (se presente)
  let formations = [];
  const sessionId = reportData?.session?.id || reportData?.sessionId;
  if (sessionId) {
      try {
      console.log('Loading formations for session:', sessionId);
      const resp = await apiFetch(`/scouting/sessions/${sessionId}/formations`);
        formations = resp?.data || resp || [];
        console.log('Formations loaded:', formations.length);
      } catch (e) {
        console.warn('Error loading formations:', e);
        formations = [];
      }
    } else {
      console.log('No session ID found in report data');
    }

    return {
      ...reportData,
      prospect: prospectData,
      allSessions: sessionsData,
      allReports: reportsData,
      formations,
    };
  } catch (error) {
    console.error('Error loading complete report data:', error);
    throw new Error('Impossibile caricare i dati del report');
  }
};

// ===============================
// ENTRYPOINT PRINCIPALE
// ===============================
export const generateScoutingReportPDF = async (reportId) => {
  console.log('Starting PDF generation for report:', reportId);
  
  const doc = new jsPDF({ unit: 'pt', format: 'a4' }); // pt = punti → migliore precisione
  const layout = createLayouter(doc);

  try {
    console.log('Step 1: Adding header and watermark');
    // 1) Header + watermark
    layout.addHeader();
    layout.addWatermark();

    console.log('Step 2: Loading complete report data');
    // 2) Caricamento dati completi
    const data = await loadCompleteReportData(reportId);
    console.log('Data loaded successfully:', data);

    console.log('Step 3: Adding prospect and match information');
    // 3) Sezione: INFORMAZIONI PROSPECT + DETTAGLI MATCH (due colonne)
    layout.sectionTitle('INFORMAZIONI & MATCH');
    const { leftX, rightX, colW } = layout.twoCols();

    const prospectName =
      data.prospect?.fullName
      || `${data.prospect?.firstName || ''} ${data.prospect?.lastName || ''}`.trim()
      || 'N/A';

    console.log('Prospect name:', prospectName);

    // Colonna sinistra: Prospect
    layout.keyValueTable([
      ['Nome', prospectName],
      ['Ruolo', getRoleLabel(data.prospect?.mainPosition)],
      ['Club', data.prospect?.currentClub || '—'],
      ['Nascita', fmtDate(data.prospect?.birthDate)],
      ['Nazionalità', data.prospect?.nationalityPrimary || '—'],
      ['Altezza', getHeightLabel(data.prospect)],
      ['Peso', getWeightLabel(data.prospect)],
      ['Piede', data.prospect?.preferredFoot || '—'],
      ['Valore Mercato', data.prospect?.marketValue ? `€ ${Number(data.prospect.marketValue).toLocaleString('it-IT')}` : '—'],
      ['Clausola', data.prospect?.releaseClause ? `€ ${Number(data.prospect.releaseClause).toLocaleString('it-IT')}` : '—'],
    ], leftX, colW);

    // Manteniamo una baseline comune per entrambe le colonne
    const leftTableHeight = (10 /*rows*/ * 8 /*rowH*/) + 4;
    const startY = layout.cursorY - leftTableHeight; // torna alla baseline iniziale
    layout.cursorY = startY;

    // Colonna destra: Match
    layout.keyValueTable([
      ['Data Partita', fmtDate(data.matchDate)],
      ['Avversario', data.opponent || '—'],
      ['Competizione', data.competition || '—'],
      ['Ruolo Giocato', getRoleLabel(data.rolePlayed)],
      ['Minuti', data.minutesPlayed ? `${data.minutesPlayed}'` : '—'],
    ], rightX, colW);

    // Porta il cursore sotto la colonna più lunga
    const rightTableHeight = (5 /*rows*/ * 8 /*rowH*/) + 4;
    layout.cursorY = startY + Math.max(leftTableHeight, rightTableHeight) + 2;

    console.log('Step 4: Adding technical evaluations');
    // 4) Sezione: VALUTAZIONI TECNICHE
    layout.sectionTitle('VALUTAZIONI TECNICHE');
    const leftScoresX = leftX;
    const rightScoresX = rightX;
    const barW = colW;
    const scores = [
      { label: 'Tecnica', value: data.techniqueScore },
      { label: 'Tattica', value: data.tacticsScore },
      { label: 'Fisico', value: data.physicalScore },
      { label: 'Mentalità', value: data.mentalityScore },
    ];
    // Sinistra: due barre
    layout.scoreBar(scores[0].label, scores[0].value, leftScoresX, barW);
    layout.scoreBar(scores[1].label, scores[1].value, leftScoresX, barW);
    // Destra: due barre
    // riallineiamo y per non "sdraiare" la sezione
    const tmpY = layout.cursorY;
    layout.cursorY = tmpY - 24; // riporta su per la colonna destra
    layout.scoreBar(scores[2].label, scores[2].value, rightScoresX, barW);
    layout.scoreBar(scores[3].label, scores[3].value, rightScoresX, barW);

    // Totale medio
    const valid = scores.filter(s => typeof s.value === 'number');
    const totalScore = valid.length ? (valid.reduce((a,b)=>a+b.value, 0) / valid.length) : null;

    layout.ensureSpace(12);
    layout.setFont(10, 'bold', THEME.primary);
    doc.text('PUNTEGGIO TOTALE', rightScoresX, layout.cursorY);
    layout.setFont(14, 'bold', THEME.primary);
    doc.text(totalScore != null ? `${totalScore.toFixed(1)}/10` : '—', rightScoresX, layout.cursorY + 12);
    layout.cursorY += 18;

    console.log('Step 5: Adding formations');
    // 5) Sezione: FORMAZIONI (campo)
    layout.sectionTitle('FORMAZIONI');
    if (Array.isArray(data.formations) && data.formations.length > 0) {
      console.log('Drawing pitch with formations:', data.formations);
      const afterPitchY = drawPitch(doc, layout, data.formations, layout.cursorY);
      layout.cursorY = afterPitchY;
    } else {
      console.log('No formations found');
      layout.setFont(9, 'normal', THEME.textLight);
      doc.text('Nessuna formazione salvata per questa sessione.', layout.margin, layout.cursorY);
      layout.cursorY += 8;
    }

    // 6) Sezione: RIASSUNTO / NOTE
    if (data.summary) {
      layout.sectionTitle('RIASSUNTO PERFORMANCE');
      const lines = layout.wrapText(data.summary, layout.pageWidth - 2 * layout.margin);
      lines.forEach(line => {
        layout.ensureSpace(5);
        layout.setFont(10, 'normal', THEME.text);
        doc.text(line, layout.margin, layout.cursorY);
        layout.cursorY += 12;
      });
    }

    // 7) Sezione: ALLEGATI
    drawAttachments(doc, layout, data);

    // 8) Sezione: STORICO (ultime 3)
    if (Array.isArray(data.allSessions) && data.allSessions.length > 0) {
      layout.sectionTitle('STORICO SESSIONI (ultime 3)');
      const latest = data.allSessions.slice(0, 3);
      const items = latest.map(s => `${fmtDate(s.dateObserved)} — ${s.opponent || 'N/A'} (${s.competition || 'N/A'})`);
      layout.bullets(items, layout.pageWidth - 2 * layout.margin);
    }

    if (Array.isArray(data.allReports) && data.allReports.length > 1) {
      layout.sectionTitle('STORICO REPORT (ultimi 3)');
      const latestR = data.allReports.slice(0, 3);
      const items = latestR.map(r => `${fmtDate(r.matchDate)} — ${r.opponent || 'N/A'} (${typeof r.totalScore === 'number' ? r.totalScore.toFixed(1) : '—'}/10)`);
      layout.bullets(items, layout.pageWidth - 2 * layout.margin);
    }

    // 9) Footer pagina/e
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const total = totalPages; // ricalcolo per sicurezza
      const info = doc.internal.getCurrentPageInfo();
      const idx = info.pageNumber;
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      const m = PAGE.margin;

      // linea + testi
      const sec = THEME.secondary.replace('#','');
      const sr = parseInt(sec.substring(0, 2), 16);
      const sg = parseInt(sec.substring(2, 4), 16);
      const sb = parseInt(sec.substring(4, 6), 16);
      doc.setDrawColor(sr, sg, sb);
      doc.setLineWidth(0.2);
      doc.line(m, h - PAGE.footerHeight, w - m, h - PAGE.footerHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(sr, sg, sb);
      doc.text('© 2025 Soccer X Pro | Sistema di Scouting Professionale', m, h - 6);
      doc.text(`Pagina ${idx} di ${total}`, w - m - 28, h - 6);
    }

    console.log('Step 10: Saving PDF');
    // 10) Salva
    const safeName = (String(prospectName || 'Prospect').replace(/\s+/g, '_') || 'Prospect');
    const safeDate = (fmtDate(data.matchDate) || 'data').replace(/\//g, '-');
    const fileName = `Report_${safeName}_${safeDate}.pdf`;
    console.log('Saving file:', fileName);
    doc.save(fileName);
    console.log('PDF generated successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      reportId
    });
    // In caso di errore, tentiamo comunque di avere un footer corretto sulla pagina corrente
    try {
      layout.finalizePage();
    } catch (finalizeError) {
      console.error('Error finalizing page:', finalizeError);
    }
    throw error;
  }
};