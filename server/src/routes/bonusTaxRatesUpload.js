const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { PrismaClient } = require("../../prisma/generated/client");

const prisma = new PrismaClient();
const router = express.Router();

// Configurazione multer per upload file
const upload = multer({ dest: "uploads/" });

// POST /api/bonustaxrates/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log('🔵 Bonus Tax Rates Upload: Inizio processo');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Nessun file caricato" });
    }

    const teamId = req.body.teamId;
    if (!teamId) {
      fs.unlink(req.file.path, (err) => { if (err) console.log('🔴 Errore cleanup file:', err); });
      return res.status(400).json({ success: false, message: "Team ID mancante" });
    }

    console.log('🔵 Bonus Tax Rates Upload: Team ID:', teamId);

    // Leggi il file CSV
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      fs.unlink(req.file.path, (err) => { if (err) console.log('🔴 Errore cleanup file:', err); });
      return res.status(400).json({ success: false, message: "File CSV vuoto o formato non valido" });
    }

    // Determina il separatore (punto e virgola o virgola)
    const separator = lines[0].includes(';') ? ';' : ',';
    console.log('🔵 Bonus Tax Rates Upload: Separatore rilevato:', separator);

    // Parse headers
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
    console.log('🔵 Bonus Tax Rates Upload: Headers:', headers);

    // Parse data
    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => { row[header] = values[index]; });
        results.push(row);
      }
    }

    console.log('🔵 Bonus Tax Rates Upload: Righe parse:', results.length);

    let processedCount = 0;
    try {
      // Processa ogni riga
      for (const row of results) {
        // Mappa le intestazioni diverse ai campi standard
        const year = row.year || row.Year;
        const type = row.type || row.BonusType;
        const taxRate = row.taxRate || row.Aliquota_Tipica;
        
        if (!year || !type || !taxRate) {
          console.log('🔴 Bonus Tax Rates Upload: Riga saltata - dati mancanti:', row);
          continue;
        }

        const yearInt = parseInt(year);
        const typeUpper = type.trim().toUpperCase();
        // Gestisci sia virgole che punti come separatori decimali e rimuovi il simbolo %
        const taxRateFloat = parseFloat(taxRate.replace(',', '.').replace('%', ''));

        console.log('🔵 Bonus Tax Rates Upload: Processando:', { year: yearInt, type: typeUpper, taxRate: taxRateFloat });

        await prisma.bonusTaxRate.upsert({
          where: {
            year_type_teamId: { year: yearInt, type: typeUpper, teamId }
          },
          update: {
            taxRate: taxRateFloat,
            updatedAt: new Date()
          },
          create: {
            year: yearInt,
            type: typeUpper,
            taxRate: taxRateFloat,
            teamId
          }
        });

        processedCount++;
      }

      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      console.log('🔵 Bonus Tax Rates Upload: Completato con successo');
      res.json({
        success: true,
        message: `Aliquote bonus caricate con successo! Processate ${processedCount} aliquote.`
      });

    } catch (dbError) {
      console.error('🔴 Bonus Tax Rates Upload: Errore database:', dbError);
      fs.unlink(req.file.path, (err) => { if (err) console.log('🔴 Errore cleanup file:', err); });
      res.status(500).json({
        success: false,
        message: "Errore nel salvataggio delle aliquote bonus: " + dbError.message
      });
    }

  } catch (error) {
    console.error('🔴 Bonus Tax Rates Upload: Errore generale:', error);
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => { if (err) console.log('🔴 Errore cleanup file:', err); });
    }
    res.status(500).json({
      success: false,
      message: "Errore interno del server: " + error.message
    });
  }
});

// GET /api/bonustaxrates
router.get("/", async (req, res) => {
  try {
    const { teamId } = req.query;
    
    if (!teamId) {
      return res.status(400).json({ success: false, message: "Team ID mancante" });
    }

    const bonusTaxRates = await prisma.bonusTaxRate.findMany({
      where: { teamId },
      orderBy: [{ year: 'desc' }, { type: 'asc' }]
    });

    res.json({
      success: true,
      data: bonusTaxRates
    });

  } catch (error) {
    console.error('🔴 Bonus Tax Rates GET: Errore:', error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero delle aliquote bonus: " + error.message
    });
  }
});

// DELETE /api/bonustaxrates/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.bonusTaxRate.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: "Aliquota bonus eliminata con successo"
    });

  } catch (error) {
    console.error('🔴 Bonus Tax Rates DELETE: Errore:', error);
    res.status(500).json({
      success: false,
      message: "Errore nell'eliminazione dell'aliquota bonus: " + error.message
    });
  }
});

// PUT /api/bonustaxrates/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { taxRate } = req.body;
    
    if (!taxRate || isNaN(parseFloat(taxRate))) {
      return res.status(400).json({ success: false, message: "Aliquota non valida" });
    }

    const updatedRate = await prisma.bonusTaxRate.update({
      where: { id: parseInt(id) },
      data: {
        taxRate: parseFloat(taxRate),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedRate,
      message: "Aliquota bonus aggiornata con successo"
    });

  } catch (error) {
    console.error('🔴 Bonus Tax Rates PUT: Errore:', error);
    res.status(500).json({
      success: false,
      message: "Errore nell'aggiornamento dell'aliquota bonus: " + error.message
    });
  }
});

module.exports = router;
