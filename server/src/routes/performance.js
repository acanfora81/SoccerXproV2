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

// 🔧 AGGIUNTE per preview-mapping con file upload
const multer = require("multer");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const { completeRow } = require("../utils/gpsDeriver.js");

const upload = multer({ dest: "uploads/" });

console.log("🟢 Caricamento route performance multi-tenant...");

const router = express.Router();

// 🟠 Configurazioni ottimizzazione import (configurabili via ENV)
const BATCH_SIZE = Math.max(
  1,
  parseInt(process.env.IMPORT_BATCH_SIZE || "100", 10) || 100
); // Record per batch
const TRANSACTION_TIMEOUT =
  parseInt(process.env.IMPORT_TX_TIMEOUT_MS || "20000", 10) || 20000; // ms
const BATCH_DELAY_MS =
  parseInt(process.env.IMPORT_BATCH_DELAY_MS || "0", 10) || 0; // ms

// 🔐 Middleware di autenticazione + tenant context per tutte le route
router.use(authenticate, tenantContext); // 🔧 FIXED - Aggiunto tenantContext

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
    console.error("🔴 Upload error:", err);
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
    console.log("🔵 Invocazione smart mapper per headers:", headers); // INFO DEV - rimuovere in produzione
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
    console.log("🟢 Smart mapping completato:", {
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

      fs.unlinkSync(filePath);

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

      const normalizedMapping = {};
      Object.entries(mapping).forEach(([csvHeader, desc]) => {
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

    const normalizedMapping = {};
    Object.entries(mapping).forEach(([csvHeader, desc]) => {
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
    console.log("🟡 === IMPORT FINALE DATI RICEVUTI ===");
    console.log("🟡 FileId ricevuto:", fileId);
    console.log("🟡 Team ID:", teamId);
    console.log("🟡 User ID:", createdById);
    console.log("🟡 Original extension:", originalExtension);
    console.log("🟡 Mapping ricevuto (tipo):", typeof mapping);
    console.log("🟡 Mapping ricevuto (chiavi):", Object.keys(mapping || {}));
    console.log("🟡 Mapping completo:", JSON.stringify(mapping, null, 2));

    // Debug ogni campo mappato
    if (mapping && typeof mapping === "object") {
      Object.entries(mapping).forEach(([csvHeader, fieldInfo]) => {
        console.log(
          `🟡 ${csvHeader} → ${fieldInfo.dbField} (${fieldInfo.dbField?.startsWith("custom.") ? "CUSTOM" : "PREDEFINITO"})`
        );
      });
    }
    console.log("🟡 ================================");

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
    console.log("🟡 Lettura file:", filePath, "estensione:", ext);

    if (ext === ".csv") {
      const firstLine = fs.readFileSync(filePath, "utf8").split("\n")[0];
      const separator = firstLine.includes(";") ? ";" : ",";
      console.log("🟡 CSV separatore:", separator);

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

    console.log("🟡 Righe lette dal file:", allRows.length);
    if (allRows.length > 0) {
      console.log("🟡 Prima riga esempio:", Object.keys(allRows[0]));
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

    const normalizedMapping = {};
    Object.entries(mapping).forEach(([csvHeader, desc]) => {
      const cleanHeader = strip(csvHeader);
      normalizedMapping[cleanHeader] = { ...desc, csvHeader: cleanHeader };
    });

    console.log("🟡 Mapping normalizzato:", Object.keys(normalizedMapping));

    const transformResult = await smartColumnMapper.applyMapping(
      normalizedRows,
      normalizedMapping,
      teamId
    );

    console.log("🟡 Risultato trasformazione:", {
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
  console.log("🟢 Template auto-salvato (se valido)");
} catch (tplErr) {
  console.log("🟡 Auto-learn template skipped:", tplErr.message);
}


    // Debug primi dati trasformati
    if (transformResult.data.length > 0) {
      console.log(
        "🟡 Prima riga trasformata:",
        Object.keys(transformResult.data[0])
      );
      console.log("🟡 Esempio valori prima riga:", transformResult.data[0]);
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

    console.log("🟡 Import ottimizzato in", batches.length, "batch di", BATCH_SIZE);
    console.log("🔴 DEBUG TIMEOUT CONFIG:", TRANSACTION_TIMEOUT, "ms");

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      console.log(`🟡 Processando batch ${batchIndex + 1}/${batches.length}`); // DEBUG - rimuovere in produzione

      try {
        await prisma.$transaction(async (tx) => {
          for (const rowData of batch) {
            try {
              console.log("🟡 Preparazione dati per DB:", {
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
                Match: rowData.session_type === "Match" ? "Yes" : "No",
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
                console.log(`🟡 Giocatore ${completedRow.Player}: campi imputati:`, imputedFields);
              }

              const performanceData = {
                playerId: rowData.playerId,
                session_date: rowData.session_date,
                session_type: rowData.session_type || null,
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
                notes: completedRow.Note || null,
                // Campi legacy per compatibilità
                sprint_distance_m: rowData.sprint_distance_m || null,
                avg_speed_kmh: rowData.avg_speed_kmh || null,
                player_load: rowData.player_load || null,
                high_intensity_runs: rowData.high_intensity_runs || null,
                max_heart_rate: rowData.max_heart_rate || null,
                avg_heart_rate: rowData.avg_heart_rate || null,
                source_device: rowData.source_device || "CSV Import",
                notes: rowData.notes || null,
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

              console.log("🟢 Record creato:", created.id);

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

        console.log(`🟢 Batch ${batchIndex + 1} completato: ${batch.length} record processati`);

        // 🟠 Pausa tra batch per evitare sovraccarico database
        if (batchIndex + 1 < batches.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (batchError) {
        console.log(`🔴 Errore batch ${batchIndex + 1}: ${batchError.message}`);
        
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

    console.log("🟢 Import completato:", importResults.summary);

    // Cleanup file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.log("🟡 Warning: could not delete temp file:", cleanupError.message);
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
    console.log("🔴 Errore import finale:", error.message);

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

    console.log("🔵 Salvataggio template:", templateName, "per team:", teamId);

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

    console.log("🟢 Template salvato:", normalizedName);

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

    console.log("🔵 Caricamento template per team:", teamId); // INFO DEV - rimuovere in produzione

    // 📋 Carica template usando columnMapper

    const templates = await smartColumnMapper.loadTemplates(teamId);

    console.log("🟢 Template caricati:", templates.length); // INFO - rimuovere in produzione

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
          by: ["session_type"],
          where: {
            playerId,
            player: { teamId }, // 🔧 FILTRO INDIRETTO VIA RELATION
          },
          _count: { session_type: true },
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
            session_type: true,
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
          sessionType: item.session_type,
          count: item._count.session_type,
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
      const { startDate, endDate, sessionType } = req.query;
      const teamId = req.context.teamId; // 🔧 AGGIUNTO - Context multi-tenant

      console.log(
        "🔵 Richiesta statistiche team:",
        teamId,
        "filtri:",
        req.query
      );

      const prisma = getPrismaClient();

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
      if (sessionType) where.session_type = sessionType;

      const [
        totalSessions,
        activePlayersCount,
        teamAverages,
        topPerformers,
        sessionTypeBreakdown,
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
          by: ["session_type"],
          where,
          _count: { session_type: true },
          _avg: {
            total_distance_m: true,
            player_load: true,
            top_speed_kmh: true,
          },
        }),
      ]);

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
        topPerformers: topPerformers.map((item) => ({
          player: item.player,
          sessionDate: item.session_date,
          sessionType: item.session_type,
          playerLoad: item.player_load,
          totalDistance: item.total_distance_m,
          topSpeed: item.top_speed_kmh,
        })),
        sessionBreakdown: sessionTypeBreakdown.map((item) => ({
          sessionType: item.session_type,
          count: item._count.session_type,
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

      if (performanceData.createdById !== req.user.profile.id) {
        console.log(
          "🟡 Tentativo eliminazione performance data di altro utente da:",
          userRole
        );
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

    console.log("🔵 Avvio import finale per team:", teamId); // INFO DEV - rimuovere in produzione

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

      console.log("🔵 Parsing CSV con separatore:", separator); // INFO DEV - rimuovere in produzione

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator }))
          .on("data", (row) => allRows.push(row))
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (ext === ".xlsx") {
      console.log("🔵 Parsing XLSX..."); // INFO DEV - rimuovere in produzione

      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      allRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: "Formato file non supportato",
        code: "UNSUPPORTED_FORMAT",
      });
    }

    // 🧹 Cleanup file
    fs.unlinkSync(filePath);

    if (allRows.length === 0) {
      return res.status(400).json({
        error: "Nessun dato trovato nel file",
        code: "EMPTY_FILE",
      });
    }

    console.log("🔵 File parsato:", allRows.length, "righe totali"); // INFO DEV - rimuovere in produzione

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

    const normalizedMapping = {};
    Object.entries(mapping).forEach(([csvHeader, config]) => {
      const cleanHeader = normalizeString(csvHeader);
      normalizedMapping[cleanHeader] = { ...config, csvHeader: cleanHeader };
    });

    // 🎯 Applica mapping usando smartColumnMapper
    console.log("🔵 Applicazione mapping a tutti i dati..."); // INFO DEV - rimuovere in produzione

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

    console.log("🔵 Dati trasformati:", transformedData.length, "righe valide"); // INFO DEV - rimuovere in produzione

    if (transformedData.length === 0) {
      return res.status(400).json({
        error: "Nessun dato valido dopo la trasformazione",
        code: "NO_VALID_DATA",
        transformationErrors: transformErrors,
      });
    }

    // 💾 SALVATAGGIO DATABASE con transazione OTTIMIZZATA
    console.log("🔵 Avvio transazione database ottimizzata..."); // INFO DEV - rimuovere in produzione

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
      
      console.log(`🟡 Processando batch ${batchIndex + 1}/${batches.length}`); // DEBUG - rimuovere in produzione

      try {
        // 🟠 Transazione con timeout esteso e isolamento ottimizzato
        await prisma.$transaction(async (tx) => {
          for (const rowData of batch) {
            try {
              if (process.env.IMPORT_DEBUG === '1') {
                console.log("🟡 Preparazione dati per DB:", {
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
                session_type: rowData.session_type || null,
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

        console.log(`🟢 Batch ${batchIndex + 1} completato: ${batch.length} record processati`); // INFO - rimuovere in produzione

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

    console.log("🟢 Import completato:", {
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
    console.log("🔴 Errore import finale:", error.message); // ERROR - mantenere essenziali
    console.log("🔴 Stack:", error.stack); // ERROR - per debug

    return res.status(500).json({
      error: "Errore interno durante import finale",
      code: "IMPORT_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

console.log("🔵 Route performance multi-tenant configurate:");
console.log("  - GET    /api/performance (lista con filtri team-scoped)");
console.log("  - POST   /api/performance (creazione team-scoped)");
console.log("  - GET    /api/performance/:id (dettaglio team-scoped)");
console.log("  - DELETE /api/performance/:id (eliminazione team-scoped)");
console.log("  - GET    /api/performance/stats/player/:playerId (stats giocatore team-scoped)");
console.log("  - GET    /api/performance/stats/team (stats team-scoped)");
console.log("  - GET    /api/performance/player/:playerId/sessions (sessioni giocatore team-scoped)");

module.exports = router;