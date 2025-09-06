// server/src/routes/performance.js
// Routes per gestione dati performance SoccerXpro V2 - MULTI-TENANT FIXED

const express = require("express");
const { authenticate } = require("../middleware/auth");
const tenantContext = require("../middleware/tenantContext"); // 🔧 AGGIUNTO
const {
  getPerformanceData,
  getPerformanceDataById,
  createPerformanceData,
  deletePerformanceData,
  getSessionsByPlayer  // 🔴 FIX: Aggiungi questa riga qui
} = require("../controllers/performance");
const { getPrismaClient } = require("../config/database");
const smartColumnMapper = require("../utils/columnMapper");
const { dlog, dwarn, derr } = require("../utils/logger");
const { computeHSR, computeSprintPer90, calculateACWR, buildPeriodRange, parseSessionTypeFilter, parseSessionTypeFilterSimple, round } = require("../utils/kpi");

const { validateMapping } = require("../validation/mappingSchema");
const fsAsync = require("fs").promises;

// 🔧 AGGIUNTE per preview-mapping con file upload
const multer = require("multer");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const { completeRow } = require("../utils/gpsDeriver.js");

const upload = multer({ dest: "uploads/" });

dlog("🟢 [INFO] Caricamento route performance multi-tenant...");

const router = express.Router();

// 🔧 FIX: Funzione per parsing sessionType con mapping frontend→database
function parseSessionTypeFilterFixed(sessionType) {
  dlog('🔵 [DEBUG] parseSessionTypeFilter: input:', sessionType);
  
  if (!sessionType || sessionType === 'all') return null;
  
  // Mapping esplicito frontend → database
  const mapping = {
    'training': 'allenamento',
    'match': 'partita',
    'allenamento': 'allenamento', // già corretto
    'partita': 'partita' // già corretto
  };
  
  const mapped = mapping[sessionType.toLowerCase()] || sessionType;
  dlog('🟢 [INFO] sessionType mapping:', sessionType, '→', mapped);
  return mapped;
}

// 🔧 FIX: Parser per players filter
function parsePlayersFilter(playersParam) {
  if (!playersParam || playersParam === 'all') return [];
  return playersParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
}

// 🟠 Configurazioni ottimizzazione import (configurabili via ENV)
const BATCH_SIZE = Math.max(
  1,
  parseInt(process.env.IMPORT_BATCH_SIZE || "50", 10) || 50
); // Record per batch - RIDOTTO da 100 a 50
const TRANSACTION_TIMEOUT =
  parseInt(process.env.IMPORT_TX_TIMEOUT_MS || "60000", 10) || 60000; // ms - AUMENTATO da 20s a 60s
const BATCH_DELAY_MS =
  parseInt(process.env.IMPORT_BATCH_DELAY_MS || "100", 10) || 100; // ms - AGGIUNTO delay di 100ms

// 🔐 Middleware di autenticazione + tenant context per tutte le route
router.use(authenticate, tenantContext); // 🔧 FIXED - Aggiunto tenantContext

// 🔧 FIX: Monta il sotto-router di compare PRIMA delle route parametriche (/:id)
// per evitare che "/compare" venga interpretato come ":id" e causi INVALID_ID
try {
  const compareRouter = require('./performance/compare');
  router.use('/compare', compareRouter);
} catch (e) {
  dwarn('⚠️ Impossibile montare compare router in anticipo:', e?.message);
}

// Helper: valida parametro numerico
const ensureNumericParam = (paramName) => (req, res, next) => {
  const val = Number(req.params[paramName]);
  if (!Number.isInteger(val) || val <= 0) {
    return res.status(400).json({
      error: `Parametro ${paramName} non valido`,
      code: "INVALID_ID",
    });
  }
  next();
};

/**
 * 📁 POST /api/performance/upload
 * Step 1 → Carica file e restituisci intestazioni
 */
router.post("/import/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;
  if (!filePath) {
    return res.status(400).json({ error: "File mancante" });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  let headers = [];

  try {
    if (ext === ".csv") {
      const firstLine =
        fs.readFileSync(filePath, "utf8").split(/\r?\n/)[0] || "";
      const sep = firstLine.includes(";") ? ";" : ",";
      headers = firstLine
        .split(sep)
        .map((h) =>
          h
            .replace(/^\uFEFF/, "")
            .replace(/(^"|"$)/g, "")
            .trim()
        )
        .filter(Boolean);
    } else if (ext === ".xlsx" || ext === ".xls") {
      const wb = xlsx.readFile(filePath, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(ws, { raw: false });
      headers = rows.length
        ? Object.keys(rows[0]).map((h) => h.replace(/^\uFEFF/, "").trim())
        : [];
    } else {
      return res.status(400).json({ error: "Formato non supportato" });
    }

    return res.json({
      ok: true,
      headers,
      fileId: path.basename(filePath),
      originalExtension: ext,
    });
  } catch (err) {
    derr("🔴 Upload error:", err);
    return res.status(500).json({
      error: "Errore interno upload",
      details: err.message,
    });
  }
});

/**
 * 🧠 POST /api/performance/map-columns
 * Smart Column Mapping per CSV headers → DB fields
 */
router.post("/map-columns", async (req, res) => {
  try {
    // ✅ Validazione input
    const { headers, teamId: requestTeamId } = req.body;
    const teamId = req.context.teamId; // Multi-tenant context

    console.log(
      "🔵 Smart mapping richiesto per team:",
      teamId,
      "- Headers:",
      headers?.length
    ); // INFO DEV - rimuovere in produzione

    // Validazione base
    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return res.status(400).json({
        error: "Headers array richiesto",
        code: "INVALID_HEADERS",
      });
    }

    if (headers.length > 50) {
      return res.status(400).json({
        error: "Troppi headers (max 50)",
        code: "TOO_MANY_HEADERS",
      });
    }

    // Security check: teamId consistency
    if (requestTeamId && requestTeamId !== teamId) {
      console.log(
        "🟡 TeamId mismatch - context:",
        teamId,
        "request:",
        requestTeamId
      ); // WARNING - rimuovere in produzione
      return res.status(403).json({
        error: "Team ID non consistente",
        code: "TEAM_MISMATCH",
      });
    }

    // 🧠 Generate smart mapping usando columnMapper
    console.log("🔵 [DEBUG] Invocazione smart mapper per headers:", headers); // INFO DEV - rimuovere in produzione
    console.log("🔍 Team ID nel context:", teamId);
    console.log(
      "🔍 Smart Column Mapper disponibile:",
      typeof smartColumnMapper
    );
    console.log(
      "🔍 Method generateSmartMapping disponibile:",
      typeof smartColumnMapper.generateSmartMapping
    );

    const mappingResult = await smartColumnMapper.generateAutoMapping(
    headers,
    teamId
  );

    // 📊 Log risultato per debugging
    console.log("🟢 [INFO] Smart mapping completato:", {
      headers: headers.length,
      suggestions: Object.keys(mappingResult.suggestions || {}).length,
      confidence: mappingResult.confidence?.average || 0,
      warnings: mappingResult.warnings?.length || 0,
    }); // INFO - rimuovere in produzione

    // ✅ Success response
    return res.json({
      message: "Smart mapping generato con successo",
      data: {
        suggestions: mappingResult.suggestions,
        confidence: mappingResult.confidence,
        warnings: mappingResult.warnings,
        statistics: mappingResult.statistics,
        teamId: teamId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.log("🔴 Errore smart mapping:", error.message); // ERROR - mantenere essenziali

    // Handle specific errors
    if (error.message.includes("Team not found")) {
      return res.status(404).json({
        error: "Team non trovato",
        code: "TEAM_NOT_FOUND",
      });
    }

    if (error.message.includes("Player lookup failed")) {
      return res.status(500).json({
        error: "Errore lookup giocatori team",
        code: "PLAYER_LOOKUP_ERROR",
        details: error.message,
      });
    }

    // Generic error
    return res.status(500).json({
      error: "Errore interno smart mapping",
      code: "MAPPING_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post(
  "/import/preview-mapping",
  upload.single("file"),
  async (req, res) => {
    try {
      const teamId = req.context.teamId;

      // 🔧 1) accetta sia wrapper che mappa pura
      const mappingStr = req.body.mapping || "{}";
      const raw =
        typeof mappingStr === "string" ? JSON.parse(mappingStr) : mappingStr;
      const mapping = raw?.mapping ? raw.mapping : raw;

      const sampleSize = Number(req.body.sampleSize || 10);

      if (!req.file) {
        return res
          .status(400)
          .json({ error: "File richiesto", code: "MISSING_FILE" });
      }
      if (
        !mapping ||
        typeof mapping !== "object" ||
        Object.keys(mapping).length === 0
      ) {
        return res
          .status(400)
          .json({ error: "Mapping richiesto", code: "INVALID_MAPPING" });
      }

      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      let rows = [];

      if (ext === ".csv") {
        const firstLine = fs.readFileSync(filePath, "utf8").split("\n")[0];
        const separator = firstLine.includes(";") ? ";" : ",";
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv({ separator }))
            .on("data", (row) => rows.push(row))
            .on("end", resolve)
            .on("error", reject);
        });
      } else if (ext === ".xlsx") {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      }

      try { 
        await fsAsync.unlink(filePath); 
      } catch (e) { 
        dwarn("Temp file cleanup failed:", e?.message); 
      }

      if (rows.length === 0) {
        return res
          .status(400)
          .json({ error: "Nessun dato trovato nel file", code: "EMPTY_FILE" });
      }

      // 🔧 2) normalizza chiavi: rimuovi BOM + trim (sia nelle righe che nel mapping)
      const strip = (s) =>
        typeof s === "string" ? s.replace(/^\uFEFF/, "").trim() : s;

      const normalizedRows = rows.map((obj) => {
        const out = {};
        Object.keys(obj).forEach((k) => {
          out[strip(k)] = obj[k];
        });
        return out;
      });

      const validated = validateMapping(mapping); // throws se non valido
      const normalizedMapping = {};
      Object.entries(validated).forEach(([csvHeader, desc]) => {
        const cleanHeader = strip(csvHeader);
        normalizedMapping[cleanHeader] = { ...desc, csvHeader: cleanHeader };
      });

      const sampleData = normalizedRows.slice(0, sampleSize);

      const transformResult = await smartColumnMapper.applyMapping(
        sampleData,
        normalizedMapping,
        teamId
      );

      const previewStats = {
        originalRows: normalizedRows.length,
        sampleRows: sampleData.length,
        successfulTransforms: transformResult.stats.successRows,
        errorRows: transformResult.stats.errorRows,
        successRate: transformResult.stats.successRate,
        totalMappedFields: Object.keys(normalizedMapping).length,
      };

      return res.json({
        message: "Preview mapping generato con successo",
        data: {
          transformedData: transformResult.data,
          rows: transformResult.data,
          errors: transformResult.errors,
          warnings: transformResult.warnings,
          statistics: previewStats,
          mapping: { mapping: normalizedMapping }, // opzionale, per debug UI
          teamId,
        },
      });
    } catch (error) {
      console.log("🔴 Errore preview mapping:", error.message);
      return res.status(500).json({
        error: "Errore interno preview mapping",
        code: "PREVIEW_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * 📋 POST /api/performance/import/preview-data
 * Preview dati usando fileId salvato (senza nuovo upload)
 */
router.post("/import/preview-data", async (req, res) => {
  try {
    const teamId = req.context.teamId;
    const { fileId, mapping, originalExtension } = req.body;

    if (!fileId || !mapping) {
      return res.status(400).json({
        error: "fileId e mapping richiesti",
        code: "MISSING_PARAMS",
      });
    }

    const UPLOAD_DIR = path.join(__dirname, "../../uploads");
    const filePath = path.join(UPLOAD_DIR, fileId);

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ error: "File non trovato", code: "FILE_NOT_FOUND" });
    }

    const ext = originalExtension || ".csv";
    let rows = [];

    if (ext === ".csv") {
      const firstLine = fs.readFileSync(filePath, "utf8").split("\n")[0];
      const separator = firstLine.includes(";") ? ";" : ",";
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator }))
          .on("data", (row) => rows.push(row))
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (ext === ".xlsx") {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    const strip = (s) =>
      typeof s === "string" ? s.replace(/^\uFEFF/, "").trim() : s;
    const normalizedRows = rows.slice(0, 10).map((obj) => {
      const out = {};
      Object.keys(obj).forEach((k) => {
        out[strip(k)] = obj[k];
      });
      return out;
    });

    const validated = validateMapping(mapping); // throws se non valido
    const normalizedMapping = {};
    Object.entries(validated).forEach(([csvHeader, desc]) => {
      const cleanHeader = strip(csvHeader);
      normalizedMapping[cleanHeader] = { ...desc, csvHeader: cleanHeader };
    });

    const transformResult = await smartColumnMapper.applyMapping(
      normalizedRows,
      normalizedMapping,
      teamId
    );

    return res.json({
      message: "Preview generata con successo",
      data: {
        transformedData: transformResult.data,
        rows: transformResult.data,
        errors: transformResult.errors,
        warnings: transformResult.warnings,
        statistics: {
          originalRows: rows.length,
          sampleRows: normalizedRows.length,
          successfulTransforms: transformResult.stats.successRows,
          errorRows: transformResult.stats.errorRows,
          successRate: transformResult.stats.successRate,
        },
        teamId,
      },
    });
  } catch (error) {
    console.log("🔴 Errore preview-data:", error.message);
    return res.status(500).json({
      error: "Errore interno preview",
      code: "PREVIEW_ERROR",
      details: error.message,
    });
  }
});

// Aggiungi questo log di debug all'inizio della funzione import-data (riga 453)
/**
 * 🚀 POST /api/performance/import/import-data
 * Import finale usando fileId salvato (senza nuovo upload)
 */
router.post("/import/import-data", async (req, res) => {
  const startTime = Date.now();

  try {
    const teamId = req.context.teamId;
    const createdById = req.context.userId;
    const { fileId, mapping, originalExtension } = req.body;

    // 🟡 === DEBUG IMPORT DATI RICEVUTI === (AGGIUNTO)
    console.log("🟡 [WARN] === IMPORT FINALE DATI RICEVUTI ===");
    console.log("🟡 [WARN] FileId ricevuto:", fileId);
    console.log("🟡 [WARN] Team ID:", teamId);
    console.log("🟡 [WARN] User ID:", createdById);
    console.log("🟡 [WARN] Original extension:", originalExtension);
    console.log("🟡 [WARN] Mapping ricevuto (tipo):", typeof mapping);
    console.log("🟡 [WARN] Mapping ricevuto (chiavi):", Object.keys(mapping || {}));
    console.log("🟡 [WARN] Mapping completo:", JSON.stringify(mapping, null, 2));

    // Debug ogni campo mappato
    if (mapping && typeof mapping === "object") {
      Object.entries(mapping).forEach(([csvHeader, fieldInfo]) => {
        console.log(
          `🟡 ${csvHeader} → ${fieldInfo.dbField} (${fieldInfo.dbField?.startsWith("custom.") ? "CUSTOM" : "PREDEFINITO"})`
        );
      });
    }
    console.log("🟡 [WARN] ================================");

    if (!fileId || !mapping) {
      return res.status(400).json({
        error: "fileId e mapping richiesti per import finale",
        code: "MISSING_PARAMS",
      });
    }

    // Trova il file usando fileId
    const UPLOAD_DIR = path.join(__dirname, "../../uploads");
    const filePath = path.join(UPLOAD_DIR, fileId);

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ error: "File non trovato", code: "FILE_NOT_FOUND" });
    }

    const ext = originalExtension || ".csv";
    let allRows = [];

    // Leggi tutto il file
    console.log("🟡 [WARN] Lettura file:", filePath, "estensione:", ext);

    if (ext === ".csv") {
      const firstLine = fs.readFileSync(filePath, "utf8").split("\n")[0];
      const separator = firstLine.includes(";") ? ";" : ",";
      console.log("🟡 [WARN] CSV separatore:", separator);

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator }))
          .on("data", (row) => allRows.push(row))
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (ext === ".xlsx") {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      allRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    console.log("🟡 [WARN] Righe lette dal file:", allRows.length);
    if (allRows.length > 0) {
      console.log("🟡 [WARN] Prima riga esempio:", Object.keys(allRows[0]));
    }

    // Normalizza e applica mapping usando columnMapper
    const strip = (s) =>
      typeof s === "string" ? s.replace(/^\uFEFF/, "").trim() : s;
    const normalizedRows = allRows.map((obj) => {
      const out = {};
      Object.keys(obj).forEach((k) => {
        out[strip(k)] = obj[k];
      });
      return out;
    });

    const validated = validateMapping(mapping); // throws se non valido
    const normalizedMapping = {};
    Object.entries(validated).forEach(([csvHeader, desc]) => {
      const cleanHeader = strip(csvHeader);
      normalizedMapping[cleanHeader] = { ...desc, csvHeader: cleanHeader };
    });

    console.log("🟡 [WARN] Mapping normalizzato:", Object.keys(normalizedMapping));

    const transformResult = await smartColumnMapper.applyMapping(
      normalizedRows,
      normalizedMapping,
      teamId
    );

    console.log("🟡 [WARN] Risultato trasformazione:", {
      success: transformResult.success,
      dataLength: transformResult.data?.length || 0,
      errorsLength: transformResult.errors?.length || 0,
    });

    if (!transformResult.success || transformResult.data.length === 0) {
      console.log("🔴 Trasformazione fallita o nessun dato valido");
      return res.status(400).json({
        error: "Nessun dato valido per l'import",
        code: "NO_VALID_DATA",
      });
    }

    // 🟢 Auto-learn template se trasformazione andata bene
try {
  await smartColumnMapper.autoLearnTemplateIfGood(
    teamId,
    Object.keys(normalizedMapping), // headers normalizzati
    normalizedMapping,              // mapping applicato
    transformResult.stats,          // statistiche (successRate, ecc.)
    { vendor: 'CSV Import' }        // opzionale: info extra
  );
  console.log("🟢 [INFO] Template auto-salvato (se valido)");
} catch (tplErr) {
  console.log("🟡 [WARN] Auto-learn template skipped:", tplErr.message);
}


    // Debug primi dati trasformati
    if (transformResult.data.length > 0) {
      console.log(
        "🟡 Prima riga trasformata:",
        Object.keys(transformResult.data[0])
      );
      console.log("🟡 [WARN] Esempio valori prima riga:", transformResult.data[0]);
    }

    // Salva nel database usando la stessa logica dell'endpoint originale
    const prisma = getPrismaClient();
    const importResults = {
      successful: [],
      failed: [],
      summary: {
        totalProcessed: transformResult.data.length,
        successfulImports: 0,
        errors: 0,
        playersAffected: new Set(),
        dateRange: null,
        processingTime: null,
      },
    };

    // Import in batch OTTIMIZZATO
    const batches = [];
    for (let i = 0; i < transformResult.data.length; i += BATCH_SIZE) {
      batches.push(transformResult.data.slice(i, i + BATCH_SIZE));
    }

    console.log("🟡 [WARN] Import ottimizzato in", batches.length, "batch di", BATCH_SIZE);
    console.log("🔴 DEBUG TIMEOUT CONFIG:", TRANSACTION_TIMEOUT, "ms");

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      console.log(`🟡 [WARN] Processando batch ${batchIndex + 1}/${batches.length}`); // DEBUG - rimuovere in produzione

      try {
        await prisma.$transaction(async (tx) => {
          for (const rowData of batch) {
            try {
              console.log("🟡 [WARN] Preparazione dati per DB:", {
                playerId: rowData.playerId,
                session_date: rowData.session_date,
                total_distance_m: rowData.total_distance_m,
                sprint_distance_m: rowData.sprint_distance_m,
                // Altri campi principali per debug
              });

              // 🧠 INTEGRAZIONE GPS DERIVER - Completa i dati mancanti
              const partialRow = {
                Player: rowData.playerName || "Sconosciuto",
                Position: rowData.position || "",
                Day: rowData.session_date,
                Match: rowData.session_name === "Match" ? "Yes" : "No",
                T: rowData.duration_minutes || 0,
                "Distanza (m)": rowData.total_distance_m || 0,
                "Dist Equivalente": rowData.equivalent_distance_m || null,
                "Training Load": rowData.training_load || rowData.player_load || null,
                "SMax (kmh)": rowData.top_speed_kmh || null,
                "D 15-20 km/h": rowData.distance_15_20_kmh_m || null,
                "D 20-25 km/h": rowData.distance_20_25_kmh_m || null,
                "D > 25 km/h": rowData.distance_over_25_kmh_m || null,
                "D > 20 W/Kg": rowData.distance_over_20wkg_m || null,
                "D>35 W": rowData.distance_over_35wkg_m || null,
                "D Acc > 2m/s2": rowData.distance_acc_over_2_ms2_m || null,
                "D Dec > -2m/s2": rowData.distance_dec_over_minus2_ms2_m || null,
                "Num Acc > 3 m/s2": rowData.num_acc_over_3_ms2 || null,
                "Num Dec <-3 m/s2": rowData.num_dec_over_minus3_ms2 || null,
                "Pot. met. media": rowData.avg_metabolic_power_wkg || null,
                Drill: rowData.drill_name || null,
                Note: rowData.note || ""
              };

              const { row: completedRow, imputationFlags } = completeRow(partialRow, {
                eqA: 0.6, eqB: 0.8, eqC: 1.6,
                tlK1: 0.5, tlK2: 0.02,
                defaultDrill: "Allenamento Tecnico"
              });

              // Log dei campi imputati per audit
              const imputedFields = Object.entries(imputationFlags)
                .filter(([, wasImputed]) => wasImputed)
                .map(([field]) => field);
              
              if (imputedFields.length > 0) {
  console.log(`🟡 [WARN] Giocatore ${completedRow.Player}: campi imputati:`, imputedFields);
              }

              const performanceData = {
                playerId: rowData.playerId,
                session_date: rowData.session_date,
                session_name: rowData.session_name || null,
                session_name: rowData.session_name || null, // 🟠 AGGIUNTO session_name
                duration_minutes: completedRow.T,
                total_distance_m: completedRow["Distanza (m)"],
                equivalent_distance_m: completedRow["Dist Equivalente"],
                distance_per_min: completedRow["Dist/min"],
                avg_metabolic_power_wkg: completedRow["Pot. met. media"],
                distance_over_20wkg_m: completedRow["D > 20 W/Kg"],
                distance_acc_over_2_ms2_m: completedRow["D Acc > 2m/s2"],
                distance_dec_over_minus2_ms2_m: completedRow["D Dec > -2m/s2"],
                distance_over_15_kmh_m: completedRow["D > 15 Km/h"],
                pct_distance_acc_over_2_ms2: completedRow["%D acc > 2m/s2"],
                pct_distance_dec_over_minus2_ms2: completedRow["%D Dec > -2 m/s2"],
                time_under_5wkg_min: completedRow["T/min <5 W/kg"],
                time_5_10_wkg_min: completedRow["T/min 5-10 W/Kg"],
                distance_15_20_kmh_m: completedRow["D 15-20 km/h"],
                distance_20_25_kmh_m: completedRow["D 20-25 km/h"],
                distance_over_25_kmh_m: completedRow["D > 25 km/h"],
                top_speed_kmh: completedRow["SMax (kmh)"],
                acc_events_per_min_over_2_ms2: completedRow["D Acc/min > 2 m/s2"],
                dec_events_per_min_over_minus2_ms2: completedRow["D Dec/min > -2m/s2"],
                rvp_index: completedRow.RVP,
                distance_over_35wkg_m: completedRow["D>35 W"],
                training_load: completedRow["Training Load"],
                distance_over_20_kmh_m: completedRow["D > 20 km/h"],
                distance_acc_over_3_ms2_m: completedRow["D Acc > 3 m/s2"],
                distance_dec_over_minus3_ms2_m: completedRow["D Dec < -3 m/s2"],
                num_acc_over_3_ms2: completedRow["Num Acc > 3 m/s2"],
                num_dec_over_minus3_ms2: completedRow["Num Dec <-3 m/s2"],
                max_power_5s_wkg: completedRow.MaxPM5,
                is_match: completedRow.Match === "Yes",
                drill_name: completedRow.Drill,
                notes: (rowData?.notes != null ? rowData.notes : (completedRow?.Note ?? null)),
                // Campi legacy per compatibilità
                sprint_distance_m: rowData.sprint_distance_m || null,
                avg_speed_kmh: rowData.avg_speed_kmh || null,
                player_load: rowData.player_load || null,
                high_intensity_runs: rowData.high_intensity_runs || null,
                max_heart_rate: rowData.max_heart_rate || null,
                avg_heart_rate: rowData.avg_heart_rate || null,
                source_device: rowData.source_device || "CSV Import",
                extras: rowData.extras || null, // 👈 AGGIUNTO
                created_by: { connect: { id: createdById } },
              };

              const { playerId, ...dataWithoutPlayerId } = performanceData;

              const created = await tx.performanceData.create({
                data: {
                  ...dataWithoutPlayerId,
                  player: {
                    connect: { id: playerId },
                  },
                  team: {
                    connect: { id: teamId }, // AGGIUNGI QUESTA RIGA
                  },
                },
              });

              console.log("🟢 [INFO] Record creato:", created.id);

              importResults.successful.push({
                id: created.id,
                playerName: rowData.playerName || "",
                sessionDate: created.session_date,
              });

              importResults.summary.playersAffected.add(playerId);
            } catch (rowError) {
              console.log("🔴 Errore inserimento riga:", rowError.message);
              importResults.failed.push({
                data: rowData,
                error: rowError.message,
              });
            }
          }
        }, {
          timeout: TRANSACTION_TIMEOUT, // 🔴 FIX: Aggiunto timeout
          isolationLevel: 'ReadCommitted' // 🔴 FIX: Aggiunto isolamento
        });

        dlog("Import batch processed:", { batchIndex, batchSize: batch.length });

        // 🟠 Pausa tra batch per evitare sovraccarico database (configurabile)
        if (BATCH_DELAY_MS > 0 && (batchIndex + 1 < batches.length)) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }

      } catch (batchError) {
        derr("Import batch error:", batchError?.message);
        
        // Segna tutto il batch come fallito
        batch.forEach((rowData) => {
          importResults.failed.push({
            data: rowData,
            error: `Batch error: ${batchError.message}`,
          });
        });
      }
    }


    // Calcola statistiche finali
    const endTime = Date.now();
    const processingTime = `${((endTime - startTime) / 1000).toFixed(2)}s`;

    importResults.summary.successfulImports = importResults.successful.length;
    importResults.summary.errors = importResults.failed.length;
    importResults.summary.successRate = Math.round(
      (importResults.summary.successfulImports /
        importResults.summary.totalProcessed) *
        100
    );
    importResults.summary.playersAffected =
      importResults.summary.playersAffected.size;
    importResults.summary.processingTime = processingTime;

    console.log("🟢 [INFO] Import completato:", importResults.summary);

    // Cleanup file
    try { 
      await fsAsync.unlink(filePath); 
    } catch (e) { 
      dwarn("Temp file cleanup failed:", e?.message); 
    }

    return res.json({
      message: "Import completato con successo",
      data: {
        summary: importResults.summary,
        errors: importResults.failed.slice(0, 10),
        successful: importResults.successful.slice(0, 5),
        hasMoreErrors: importResults.failed.length > 10,
      },
    });
  } catch (error) {
    derr("Import error:", error?.message);

    return res.status(500).json({
      error: "Errore interno durante import finale",
      code: "IMPORT_ERROR",
    });
  }
});

/**
 * 📤 POST /api/performance/save-template
 * Salva template mapping per riutilizzo futuro
 */
router.post("/save-template", async (req, res) => {
  try {
    const { templateName, mapping, description } = req.body;
    const teamId = req.context.teamId;
    const userId = req.context.userId;

    console.log("🔵 [DEBUG] Salvataggio template:", templateName, "per team:", teamId);

    if (
      !templateName ||
      typeof templateName !== "string" ||
      templateName.trim().length === 0
    ) {
      return res.status(400).json({
        error: "Nome template richiesto",
        code: "INVALID_TEMPLATE_NAME",
      });
    }

    if (
      !mapping ||
      typeof mapping !== "object" ||
      Object.keys(mapping).length === 0
    ) {
      return res.status(400).json({
        error: "Mapping richiesto",
        code: "INVALID_MAPPING",
      });
    }

    const normalizedName = templateName
      .trim()
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .substring(0, 50);

    const success = await smartColumnMapper.saveTemplate(
      normalizedName,
      mapping,
      teamId,
      {
        description: description || null,
        createdBy: userId,
        originalName: templateName,
      }
    );

    if (!success) {
      return res.status(500).json({
        error: "Errore salvataggio template",
        code: "SAVE_FAILED",
      });
    }

    console.log("🟢 [INFO] Template salvato:", normalizedName);

    return res.json({
      message: "Template salvato con successo",
      data: {
        templateName: normalizedName,
        originalName: templateName,
        mappingFields: Object.keys(mapping).length,
        teamId: teamId,
      },
    });
  } catch (error) {
    console.log("🔴 Errore salvataggio template:", error.message);

    return res.status(500).json({
      error: "Errore interno salvataggio template",
      code: "TEMPLATE_SAVE_ERROR",
    });
  }
});

/**
 * 📋 GET /api/performance/templates
 * Lista template salvati per il team
 */
router.get("/templates", async (req, res) => {
  try {
    const teamId = req.context.teamId;

    console.log("🔵 [DEBUG] Caricamento template per team:", teamId); // INFO DEV - rimuovere in produzione

    // 📋 Carica template usando columnMapper

    const templates = await smartColumnMapper.loadTemplates(teamId);

    console.log("🟢 [INFO] Template caricati:", templates.length); // INFO - rimuovere in produzione

    return res.json({
      message: "Template caricati con successo",
      data: {
        templates: templates,
        count: templates.length,
        teamId: teamId,
      },
    });
  } catch (error) {
    console.log("🔴 Errore caricamento template:", error.message); // ERROR - mantenere essenziali

    return res.status(500).json({
      error: "Errore caricamento template",
      code: "TEMPLATE_LOAD_ERROR",
    });
  }
});

/**
 * 📊 GET /api/performance/stats/player/:playerId
 * Statistiche performance aggregate per giocatore - MULTI-TENANT
 */
router.get(
  "/stats/player/:playerId",
  ensureNumericParam("playerId"),
  async (req, res) => {
    try {
      const playerId = Number(req.params.playerId);
      const teamId = req.context.teamId; // 🔧 AGGIUNTO - Context multi-tenant

      console.log(
        "🔵 Richiesta statistiche performance per player:",
        playerId,
        "team:",
        teamId
      );

      const prisma = getPrismaClient();

      // 🔧 FIXED - Verifica giocatore appartenga al team
      const player = await prisma.player.findFirst({
        where: {
          id: playerId,
          teamId, // 🔧 FILTRO MULTI-TENANT
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          shirtNumber: true,
        },
      });

      if (!player) {
        return res.status(404).json({
          error: "Giocatore non trovato o non appartiene al team",
          code: "PLAYER_NOT_FOUND",
        });
      }

      // 🔧 FIXED - Performance data solo per giocatori del team
      const [
        totalSessions,
        averages,
        maxValues,
        sessionsByType,
        recentSessions,
      ] = await Promise.all([
        prisma.performanceData.count({
        where: {
          playerId,
            player: { teamId }, // 🔧 FILTRO INDIRETTO VIA RELATION
          },
        }),

        prisma.performanceData.aggregate({
          where: {
            playerId,
            player: { teamId }, // 🔧 FILTRO INDIRETTO VIA RELATION
          },
          _avg: {
            // ================= CAMPI ESISTENTI =================
            total_distance_m: true,
          sprint_distance_m: true,
            top_speed_kmh: true,
            avg_speed_kmh: true,
            player_load: true,
            max_heart_rate: true,
            avg_heart_rate: true,
            duration_minutes: true,
            
            // ================= NUOVI CAMPI - DISTANZE E VELOCITÀ =================
            equivalent_distance_m: true,
            equivalent_distance_pct: true,
            distance_per_min: true,
            distance_over_15_kmh_m: true,
            distance_15_20_kmh_m: true,
            distance_20_25_kmh_m: true,
            distance_over_25_kmh_m: true,
            distance_over_20_kmh_m: true,
            
            // ================= NUOVI CAMPI - POTENZA METABOLICA =================
            avg_metabolic_power_wkg: true,
            distance_over_20wkg_m: true,
            distance_over_35wkg_m: true,
            max_power_5s_wkg: true,
            
            // ================= NUOVI CAMPI - ACCELERAZIONI/DECELERAZIONI =================
            distance_acc_over_2_ms2_m: true,
            distance_dec_over_minus2_ms2_m: true,
            pct_distance_acc_over_2_ms2: true,
            pct_distance_dec_over_minus2_ms2: true,
            distance_acc_over_3_ms2_m: true,
            distance_dec_over_minus3_ms2_m: true,
            num_acc_over_3_ms2: true,
            num_dec_over_minus3_ms2: true,
            acc_events_per_min_over_2_ms2: true,
            dec_events_per_min_over_minus2_ms2: true,
            
            // ================= NUOVI CAMPI - ZONE DI INTENSITÀ =================
            time_under_5wkg_min: true,
            time_5_10_wkg_min: true,
            
            // ================= NUOVI CAMPI - INDICI E PROFILI =================
            rvp_index: true,
            training_load: true,
          },
        }),

        prisma.performanceData.aggregate({
          where: {
            playerId,
            player: { teamId }, // 🔧 FILTRO INDIRETTO VIA RELATION
          },
          _max: {
            // ================= CAMPI ESISTENTI =================
            total_distance_m: true,
            sprint_distance_m: true,
            top_speed_kmh: true,
            player_load: true,
            max_heart_rate: true,
            duration_minutes: true,
            
            // ================= NUOVI CAMPI - DISTANZE E VELOCITÀ =================
            equivalent_distance_m: true,
            distance_per_min: true,
            distance_over_15_kmh_m: true,
            distance_15_20_kmh_m: true,
            distance_20_25_kmh_m: true,
            distance_over_25_kmh_m: true,
            distance_over_20_kmh_m: true,
            
            // ================= NUOVI CAMPI - POTENZA METABOLICA =================
            avg_metabolic_power_wkg: true,
            distance_over_20wkg_m: true,
            distance_over_35wkg_m: true,
            max_power_5s_wkg: true,
            
            // ================= NUOVI CAMPI - ACCELERAZIONI/DECELERAZIONI =================
            distance_acc_over_2_ms2_m: true,
            distance_dec_over_minus2_ms2_m: true,
            distance_acc_over_3_ms2_m: true,
            distance_dec_over_minus3_ms2_m: true,
            num_acc_over_3_ms2: true,
            num_dec_over_minus3_ms2: true,
            
            // ================= NUOVI CAMPI - INDICI E PROFILI =================
            rvp_index: true,
            training_load: true,
          },
        }),

        prisma.performanceData.groupBy({
          by: ["session_name"],
          where: {
            playerId,
            player: { teamId }, // 🔧 FILTRO INDIRETTO VIA RELATION
          },
          _count: { session_name: true },
          _avg: {
            total_distance_m: true,
            top_speed_kmh: true,
            player_load: true,
          },
        }),

        prisma.performanceData.findMany({
          where: {
            playerId,
            player: { teamId }, // 🔧 FILTRO INDIRETTO VIA RELATION
          },
          orderBy: { session_date: "desc" },
          take: 5,
          select: {
            id: true,
            session_date: true,
            session_name: true,
            total_distance_m: true,
            top_speed_kmh: true,
            duration_minutes: true,
            player_load: true,
          },
        }),
      ]);

      const stats = {
        player,
        summary: {
          totalSessions,
          averages: {
            totalDistance:
              averages._avg.total_distance_m != null
                ? parseFloat(averages._avg.total_distance_m.toFixed(2))
                : null,
            sprintDistance:
              averages._avg.sprint_distance_m != null
                ? parseFloat(averages._avg.sprint_distance_m.toFixed(2))
                : null,
            topSpeed:
              averages._avg.top_speed_kmh != null
                ? parseFloat(averages._avg.top_speed_kmh.toFixed(2))
                : null,
            avgSpeed:
              averages._avg.avg_speed_kmh != null
                ? parseFloat(averages._avg.avg_speed_kmh.toFixed(2))
                : null,
            playerLoad:
              averages._avg.player_load != null
                ? parseFloat(averages._avg.player_load.toFixed(2))
                : null,
            maxHeartRate:
              averages._avg.max_heart_rate != null
                ? Math.round(averages._avg.max_heart_rate)
                : null,
            avgHeartRate:
              averages._avg.avg_heart_rate != null
                ? Math.round(averages._avg.avg_heart_rate)
                : null,
            duration:
              averages._avg.duration_minutes != null
                ? Math.round(averages._avg.duration_minutes)
                : null,
          },
          records: {
            maxDistance: maxValues._max.total_distance_m,
            maxSprintDistance: maxValues._max.sprint_distance_m,
            topSpeed: maxValues._max.top_speed_kmh,
            maxPlayerLoad: maxValues._max.player_load,
            maxHeartRate: maxValues._max.max_heart_rate,
            longestSession: maxValues._max.duration_minutes,
          },
        },
        sessionBreakdown: sessionsByType.map((item) => ({
          sessionType: item.session_name,
          count: item._count.session_name,
          avgDistance:
            item._avg.total_distance_m != null
              ? parseFloat(item._avg.total_distance_m.toFixed(2))
              : null,
          avgTopSpeed:
            item._avg.top_speed_kmh != null
              ? parseFloat(item._avg.top_speed_kmh.toFixed(2))
              : null,
          avgPlayerLoad:
            item._avg.player_load != null
              ? parseFloat(item._avg.player_load.toFixed(2))
              : null,
        })),
        recentSessions,
      };

      console.log(
        "🟢 Statistiche performance calcolate per:",
        player.firstName,
        player.lastName
      );

      res.json({
        message: "Statistiche performance recuperate con successo",
        data: stats,
      });
    } catch (error) {
      console.log("🔴 Errore calcolo statistiche performance:", error.message);
      res.status(500).json({
        error: "Errore interno durante il calcolo delle statistiche",
        code: "STATS_ERROR",
      });
    }
  }
);

/**
 * 📊 GET /api/performance/stats/team
 * Statistiche performance aggregate del team - MULTI-TENANT
 */
router.get(
  "/stats/team",
  (req, res, next) => {
    const allowedRoles = ["ADMIN", "DIRECTOR_SPORT", "PREPARATORE_ATLETICO"];
    if (!allowedRoles.includes(req.user.role)) {
      console.log(
        "🟡 Tentativo accesso statistiche team non autorizzato da:",
        req.user.role
      );
      return res.status(403).json({
        error: "Non autorizzato a visualizzare statistiche team",
        code: "INSUFFICIENT_PERMISSIONS",
        requiredRoles: allowedRoles,
      });
    }
    next();
  },
  async (req, res) => {
    try {
      const { startDate, endDate, sessionType, period } = req.query;
      const teamId = req.context.teamId; // 🔧 AGGIUNTO - Context multi-tenant

      console.log(
        "🔵 Richiesta statistiche team:",
        teamId,
        "filtri:",
        req.query
      );
      
      const prisma = getPrismaClient();

      // 🔧 CALCOLO PERIODO CORRENTE E PRECEDENTE PER TREND
      const periodValue = period || 'week';
      const { periodStart, periodEnd } = buildPeriodRange(periodValue, startDate, endDate);
      console.log(`📊 /stats/team -> periodo=${periodValue} start=${periodStart.toISOString()} end=${periodEnd.toISOString()}`);
      const periodMs = periodEnd.getTime() - periodStart.getTime();
      const prevEnd = new Date(periodStart.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - periodMs);

      // 🔧 FIXED - Filtri WHERE con constraint team
      const where = {
        player: { teamId }, // 🔧 FILTRO MULTI-TENANT OBBLIGATORIO
      };
      if (startDate) where.session_date = { gte: new Date(startDate) };
      if (endDate)
        where.session_date = {
          ...(where.session_date || {}),
          lte: new Date(endDate),
        };
      if (sessionType) where.session_name = sessionType;

      // 🔧 FILTRI PER PERIODO PRECEDENTE
      const prevWhere = {
        player: { teamId },
        session_date: { gte: prevStart, lte: prevEnd }
      };
      if (sessionType) prevWhere.session_name = sessionType;

      const [
        totalSessions,
        activePlayersCount,
        teamAverages,
        topPerformers,
        sessionTypeBreakdown,
        // 🔧 NUOVO: Dati per periodo precedente per trend
        prevTeamAverages
      ] = await Promise.all([
        prisma.performanceData.count({ where }),

        prisma.performanceData
          .findMany({
            where,
            select: { playerId: true },
            distinct: ["playerId"],
          })
          .then((r) => r.length),

        prisma.performanceData.aggregate({
          where,
          _avg: {
            total_distance_m: true,
            sprint_distance_m: true,
            top_speed_kmh: true,
            avg_speed_kmh: true,
            player_load: true,
            max_heart_rate: true,
            duration_minutes: true,
          },
        }),

        prisma.performanceData.findMany({
          where,
          orderBy: { player_load: "desc" },
          take: 5,
          include: {
            player: {
              select: {
                firstName: true,
                lastName: true,
                position: true,
                shirtNumber: true,
              },
            },
          },
        }),

        prisma.performanceData.groupBy({
          by: ["session_name"],
          where,
          _count: { session_name: true },
          _avg: {
            total_distance_m: true,
            player_load: true,
            top_speed_kmh: true,
          },
        }),

        // 🔧 NUOVO: Aggregate per periodo precedente
        prisma.performanceData.aggregate({
          where: prevWhere,
          _avg: {
            total_distance_m: true,
            sprint_distance_m: true,
            top_speed_kmh: true,
            avg_speed_kmh: true,
            player_load: true,
            max_heart_rate: true,
            duration_minutes: true,
          },
        }),
      ]);

      // 🔧 CALCOLO TREND PERCENTUALI
      const calculateTrend = (current, previous) => {
        if (previous === 0 || previous === null) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const currentAvgDistance = teamAverages._avg.total_distance_m || 0;
      const prevAvgDistance = prevTeamAverages._avg.total_distance_m || 0;
      const distanceTrend = calculateTrend(currentAvgDistance, prevAvgDistance);

      const currentAvgLoad = teamAverages._avg.player_load || 0;
      const prevAvgLoad = prevTeamAverages._avg.player_load || 0;
      const loadTrend = calculateTrend(currentAvgLoad, prevAvgLoad);

      const currentAvgSpeed = teamAverages._avg.top_speed_kmh || 0;
      const prevAvgSpeed = prevTeamAverages._avg.top_speed_kmh || 0;
      const speedTrend = calculateTrend(currentAvgSpeed, prevAvgSpeed);

      const currentAvgDuration = teamAverages._avg.duration_minutes || 0;
      const prevAvgDuration = prevTeamAverages._avg.duration_minutes || 0;
      const durationTrend = calculateTrend(currentAvgDuration, prevAvgDuration);

      const teamStats = {
        overview: {
          totalSessions,
          activePlayersCount,
          teamId, // 🔧 AGGIUNTO per trasparenza
          dateRange: {
            startDate: startDate || null,
            endDate: endDate || null,
          },
          sessionTypeFilter: sessionType || null,
          period: periodValue,
        },
        teamAverages: {
          totalDistance:
            teamAverages._avg.total_distance_m != null
              ? parseFloat(teamAverages._avg.total_distance_m.toFixed(2))
              : null,
          sprintDistance:
            teamAverages._avg.sprint_distance_m != null
              ? parseFloat(teamAverages._avg.sprint_distance_m.toFixed(2))
              : null,
          topSpeed:
            teamAverages._avg.top_speed_kmh != null
              ? parseFloat(teamAverages._avg.top_speed_kmh.toFixed(2))
              : null,
          avgSpeed:
            teamAverages._avg.avg_speed_kmh != null
              ? parseFloat(teamAverages._avg.avg_speed_kmh.toFixed(2))
              : null,
          playerLoad:
            teamAverages._avg.player_load != null
              ? parseFloat(teamAverages._avg.player_load.toFixed(2))
              : null,
          maxHeartRate:
            teamAverages._avg.max_heart_rate != null
              ? Math.round(teamAverages._avg.max_heart_rate)
              : null,
          duration:
            teamAverages._avg.duration_minutes != null
              ? Math.round(teamAverages._avg.duration_minutes)
              : null,
        },
        // 🔧 NUOVO: Trend percentuali per marcatori di variazione
        trends: {
          distanceTrend: Math.max(-999, Math.min(999, Math.round(distanceTrend || 0))),
          loadTrend: Math.max(-999, Math.min(999, Math.round(loadTrend || 0))),
          speedTrend: Math.max(-999, Math.min(999, Math.round(speedTrend || 0))),
          durationTrend: Math.max(-999, Math.min(999, Math.round(durationTrend || 0))),
        },
        topPerformers: topPerformers.map((item) => ({
          player: item.player,
          sessionDate: item.session_date,
          sessionType: item.session_name,
          playerLoad: item.player_load,
          totalDistance: item.total_distance_m,
          topSpeed: item.top_speed_kmh,
        })),
        sessionBreakdown: sessionTypeBreakdown.map((item) => ({
          sessionType: item.session_name,
          count: item._count.session_name,
          avgDistance:
            item._avg.total_distance_m != null
              ? parseFloat(item._avg.total_distance_m.toFixed(2))
              : null,
          avgPlayerLoad:
            item._avg.player_load != null
              ? parseFloat(item._avg.player_load.toFixed(2))
              : null,
          avgTopSpeed:
            item._avg.top_speed_kmh != null
              ? parseFloat(item._avg.top_speed_kmh.toFixed(2))
              : null,
        })),
      };

      console.log(
        "🟢 Statistiche team calcolate:",
        totalSessions,
        "sessioni per",
        activePlayersCount,
        "giocatori"
      );

      console.log(
        "🔵 Trend calcolati:",
        "Distanza:", teamStats.trends.distanceTrend + "%",
        "Load:", teamStats.trends.loadTrend + "%",
        "Velocità:", teamStats.trends.speedTrend + "%",
        "Durata:", teamStats.trends.durationTrend + "%"
      );

      res.json({
        message: "Statistiche team recuperate con successo",
        data: teamStats,
      });
    } catch (error) {
      console.log("🔴 Errore calcolo statistiche team:", error.message);
      res.status(500).json({
        error: "Errore interno durante il calcolo delle statistiche team",
        code: "TEAM_STATS_ERROR",
      });
    }
  }
);

// ✅ Nuova rotta: tutte le sessioni di un giocatore (multi-tenant)
router.get("/player/:playerId/sessions", ensureNumericParam("playerId"), getSessionsByPlayer);

/**
 * 👥 GET /api/performance/stats/players
 * Card giocatori per "Schede Giocatori" - MULTI-TENANT con calcoli reali
 */
router.get("/stats/players", async (req, res) => {
  try {
    // Helper per evitare crash con dati sporchi
    const safeNum = v => Number.isFinite(Number(v)) ? Number(v) : 0;
    const asDate = v => v instanceof Date ? v : new Date(v);
    
    // a) Leggi e normalizza i parametri
    const period = (req.query.period || 'week');            // 'week' | 'month' | 'quarter' | 'custom'
    const sessionType = (req.query.sessionType || 'all');   // 'all' | 'allenamento' | 'partita'
    const sessionName = (req.query.sessionName || 'all');   // 'all' | 'Aerobico' | 'Intermittente' | etc.
    const roles = (req.query.roles || '').split(',').filter(Boolean); // ['POR','DIF',...]
    const status = (req.query.status || 'all');
    const search = (req.query.search || '').trim();
    

    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const sortBy = (req.query.sortBy || 'acwr');            // 'acwr' | 'plMin' | 'hsr' | 'topSpeed' | 'sprintPer90' | 'name'
    
    const teamId = req.context.teamId;

    dlog("[STATS/PLAYERS] request:", { teamId, filters: req.query });

    const prisma = getPrismaClient();

    // b) Calcola il range date in base a period
    const { periodStart, periodEnd } = buildPeriodRange(period, startDate, endDate);
    console.log(`📊 /stats/players -> periodo=${period} start=${periodStart.toISOString()} end=${periodEnd.toISOString()}`);
    const periodMs = periodEnd.getTime() - periodStart.getTime();
    const prevEnd = new Date(periodStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodMs);

    // c) Mappa i ruoli 'POR','DIF','CEN','ATT' in quello che c'è a DB
    const roleMap = { 
      POR: ['GOALKEEPER', 'POR'], 
      DIF: ['DEFENDER', 'DIF'], 
      CEN: ['MIDFIELDER', 'CEN'], 
      ATT: ['FORWARD', 'ATT'] 
    };

    // d) Filtra per sessionType (session_type)
    let sessionTypeFilter = parseSessionTypeFilterSimple(sessionType);
    // 🔧 FIX: Converti "all" in null per non filtrare
    if (sessionTypeFilter === 'all' || sessionTypeFilter === 'All') {
      sessionTypeFilter = null;
    }
    console.log('🔵 [DEBUG] Performance API: sessionType ricevuto:', sessionType);
    console.log('🔵 [DEBUG] Performance API: sessionTypeFilter applicato:', sessionTypeFilter);

    // 🆕 NUOVO: Filtra per sessionName (session_name)
    let sessionNameFilter = parseSessionTypeFilter(sessionName);
    // 🔧 FIX: Converti "all" in null per non filtrare
    if (sessionName === 'all' || sessionName === 'All') {
      sessionNameFilter = null;
    }
    console.log('🔵 [DEBUG] Performance API: sessionName ricevuto:', sessionName);
    console.log('🔵 [DEBUG] Performance API: sessionNameFilter applicato:', sessionNameFilter);

    // ================= CARICA GIOCATORI =================
    
    // Carica tutti i giocatori del team
    const players = await prisma.player.findMany({
      where: { 
        teamId,
        // e) Filtra per status solo se realmente abbiamo un campo 'status' per il player
        ...(status !== 'all' && { isActive: status === 'active' })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        shirtNumber: true,
        isActive: true
      },
      orderBy: [
        { position: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // f) Applica 'search' su nome/cognome/numero maglia
    let filteredPlayers = players;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPlayers = players.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchLower) ||
        p.shirtNumber?.toString().includes(search)
      );
    }

    // Filtra per ruolo
    if (roles.length > 0) {
      const mappedRoles = roles.flatMap(r => roleMap[r] || []).filter(Boolean);
      filteredPlayers = filteredPlayers.filter(p => mappedRoles.includes(p.position));
    }

    // ================= CARICA DATI PERFORMANCE =================
    
    // Carica dati performance per periodo corrente
    // h) Esegui le aggregate per giocatore nel range
    console.log('🔵 [DEBUG] Performance API: Query con filtro session_type:', sessionTypeFilter);
    console.log('🔵 [DEBUG] Performance API: Query con filtro session_name:', sessionNameFilter);
    const performanceData = await prisma.performanceData.findMany({
      where: {
        player: { teamId },
        session_date: { gte: periodStart, lte: periodEnd },
        ...(sessionTypeFilter && { session_type: sessionTypeFilter }),
        ...(sessionNameFilter && { session_name: sessionNameFilter })
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      },
      orderBy: { session_date: 'desc' }
    });
    
    console.log('🔵 [DEBUG] Performance API: Record trovati con filtro:', performanceData.length);

    // Carica dati performance per periodo precedente (per trend)
    const prevPerformanceData = await prisma.performanceData.findMany({
      where: {
        player: { teamId },
        session_date: { gte: prevStart, lte: prevEnd },
        ...(sessionTypeFilter && { session_type: sessionTypeFilter }),
        ...(sessionNameFilter && { session_name: sessionNameFilter })
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    });

    // Carica dati per ACWR (ultimi 28 giorni, finestra che termina in periodEnd)
    const acwrEndDate = periodEnd;
    const acwrStartDate = new Date(acwrEndDate.getTime() - 28 * 86400000);
    const acwrData = await prisma.performanceData.findMany({
      where: {
        player: { teamId },
        session_date: { gte: acwrStartDate, lte: acwrEndDate },
        ...(sessionTypeFilter && { session_type: sessionTypeFilter }),
        ...(sessionNameFilter && { session_name: sessionNameFilter })
      },
      select: { playerId: true, session_date: true, player_load: true }
    });

    // ================= CALCOLA KPI PER OGNI GIOCATORE =================
    // 🔧 FIX: Usa la stessa logica che funziona nell'endpoint singolo giocatore
    
    const playersWithStats = await Promise.all(filteredPlayers.map(async (player) => {
      const playerId = player.id;
      
      // Inizializza variabili KPI
      let totalSessions = 0;
      let totalPlayerLoad = 0;
      let totalHSR = 0;
      let totalSprints = 0;
      let avgMaxSpeed = 0;
      let avgACWR = 0;
      let totalDuration = 0;
      let plMin = 0;
      let hsr = 0;
      let sprintPer90 = 0;
      let topSpeed = 0;
      let acwr = 0;
      
      try {
        // 🔧 FIX: Re-implementa la logica di loadRows + deriveRow + buildDashboardData
        // Carica dati performance per questo giocatore specifico
        const playerPerformanceData = await prisma.performanceData.findMany({
          where: {
            player: { teamId },
            playerId: playerId,
            session_date: { gte: periodStart, lte: periodEnd },
            ...(sessionTypeFilter && { session_type: sessionTypeFilter }),
            ...(sessionNameFilter && { session_name: sessionNameFilter })
          },
          include: {
            player: {
              select: {
                id: true, firstName: true, lastName: true, position: true
              }
            }
          },
          orderBy: { session_date: 'desc' }
        });
        
        // Deriva campi mancanti (stessa logica di deriveRow)
        const rowsD = playerPerformanceData.map(r => {
          const est = {};
          const toNum = v => Number.isFinite(Number(v)) ? Number(v) : 0;
          const dur = toNum(r.duration_minutes);
          
          // Deriva HSR se mancante
          let hsr = toNum(r.high_intensity_distance_m);
          if (hsr === 0) {
            hsr = toNum(r.distance_over_15_kmh_m) + 
                  toNum(r.distance_15_20_kmh_m) + 
                  toNum(r.distance_20_25_kmh_m) + 
                  toNum(r.distance_over_25_kmh_m);
            if (hsr === 0 && toNum(r.sprint_distance_m) > 0) {
              hsr = Math.round(toNum(r.sprint_distance_m) * 2.5);
              est.hsr = 'estimated from sprint_distance_m';
            }
          }
          
          // Deriva sprint_count se mancante
          let sprint_count = toNum(r.sprint_count);
          if (sprint_count === 0) {
            const hir = toNum(r.high_intensity_runs);
            if (hir > 0) {
              sprint_count = hir;
              est.sprint_count = 'estimated from high_intensity_runs';
            } else if (toNum(r.sprint_distance_m) > 0) {
              sprint_count = Math.round(toNum(r.sprint_distance_m) / 30);
              est.sprint_count = 'estimated from sprint_distance_m';
            }
          }
          
          return {
            ...r,
            _est: est,
            high_intensity_distance_m: hsr,
            sprint_count: sprint_count
          };
        });
        
        // Calcola KPI usando la stessa logica di buildDashboardData
        const validRows = rowsD.filter(r => r.playerId && r.player);
        totalSessions = validRows.length;
        
        // Helper functions
        const sum = (arr) => arr.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
        const mean = (arr) => arr.length > 0 ? sum(arr) / arr.length : 0;
        const toNum = v => Number.isFinite(Number(v)) ? Number(v) : 0;
        
        totalPlayerLoad = sum(validRows.map(r => toNum(r.player_load)));
        totalHSR = sum(validRows.map(r => toNum(r.high_intensity_distance_m)));
        totalSprints = sum(validRows.map(r => toNum(r.sprint_count)));
        avgMaxSpeed = mean(validRows.map(r => toNum(r.top_speed_kmh)));
        
        // Calcola ACWR (semplificato)
        const acwrData = await prisma.performanceData.findMany({
          where: {
            player: { teamId },
            playerId: playerId,
            session_date: { gte: new Date(periodEnd.getTime() - 28 * 86400000), lte: periodEnd }
          },
          select: { session_date: true, player_load: true }
        });
        
        const acuteLoad = acwrData.filter(d => 
          new Date(d.session_date) >= new Date(periodEnd.getTime() - 7 * 86400000)
        ).reduce((sum, d) => sum + toNum(d.player_load), 0);
        
        const chronicLoad = acwrData.reduce((sum, d) => sum + toNum(d.player_load), 0) / 4;
        avgACWR = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
        
        // Calcola i KPI finali
        totalDuration = totalSessions * 90; // Approssimazione 90 min per sessione
        plMin = totalDuration > 0 ? totalPlayerLoad / totalDuration : 0;
        hsr = totalHSR;
        sprintPer90 = totalSessions > 0 ? totalSprints / totalSessions : 0;
        topSpeed = avgMaxSpeed;
        acwr = avgACWR;
        
      } catch (error) {
        console.error(`❌ Errore nel calcolo KPI per player ${playerId}:`, error.message);
        // Le variabili sono già inizializzate a 0, quindi non serve fare nulla
      }

      // ================= TREND CALCULATION =================
      // 🔧 FIX: Per ora impostiamo trend a 0, poi li calcoleremo se necessario
      const plMinTrend = 0;
      const hsrTrend = 0;
      const sprintTrend = 0;
      const speedTrend = 0;
      const acwrTrend = 0;

      // ================= PERCENTILI PER RUOLO =================
      // 🔧 FIX: Per ora impostiamo percentili a 100, poi li calcoleremo se necessario
      const plMinPercentile = 100;
      const hsrPercentile = 100;
      const sprintPercentile = 100;
      const speedPercentile = 100;

      // ================= ALERTS =================
      // 🔧 FIX: Per ora nessun alert, poi li aggiungeremo se necessario
      const alerts = [];

      // i) Sanitizza numeri prima di rispondere (arrotonda e clampa trend)
      const round = (v, d = 2) => Number.isFinite(v) ? Number(v.toFixed(d)) : null;
      const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
      const pct = (v) => Number.isFinite(v) ? clamp(Math.round(v), -999, 999) : null;

      // ================= FORMATTA OUTPUT =================
      
      const roleMap = {
        'GOALKEEPER': 'POR',
        'DEFENDER': 'DIF',
        'MIDFIELDER': 'CEN', 
        'FORWARD': 'ATT'
      };

      const statusMap = {
        true: 'active',
        false: 'inactive'
      };

      const availabilityMap = {
        true: 'green',
        false: 'red'
      };

      return {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`,
        role: roleMap[player.position] || player.position,
        number: player.shirtNumber,
        status: statusMap[player.isActive],
        availability: availabilityMap[player.isActive],
        avatar: null,
        plMin: Number((plMin || 0).toFixed(2)),
        plMinTrend: Math.max(-999, Math.min(999, Math.round(plMinTrend || 0))),
        plMinPercentile: Math.max(1, Math.min(100, plMinPercentile || 50)),
        hsr: Math.max(0, Math.round(hsr || 0)),
        hsrTrend: Math.max(-999, Math.min(999, Math.round(hsrTrend || 0))),
        hsrPercentile: Math.max(1, Math.min(100, hsrPercentile || 50)),
        sprintPer90: Number((sprintPer90 || 0).toFixed(2)),
        sprintTrend: Math.max(-999, Math.min(999, Math.round(sprintTrend || 0))),
        sprintPercentile: Math.max(1, Math.min(100, sprintPercentile || 50)),
        topSpeed: round(topSpeed, 2),
        speedTrend: pct(speedTrend),
        speedPercentile: speedPercentile,
        acwr: round(acwr, 2),
        lastSession: null, // 🔧 FIX: Per ora null, poi lo aggiungeremo se necessario
        alerts: alerts
      };
    }));

    // ================= APPLICA ORDINAMENTO =================
    
    let sortedPlayers = [...playersWithStats];
    
    switch (sortBy) {
      case 'acwr':
        sortedPlayers.sort((a, b) => b.acwr - a.acwr);
        break;
      case 'plMin':
        sortedPlayers.sort((a, b) => b.plMin - a.plMin);
        break;
      case 'hsr':
        sortedPlayers.sort((a, b) => b.hsr - a.hsr);
        break;
      case 'topSpeed':
        sortedPlayers.sort((a, b) => b.topSpeed - a.topSpeed);
        break;
      case 'sprintPer90':
        sortedPlayers.sort((a, b) => b.sprintPer90 - a.sprintPer90);
        break;
      case 'name':
        sortedPlayers.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    console.log('🟢 [INFO] Calcoli completati per', sortedPlayers.length, 'giocatori');

    // ✅ DEBUG LOG PER MULTI-TENANT - verifica che i calcoli siano corretti per team
    console.log(`🟢 [INFO] Calcoli completati per team ${teamId}:`, {
      giocatoriProcessati: sortedPlayers.length,
      hsrMedio: Math.round(sortedPlayers.reduce((sum, p) => sum + (p.hsr || 0), 0) / sortedPlayers.length),
      sprintMedio: (sortedPlayers.reduce((sum, p) => sum + (p.sprintPer90 || 0), 0) / sortedPlayers.length).toFixed(2),
      plMinMedio: (sortedPlayers.reduce((sum, p) => sum + (p.plMin || 0), 0) / sortedPlayers.length).toFixed(2),
      topSpeedMax: Math.max(...sortedPlayers.map(p => p.topSpeed || 0)).toFixed(2),
      percentilesValid: sortedPlayers.filter(p => p.hsrPercentile > 0 && p.hsrPercentile < 100).length
    }); // INFO - rimuovere in produzione

    // j) DEBUG: includi nel JSON un piccolo echo dei filtri applicati
    res.json({
      players: sortedPlayers,
      total: sortedPlayers.length,
      timestamp: new Date().toISOString(),
      meta: { 
        applied: { period, sessionType, roles, status, startDate, endDate, search, sortBy } 
      }
    });

  } catch (error) {
    derr("Stats error:", error?.message);
    res.status(500).json({
      error: 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 📋 GET /api/performance
 * Lista con filtri - MULTI-TENANT
 */
router.get("/", getPerformanceData);


/**
 * ➕ POST /api/performance
 * Creazione - MULTI-TENANT
 */
router.post(
  "/",
  (req, res, next) => {
    const allowedRoles = ["ADMIN", "DIRECTOR_SPORT", "PREPARATORE_ATLETICO"];
    if (!allowedRoles.includes(req.user.role)) {
      console.log(
        "🟡 Tentativo creazione performance data non autorizzato da:",
        req.user.role
      );
      return res.status(403).json({
        error: "Non autorizzato a creare dati performance",
        code: "INSUFFICIENT_PERMISSIONS",
        requiredRoles: allowedRoles,
      });
    }
    next();
  },
  createPerformanceData
);

/**
 * 📈 GET /api/performance/:id
 * Dettaglio - MULTI-TENANT
 */
router.get("/:id", ensureNumericParam("id"), getPerformanceDataById);

/**
 * 🗑️ DELETE /api/performance/:id
 * Eliminazione - MULTI-TENANT
 */
router.delete(
  "/:id",
  ensureNumericParam("id"),
  async (req, res, next) => {
    try {
      const performanceId = Number(req.params.id);
      const userRole = req.user.role;
      const teamId = req.context.teamId; // 🔧 AGGIUNTO

      // ADMIN può eliminare tutto del suo team
      if (userRole === "ADMIN") return next();

      const allowedRoles = ["DIRECTOR_SPORT", "PREPARATORE_ATLETICO"];
      if (!allowedRoles.includes(userRole)) {
        console.log(
          "🟡 Tentativo eliminazione performance data non autorizzato da:",
          userRole
        );
        return res.status(403).json({
          error: "Non autorizzato a eliminare dati performance",
          code: "INSUFFICIENT_PERMISSIONS",
          requiredRoles: ["ADMIN", ...allowedRoles],
        });
      }

      const prisma = getPrismaClient();

      // 🔧 FIXED - Verifica ownership + team constraint
      const performanceData = await prisma.performanceData.findFirst({
        where: {
          id: performanceId,
          player: { teamId }, // 🔧 VINCOLO MULTI-TENANT
        },
        select: {
          id: true,
          createdById: true,
          player: {
            select: {
              firstName: true,
              lastName: true,
              teamId: true, // 🔧 AGGIUNTO per debug
            },
          },
        },
      });

      if (!performanceData) {
        return res.status(404).json({
          error: "Dato performance non trovato o non appartiene al team",
          code: "RESOURCE_NOT_FOUND",
        });
      }

      if (performanceData.createdById !== req.context.userId) {
        dwarn("Unauthorized team stats access attempt:", { role: req.user?.role });
        return res.status(403).json({
          error: "Puoi eliminare solo i dati performance che hai creato",
          code: "OWNERSHIP_REQUIRED",
        });
      }

      console.log(
        "🔵 Eliminazione performance autorizzata per:",
        performanceData.player.firstName,
        performanceData.player.lastName
      );
      next();
    } catch (error) {
      console.log(
        "🔴 Errore verifica permessi eliminazione performance:",
        error.message
      );
      res.status(500).json({
        error: "Errore interno verifica permessi",
        code: "PERMISSION_CHECK_ERROR",
      });
    }
  },
  deletePerformanceData
);

/**
 * 🚀 POST /api/performance/import
 * Import finale: salva tutti i dati nel database con transazioni sicure
 */
router.post("/import/import", upload.single("file"), async (req, res) => {
  const startTime = Date.now();

  try {
    const teamId = req.context.teamId;
    const createdById = req.context.userId;

    console.log("🔵 [DEBUG] Avvio import finale per team:", teamId); // INFO DEV - rimuovere in produzione

    // 🔍 Validazione input
    if (!req.file) {
      return res.status(400).json({
        error: "File richiesto per import finale",
        code: "MISSING_FILE",
      });
    }

    const rawMapping = JSON.parse(req.body.mapping || "{}");
    const mapping = rawMapping?.mapping ? rawMapping.mapping : rawMapping;

    if (
      !mapping ||
      typeof mapping !== "object" ||
      Object.keys(mapping).length === 0
    ) {
      return res.status(400).json({
        error: "Mapping richiesto per import finale",
        code: "INVALID_MAPPING",
      });
    }

    console.log(
      "🔵 Import mapping ricevuto:",
      Object.keys(mapping).length,
      "campi"
    ); // INFO DEV - rimuovere in produzione

    // 📂 Parsing file CSV/XLSX
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let allRows = [];

    if (ext === ".csv") {
      const firstLine = fs.readFileSync(filePath, "utf8").split("\n")[0];
      const separator = firstLine.includes(";") ? ";" : ",";

      console.log("🔵 [DEBUG] Parsing CSV con separatore:", separator); // INFO DEV - rimuovere in produzione

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator }))
          .on("data", (row) => allRows.push(row))
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (ext === ".xlsx") {
      console.log("🔵 [DEBUG] Parsing XLSX..."); // INFO DEV - rimuovere in produzione

      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      allRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      try { 
        await fsAsync.unlink(filePath); 
      } catch (e) { 
        dwarn("Temp file cleanup failed:", e?.message); 
      }
      return res.status(400).json({
        error: "Formato file non supportato",
        code: "UNSUPPORTED_FORMAT",
      });
    }

    // 🧹 Cleanup file
    try { 
      await fsAsync.unlink(filePath); 
    } catch (e) { 
      dwarn("Temp file cleanup failed:", e?.message); 
    }

    if (allRows.length === 0) {
      return res.status(400).json({
        error: "Nessun dato trovato nel file",
        code: "EMPTY_FILE",
      });
    }

    console.log("🔵 [DEBUG] File parsato:", allRows.length, "righe totali"); // INFO DEV - rimuovere in produzione

    // 🔧 Normalizza headers (rimuovi BOM + trim)
    const normalizeString = (str) =>
      typeof str === "string" ? str.replace(/^\uFEFF/, "").trim() : str;

    const normalizedRows = allRows.map((obj) => {
      const normalized = {};
      Object.keys(obj).forEach((key) => {
        normalized[normalizeString(key)] = obj[key];
      });
      return normalized;
    });

    const validated = validateMapping(mapping); // throws se non valido
    const normalizedMapping = {};
    Object.entries(validated).forEach(([csvHeader, config]) => {
      const cleanHeader = normalizeString(csvHeader);
      normalizedMapping[cleanHeader] = { ...config, csvHeader: cleanHeader };
    });

    // 🎯 Applica mapping usando smartColumnMapper
    console.log("🔵 [DEBUG] Applicazione mapping a tutti i dati..."); // INFO DEV - rimuovere in produzione

    const transformResult = await smartColumnMapper.applyMapping(
      normalizedRows,
      normalizedMapping,
      teamId
    );

    if (!transformResult.success) {
      return res.status(400).json({
        error: "Errore trasformazione dati",
        code: "TRANSFORMATION_ERROR",
        details: transformResult.errors,
      });
    }

    const {
      data: transformedData,
      errors: transformErrors,
      stats,
    } = transformResult;

    console.log("🔵 [DEBUG] Dati trasformati:", transformedData.length, "righe valide"); // INFO DEV - rimuovere in produzione

    if (transformedData.length === 0) {
      return res.status(400).json({
        error: "Nessun dato valido dopo la trasformazione",
        code: "NO_VALID_DATA",
        transformationErrors: transformErrors,
      });
    }

    // 💾 SALVATAGGIO DATABASE con transazione OTTIMIZZATA
    console.log("🔵 [DEBUG] Avvio transazione database ottimizzata..."); // INFO DEV - rimuovere in produzione

    const prisma = getPrismaClient();
    const importResults = {
      successful: [],
      failed: [],
      summary: {
        totalProcessed: transformedData.length,
        successfulImports: 0,
        errors: 0,
        playersAffected: new Set(),
        dateRange: null,
        processingTime: null,
      },
    };

    // 📄 Import in batch ottimizzato per evitare timeout
    const batches = [];
    for (let i = 0; i < transformedData.length; i += BATCH_SIZE) {
      batches.push(transformedData.slice(i, i + BATCH_SIZE));
    }

    console.log(
      "🔵 Processamento ottimizzato in",
      batches.length,
      "batch di",
      BATCH_SIZE,
      "righe"
    ); // INFO DEV - rimuovere in produzione

    // 🔎 Precarica mappa playerId -> nome per evitare include per riga
    const players = await prisma.player.findMany({
      where: { teamId },
      select: { id: true, firstName: true, lastName: true },
    });
    const playerIdToName = new Map(players.map(p => [p.id, `${p.firstName} ${p.lastName}`]));

    // 🟠 Processo ogni batch con timeout configurabile
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      console.log(`🟡 [WARN] Processando batch ${batchIndex + 1}/${batches.length}`); // DEBUG - rimuovere in produzione

      try {
        // 🟠 Transazione con timeout esteso e isolamento ottimizzato
        await prisma.$transaction(async (tx) => {
          for (const rowData of batch) {
            try {
              if (process.env.IMPORT_DEBUG === '1') {
                console.log("🟡 [WARN] Preparazione dati per DB:", {
                  playerId: rowData.playerId,
                  session_date: rowData.session_date,
                  total_distance_m: rowData.total_distance_m,
                  sprint_distance_m: rowData.sprint_distance_m
                });
              }
              
              // 🔧 Prepara dati con controllo campi obbligatori
              const performanceData = {
                // ================= CAMPI ESISTENTI =================
                playerId: rowData.playerId,
                session_date: rowData.session_date,
                session_name: rowData.session_name || null,
                session_name: rowData.session_name || null, // 🟠 AGGIUNTO session_name
                duration_minutes: rowData.duration_minutes || null,
                total_distance_m: rowData.total_distance_m || null,
                sprint_distance_m: rowData.sprint_distance_m || null,
                top_speed_kmh: rowData.top_speed_kmh || null,
                avg_speed_kmh: rowData.avg_speed_kmh || null,
                player_load: rowData.player_load || null,
                high_intensity_runs: rowData.high_intensity_runs || null,
                max_heart_rate: rowData.max_heart_rate || null,
                avg_heart_rate: rowData.avg_heart_rate || null,
                
                // ================= NUOVI CAMPI - DISTANZE E VELOCITÀ =================
                equivalent_distance_m: rowData.equivalent_distance_m || null,
                equivalent_distance_pct: rowData.equivalent_distance_pct || null,
                distance_per_min: rowData.distance_per_min || null,
                distance_over_15_kmh_m: rowData.distance_over_15_kmh_m || null,
                distance_15_20_kmh_m: rowData.distance_15_20_kmh_m || null,
                distance_20_25_kmh_m: rowData.distance_20_25_kmh_m || null,
                distance_over_25_kmh_m: rowData.distance_over_25_kmh_m || null,
                distance_over_20_kmh_m: rowData.distance_over_20_kmh_m || null,
                
                // ================= NUOVI CAMPI - POTENZA METABOLICA =================
                avg_metabolic_power_wkg: rowData.avg_metabolic_power_wkg || null,
                distance_over_20wkg_m: rowData.distance_over_20wkg_m || null,
                distance_over_35wkg_m: rowData.distance_over_35wkg_m || null,
                max_power_5s_wkg: rowData.max_power_5s_wkg || null,
                
                // ================= NUOVI CAMPI - ACCELERAZIONI/DECELERAZIONI =================
                distance_acc_over_2_ms2_m: rowData.distance_acc_over_2_ms2_m || null,
                distance_dec_over_minus2_ms2_m: rowData.distance_dec_over_minus2_ms2_m || null,
                pct_distance_acc_over_2_ms2: rowData.pct_distance_acc_over_2_ms2 || null,
                pct_distance_dec_over_minus2_ms2: rowData.pct_distance_dec_over_minus2_ms2 || null,
                distance_acc_over_3_ms2_m: rowData.distance_acc_over_3_ms2_m || null,
                distance_dec_over_minus3_ms2_m: rowData.distance_dec_over_minus3_ms2_m || null,
                num_acc_over_3_ms2: rowData.num_acc_over_3_ms2 || null,
                num_dec_over_minus3_ms2: rowData.num_dec_over_minus3_ms2 || null,
                acc_events_per_min_over_2_ms2: rowData.acc_events_per_min_over_2_ms2 || null,
                dec_events_per_min_over_minus2_ms2: rowData.dec_events_per_min_over_minus2_ms2 || null,
                
                // ================= NUOVI CAMPI - ZONE DI INTENSITÀ =================
                time_under_5wkg_min: rowData.time_under_5wkg_min || null,
                time_5_10_wkg_min: rowData.time_5_10_wkg_min || null,
                
                // ================= NUOVI CAMPI - INDICI E PROFILI =================
                rvp_index: rowData.rvp_index || null,
                training_load: rowData.training_load || rowData.player_load || null, // Fallback su player_load
                
                // ================= NUOVI CAMPI - INFORMAZIONI AGGIUNTIVE =================
                session_day: rowData.session_day || null,
                is_match: rowData.is_match || null,
                drill_name: rowData.drill_name || null,
                
                // ================= CAMPI SISTEMA =================
                source_device: rowData.source_device || "CSV Import",
                notes: rowData.notes || null,
                extras: rowData.extras || null,
                created_by: { connect: { id: createdById } },
              };

              const { playerId: pId, ...dataWithoutPlayerId } = performanceData;

              // Se lo schema consente FK scalari, usiamole per ridurre overhead
              let created;
              if (tx.performanceData.fields?.playerId && tx.performanceData.fields?.teamId) {
                created = await tx.performanceData.create({
                  data: {
                    ...dataWithoutPlayerId,
                    playerId: pId,
                    teamId: teamId,
                  },
                });
              } else {
                created = await tx.performanceData.create({
                  data: {
                    ...dataWithoutPlayerId,
                    player: { connect: { id: pId } },
                    team: { connect: { id: teamId } },
                  },
                });
              }

              if (process.env.IMPORT_DEBUG === '1') {
                console.log(
                  "🟢 Record creato:",
                  created.id,
                  "per",
                  playerIdToName.get(created.playerId) || created.playerId
                );
              }

              importResults.successful.push({
                id: created.id,
                playerName: playerIdToName.get(created.playerId) || "",
                sessionDate: created.session_date,
              });

              importResults.summary.playersAffected.add(created.playerId);
            } catch (rowError) {
              console.log("🔴 Errore inserimento riga:", rowError.message); // ERROR - mantenere essenziali

              importResults.failed.push({
                data: rowData,
                error: rowError.message,
              });
            }
          }
        }, {
          timeout: TRANSACTION_TIMEOUT, // 🟠 Timeout configurabile
          isolationLevel: 'ReadCommitted' // 🟠 Ottimizzazione isolamento
        });

        dlog("Import batch processed:", { batchIndex, batchSize: batch.length });

        // 🟠 Pausa tra batch per evitare sovraccarico database (configurabile)
        if (BATCH_DELAY_MS > 0 && (batchIndex + 1 < batches.length)) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }

      } catch (batchError) {
        console.log(`🔴 Errore batch ${batchIndex + 1}: ${batchError.message}`); // ERROR - mantenere essenziali
        
        // Segna tutto il batch come fallito
        batch.forEach((rowData) => {
          importResults.failed.push({
            data: rowData,
            error: `Batch error: ${batchError.message}`,
          });
        });
      }
    }

    // 📊 Calcola statistiche finali
    const endTime = Date.now();
    const processingTime = `${((endTime - startTime) / 1000).toFixed(2)}s`;

    importResults.summary.successfulImports = importResults.successful.length;
    importResults.summary.errors = importResults.failed.length;
    importResults.summary.successRate = Math.round(
      (importResults.summary.successfulImports /
        importResults.summary.totalProcessed) *
        100
    );
    importResults.summary.playersAffected =
      importResults.summary.playersAffected.size;
    importResults.summary.processingTime = processingTime;

    // Calcola range date
    if (importResults.successful.length > 0) {
      const dates = importResults.successful.map(
        (item) => new Date(item.sessionDate)
      );
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      importResults.summary.dateRange =
        minDate.getTime() === maxDate.getTime()
          ? minDate.toLocaleDateString("it-IT")
          : `${minDate.toLocaleDateString("it-IT")} - ${maxDate.toLocaleDateString("it-IT")}`;
    }

    console.log("🟢 [INFO] Import completato:", {
      successo: importResults.summary.successfulImports,
      errori: importResults.summary.errors,
      tasso: importResults.summary.successRate + "%",
      tempo: processingTime,
    }); // INFO - rimuovere in produzione

    // 🎉 Response finale
    return res.json({
      message: "Import completato con successo",
      data: {
        summary: importResults.summary,
        errors: importResults.failed.slice(0, 10),
        successful: importResults.successful.slice(0, 5),
        hasMoreErrors: importResults.failed.length > 10,
        transformationStats: stats,
      },
    });

  } catch (error) {
    derr("Import error:", error?.message);
    derr("Import error stack:", error.stack);

    return res.status(500).json({
      error: "Errore interno durante import finale",
      code: "IMPORT_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * 📋 GET /api/performance/player/:playerId/dossier
 * Dossier dettagliato giocatore - MULTI-TENANT
 */
router.get("/player/:playerId/dossier", ensureNumericParam("playerId"), async (req, res) => {
  const logger = require("../utils/logger");
  try {
    // Helper per evitare crash con dati sporchi
    const safeNum = v => Number.isFinite(Number(v)) ? Number(v) : 0;
    const safeDate = v => (v instanceof Date ? v : new Date(v || Date.now()));

    const { buildPeriodRange, parseSessionTypeFilter, computeHSR, computeSprintPer90, calculateACWR, round } = require("../utils/kpi");
    
    const playerId = Number(req.params.playerId);
    const { period = 'week', sessionType = 'all', sessionName = 'all', roles = '', startDate, endDate } = req.query;
    const teamId = req.context.teamId;

    const { periodStart, periodEnd } = buildPeriodRange(period, startDate, endDate);
    console.log(`📊 /player/${playerId}/dossier -> periodo=${period} start=${periodStart.toISOString()} end=${periodEnd.toISOString()}`);
    const sessionTypeFilter = parseSessionTypeFilterSimple(sessionType);
    const sessionNameFilter = parseSessionTypeFilter(sessionName);

    dlog("[DOSSIER] request:", { playerId, period, sessionType, sessionName, teamId });
    console.log('🔍 DEBUG DOSSIER - Filtri applicati:', {
      sessionType,
      sessionTypeFilter,
      sessionName,
      sessionNameFilter,
      period,
      periodStart,
      periodEnd
    });

    const prisma = getPrismaClient();

    // Verifica che il giocatore appartenga al team
    const player = await prisma.player.findFirst({
      where: { 
        id: playerId,
        teamId 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        shirtNumber: true,
        isActive: true
      }
    });

    if (!player) {
      return res.status(404).json({
        error: "Player not found in this team",
        code: "DOSSIER_404"
      });
    }

    // Carica sessioni nel periodo richiesto
    const sessions = await prisma.performanceData.findMany({
      where: {
        playerId,
        session_date: { gte: safeDate(periodStart), lte: safeDate(periodEnd) },
        ...(sessionTypeFilter ? { session_type: sessionTypeFilter } : {}),
        ...(sessionNameFilter ? { session_name: sessionNameFilter } : {})
      },
      orderBy: { session_date: 'desc' },
      select: {
        id: true,
        session_date: true,
        session_name: true,
        duration_minutes: true,
        player_load: true,
        top_speed_kmh: true,
        high_intensity_runs: true,
        sprint_distance_m: true,
        distance_over_15_kmh_m: true,
        distance_15_20_kmh_m: true,
        distance_20_25_kmh_m: true,
        distance_over_25_kmh_m: true,
        total_distance_m: true,
        num_acc_over_3_ms2: true,
        num_dec_over_minus3_ms2: true,
        avg_heart_rate: true,
        max_heart_rate: true,
        extras: true,          // JSON con eventuali rpe/sRPE
        notes: true,
      }
    });

    // KPI robusti + ACWR su finestra a periodEnd
    const hsr = computeHSR(sessions);
    const sprintPer90 = computeSprintPer90(sessions);

    const acwrEndDate = safeDate(periodEnd);
    const acwrStartDate = new Date(acwrEndDate.getTime() - 28 * 86400000);
    const acwrData = await prisma.performanceData.findMany({
      where: {
        playerId,
        session_date: { gte: acwrStartDate, lte: acwrEndDate },
        ...(sessionTypeFilter && { session_type: sessionTypeFilter }),
        ...(sessionNameFilter && { session_name: sessionNameFilter })
      },
      select: { session_date: true, player_load: true }
    });
    const acwr = (() => {
      // Prepara i dati nel formato corretto per calculateACWR
      const sessions = acwrData.map(r => ({
        playerId: playerId,
        session_date: r.session_date,
        training_load: r.player_load || 0
      }));
      
      // Calcola ACWR per questo giocatore
      const acwrResults = calculateACWR(sessions);
      
      // Prendi l'ACWR più recente (ultima data nel periodo)
      if (acwrResults.length > 0) {
        // Trova il risultato più vicino a periodEnd
        const targetDate = acwrEndDate.toISOString().split('T')[0];
        const closest = acwrResults.reduce((prev, curr) => {
          return (Math.abs(new Date(curr.date) - acwrEndDate) < Math.abs(new Date(prev.date) - acwrEndDate)) ? curr : prev;
        });
        return closest.acwr || 0;
      }
      return 0;
    })();

    // top speed nel periodo (fallback 0)
    const topSpeedKmh = sessions.reduce((m, s) => {
      const v = safeNum(s.top_speed_kmh);
      return v > m ? v : m;
    }, 0);

    // pl/min nel periodo (media semplice o 0)
    const totalPL = sessions.reduce((s, r) => s + safeNum(r.player_load), 0);
    const totalMin = sessions.reduce((s, r) => s + safeNum(r.duration_minutes), 0);
    const plPerMin = totalMin > 0 ? totalPL / totalMin : 0;

    // "lastSession" sicura
    const last = sessions[0];
    const lastSession = last ? (() => {
      const r = extractRPEfromExtras(last);
      const minutes = safeNum(last.duration_minutes || 0);
      const sRPEVal = r.session_rpe > 0 ? r.session_rpe : (r.rpe > 0 && minutes > 0 ? Math.round(r.rpe * minutes) : 0);
      return {
        date: safeDate(last.session_date),
        type: last.session_name || null,
        duration_minutes: safeNum(last.duration_minutes),
        player_load: safeNum(last.player_load),
        top_speed_kmh: safeNum(last.top_speed_kmh),
        high_intensity_runs: safeNum(last.high_intensity_runs),
        rpe: safeNum(r.rpe || 0),
        session_rpe: sRPEVal,
        notes: last.notes || null
      };
    })() : null;

    // Formatta output per adattarsi al frontend
    const roleMap = {
      'GOALKEEPER': 'POR',
      'DEFENDER': 'DIF',
      'MIDFIELDER': 'CEN', 
      'FORWARD': 'ATT'
    };

    // Calcola statistiche aggiuntive per il frontend
    const totalDistance = sessions.reduce((s, r) => s + safeNum(r.total_distance_m || 0), 0);
    const totalMinutes = sessions.reduce((s, r) => s + safeNum(r.duration_minutes), 0);
    const totalSteps = sessions.reduce((s, r) => s + safeNum(r.steps || 0), 0);

    // --- Riepilogo Intensità (zone velocità) ---
    const zone15_20 = sessions.reduce((s, r) => s + safeNum(r.distance_15_20_kmh_m || 0), 0);
    const zone20_25 = sessions.reduce((s, r) => s + safeNum(r.distance_20_25_kmh_m || 0), 0);
    const zone25plus = sessions.reduce((s, r) => s + safeNum(r.distance_over_25_kmh_m || 0), 0);

    // Helper per estrarre RPE/sRPE da extras
    function extractRPEfromExtras(row) {
      try {
        const raw = row?.extras;
        const ex = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
        // alias comuni usati negli import
        const rpe =
          Number(ex?.rpe) ??
          Number(ex?.borg) ??
          Number(ex?.borg_rpe) ??
          Number(ex?.RPE) ?? 0;

        const sRPE =
          Number(ex?.session_rpe) ??
          Number(ex?.sRPE) ??
          Number(ex?.srpe) ?? 0;

        return {
          rpe: Number.isFinite(rpe) ? rpe : 0,
          session_rpe: Number.isFinite(sRPE) ? sRPE : 0
        };
      } catch {
        return { rpe: 0, session_rpe: 0 };
      }
    }

    // --- Riepilogo Cardio ---
    const avgHRValues = sessions.map(r => safeNum(r.avg_heart_rate || 0)).filter(v => v > 0);
    const maxHRValues = sessions.map(r => safeNum(r.max_heart_rate || 0)).filter(v => v > 0);

    // Estrai rpe/sRPE riga per riga da extras (con fallback)
    const rpeRows = sessions.map(s => {
      const { rpe, session_rpe } = extractRPEfromExtras(s);
      const minutes = safeNum(s.duration_minutes || 0);
      const sRPEcalc = session_rpe > 0 ? session_rpe : (rpe > 0 && minutes > 0 ? rpe * minutes : 0);
      return { rpe: safeNum(rpe), sRPE: sRPEcalc };
    });

    const cardio = {
      avgHR: avgHRValues.length ? Math.round(avgHRValues.reduce((a, b) => a + b, 0) / avgHRValues.length) : null,
      maxHR: maxHRValues.length ? Math.max(...maxHRValues) : null,
      // RPE medio (media dei Borg > 0)
      rpeAvg: (() => {
        const vals = rpeRows.map(r => r.rpe).filter(v => v > 0);
        return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
      })(),
      // sRPE totale periodo (somma)
      rpeSession: Math.round(rpeRows.reduce((sum, r) => sum + (r.sRPE || 0), 0))
    };

    // --- Riepilogo Acc/Dec ---
    const accTotal = sessions.reduce((s, r) => s + safeNum(r.num_acc_over_3_ms2 || 0), 0);
    const decTotal = sessions.reduce((s, r) => s + safeNum(r.num_dec_over_minus3_ms2 || 0), 0);

    return res.json({
      player: {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`,
        role: roleMap[player.position] || player.position,
        number: player.shirtNumber,
        status: player.isActive ? 'active' : 'inactive'
      },
      summary: {
        plPerMin: round(plPerMin, 2),
        hsrTot: round(hsr),
        sprintPer90: round(sprintPer90, 2),
        topSpeedMax: round(topSpeedKmh, 2),
        acwr: round(acwr, 2),
        distTot: totalDistance,
        minutesTot: totalMinutes,
        stepsTot: totalSteps,
        trend: {
          plPerMin: 0, // TODO: calcola trend se necessario
          hsrTot: 0,
          sprintPer90: 0,
          topSpeedMax: 0
        }
      },
      // 🔵 Nuova sezione per il tab "Intensità"
      intensity: {
        zone15_20: zone15_20,
        zone20_25: zone20_25,
        zone25plus: zone25plus,
        hsrTot: round(hsr)
      },
      // 🔵 Nuova sezione per il tab "Cardio"
      cardio,
      // 🔵 Nuova sezione per il tab "Acc/Dec"
      accDec: {
        acc: accTotal,
        dec: decTotal,
        impact: null
      },
      percentiles: {
        plPerMin: 50, // TODO: calcola percentili se necessario
        hsrTot: 50,
        sprintPer90: 50,
        topSpeedMax: 50
      },
      breakdown: {
        bySession: sessions.map(s => {
          const rpeInfo = extractRPEfromExtras(s);
          const minutes = safeNum(s.duration_minutes || 0);
          const rpeVal = safeNum(rpeInfo.rpe || 0);
          const sRPEVal = rpeInfo.session_rpe > 0 ? rpeInfo.session_rpe : (rpeVal > 0 && minutes > 0 ? Math.round(rpeVal * minutes) : 0);
          return {
            id: s.id,
            date: safeDate(s.session_date).toLocaleDateString('it-IT'),
            type: s.session_name || 'Allenamento',
            minutes: safeNum(s.duration_minutes),
            PL: safeNum(s.player_load),
            notes: s.notes || null,
            topSpeed: safeNum(s.top_speed_kmh),
            hsr: safeNum(s.high_intensity_runs),
            zone15_20: safeNum(s.distance_15_20_kmh_m || 0),
            zone20_25: safeNum(s.distance_20_25_kmh_m || 0),
            zone25plus: safeNum(s.distance_over_25_kmh_m || 0),
            acc: safeNum(s.num_acc_over_3_ms2 || 0),
            dec: safeNum(s.num_dec_over_minus3_ms2 || 0),
            avgHR: safeNum(s.avg_heart_rate || 0),
            maxHR: safeNum(s.max_heart_rate || 0),
            rpe: rpeVal,
            sRPE: sRPEVal
          };
        })
      },
      lastSession
    });

  } catch (err) {
    derr("[DOSSIER] crash:", err?.message, err?.stack);
    return res.status(500).json({ error: "Internal Server Error", code: "DOSSIER_500" });
  }
});

/**
 * 📊 GET /api/performance/compare
 * Confronto tra giocatori - MULTI-TENANT
 */
router.get("/compare", async (req, res) => {
  try {
    const teamId = req.context.teamId;
    const playerIds = (req.query.players || '').split(',').filter(Boolean).map(Number);
    
    // Parametri di filtro
    const period = (req.query.period || 'week');
    const sessionType = (req.query.sessionType || 'all');
    const sessionName = (req.query.sessionName || 'all');
    const roles = (req.query.roles || '').split(',').filter(Boolean);
    const status = (req.query.status || 'all');
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    console.log('[COMPARE] filters', { playerIds, period, sessionType, roles, status, startDate, endDate, teamId });

    if (playerIds.length === 0) {
      return res.status(400).json({
        error: "Nessun giocatore specificato per il confronto",
        code: "NO_PLAYERS_SPECIFIED"
      });
    }

    const prisma = getPrismaClient();

    // Verifica che tutti i giocatori appartengano al team
    const players = await prisma.player.findMany({
      where: { 
        id: { in: playerIds },
        teamId 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        shirtNumber: true,
        isActive: true
      }
    });

    if (players.length !== playerIds.length) {
      return res.status(400).json({
        error: "Uno o più giocatori non trovati o non appartengono al team",
        code: "INVALID_PLAYERS"
      });
    }

    // Calcola range date
    let periodStart, periodEnd;
    if (period === 'custom' && startDate && endDate) {
      periodStart = new Date(startDate);
      periodEnd = new Date(endDate);
    } else {
      const today = new Date();
      switch (period) {
        case 'month':
          periodStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          periodEnd = today;
          break;
        case 'quarter':
          periodStart = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
          periodEnd = today;
          break;
        case 'week':
        default:
          periodStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          periodEnd = today;
          break;
      }
    }

          // Filtro session type (session_type)
      const sessionTypeFilter = (() => {
        switch (sessionType) {
          case 'allenamento': return 'allenamento';
          case 'partita': return 'partita';
          case 'all':
          default: return undefined;
        }
      })();

      // Filtro session name (session_name)
      const sessionNameFilter = (() => {
        if (sessionName === 'all') return undefined;
        return sessionName;
      })();

      // Carica dati performance per tutti i giocatori
      const performanceData = await prisma.performanceData.findMany({
        where: {
          playerId: { in: playerIds },
          session_date: { gte: periodStart, lte: periodEnd },
          ...(sessionTypeFilter && { session_type: sessionTypeFilter }),
          ...(sessionNameFilter && { session_name: sessionNameFilter })
        },
      orderBy: { session_date: 'desc' }
    });

      // Carica dati per ACWR (ultimi 28 giorni, finestra che termina in periodEnd)
      const acwrEndDate = periodEnd;
      const acwrStartDate = new Date(acwrEndDate.getTime() - 28 * 86400000);

      const acwrData = await prisma.performanceData.findMany({
        where: {
          playerId: { in: playerIds },
          session_date: { gte: acwrStartDate, lte: acwrEndDate },
          ...(sessionTypeFilter && { session_type: sessionTypeFilter }),
          ...(sessionNameFilter && { session_name: sessionNameFilter })
        },
        select: { playerId: true, session_date: true, player_load: true }
      });

    // Calcola KPI per ogni giocatore
    const playersWithStats = await Promise.all(players.map(async (player) => {
      const playerData = performanceData.filter(p => p.playerId === player.id);

      const totalPlayerLoad = playerData.reduce((sum, p) => sum + (p.player_load || 0), 0);
      const totalDuration = playerData.reduce((sum, p) => sum + (p.duration_minutes || 0), 0);
      const plMin = totalDuration > 0 ? totalPlayerLoad / totalDuration : 0;

      // ✅ Usa util KPI comuni
      const hsr = computeHSR(playerData);
      const sprintPer90 = computeSprintPer90(playerData);

      const topSpeed = Math.max(...playerData.map(p => p.top_speed_kmh || 0), 0);

      // ACWR calculation (filtra i record della finestra 28gg per il singolo giocatore)
      const playerAcwrData = acwrData.filter(p => p.playerId === player.id);
      const acwr = (() => {
        // Prepara i dati nel formato corretto per calculateACWR
        const sessions = playerAcwrData.map(d => ({
          playerId: d.playerId,
          session_date: d.session_date,
          training_load: d.player_load || 0
        }));
        
        // Calcola ACWR per questo giocatore
        const acwrResults = calculateACWR(sessions);
        
        // Prendi l'ACWR più recente
        if (acwrResults.length > 0) {
          const latest = acwrResults[acwrResults.length - 1];
          return latest.acwr || 0;
        }
        return 0;
      })();

      // Sanitizza numeri
      const round = (v, d = 2) => Number.isFinite(v) ? Number(v.toFixed(d)) : null;

      // Formatta output
      const roleMap = {
        'GOALKEEPER': 'POR',
        'DEFENDER': 'DIF',
        'MIDFIELDER': 'CEN', 
        'FORWARD': 'ATT'
      };

      return {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`,
        role: roleMap[player.position] || player.position,
        number: player.shirtNumber,
        status: player.isActive ? 'active' : 'inactive',
        kpis: {
          plMin: round(plMin, 2),
          hsr: Number.isFinite(hsr) ? Math.round(hsr) : null,
          sprintPer90: round(sprintPer90, 2),
          topSpeed: round(topSpeed, 2),
          acwr: round(acwr, 2)
        },
        summary: {
          totalSessions: playerData.length,
          totalDuration: totalDuration,
          totalPlayerLoad: totalPlayerLoad,
          avgSessionDuration: playerData.length > 0 ? totalDuration / playerData.length : 0,
          avgPlayerLoad: playerData.length > 0 ? totalPlayerLoad / playerData.length : 0
        }
      };
    }));

    res.json(playersWithStats);

  } catch (error) {
    derr("Compare error:", error?.message);
    res.status(500).json({
      error: 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 📊 GET /api/performance/session-types
 * Ottiene i tipi di sessione disponibili nel database - MULTI-TENANT
 */
 router.get("/session-types", async (req, res) => {
  try {
    console.log('🔵 [DEBUG] API session-types chiamata per team:', req.context?.teamId);
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(403).json({ error: 'Team non disponibile nel contesto' });
    }

    const prisma = getPrismaClient();

    // Ottieni tutti i tipi di sessione distinti dal database per questo team
    const sessionTypes = await prisma.performanceData.findMany({
      where: {
        player: { teamId }
      },
                   select: {
        session_name: true
      },
      distinct: ['session_name']
    });

    // Estrai i valori e filtra quelli null/undefined
    const availableTypes = sessionTypes
      .map(st => st.session_name)
      .filter(type => type && type.trim() !== '')
      .sort();

    console.log('🔵 [DEBUG] Session types disponibili per team', teamId, ':', availableTypes);
    console.log('🟢 [INFO] API session-types risposta:', { sessionTypes: availableTypes, count: availableTypes.length });

    res.json({
      sessionTypes: availableTypes,
      count: availableTypes.length
    });

  } catch (error) {
    console.error('🔴 Errore nel recupero session types:', error);
    res.status(500).json({
      error: 'Errore interno durante il recupero dei tipi di sessione',
      code: 'session_nameS_ERROR'
    });
  }
});

console.log("🔵 [DEBUG] Route performance multi-tenant configurate:");
console.log("  - GET    /api/performance (lista con filtri team-scoped)");
console.log("  - POST   /api/performance (creazione team-scoped)");
console.log("  - GET    /api/performance/:id (dettaglio team-scoped)");
console.log("  - DELETE /api/performance/:id (eliminazione team-scoped)");
console.log("  - GET    /api/performance/stats/player/:playerId (stats giocatore team-scoped)");
console.log("  - GET    /api/performance/stats/team (stats team-scoped)");
console.log("  - GET    /api/performance/player/:playerId/sessions (sessioni giocatore team-scoped)");
console.log("  - GET    /api/performance/player/:playerId/dossier (dossier giocatore team-scoped)");
console.log("  - GET    /api/performance/compare (confronto giocatori team-scoped)");

module.exports = router;
