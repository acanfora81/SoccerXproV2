const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { PrismaClient } = require("../../prisma/generated/client");
const prisma = new PrismaClient();
const router = express.Router();

const upload = multer({ dest: "uploads/" });

// GET /api/taxrates - Recupera aliquote per team
router.get("/", async (req, res) => {
  try {
    const { teamId } = req.query;
    
    if (!teamId) {
      return res.status(400).json({ 
        success: false, 
        message: "Team ID mancante" 
      });
    }

    console.log('🔵 TaxRates GET: Recupero aliquote per teamId:', teamId);

    const taxRates = await prisma.taxRate.findMany({
      where: { teamId },
      orderBy: [
        { year: 'desc' },
        { type: 'asc' }
      ]
    });

    console.log('🟢 TaxRates GET: Trovate', taxRates.length, 'aliquote');
    console.log('🔵 TaxRates GET: Dettaglio aliquote:', taxRates.map(r => ({
      id: r.id,
      year: r.year,
      type: r.type,
      inps: r.inps,
      inail: r.inail,
      ffc: r.ffc
    })));

    res.json({
      success: true,
      data: taxRates,
      count: taxRates.length
    });

  } catch (error) {
    console.error('🔴 TaxRates GET: Errore:', error);
    res.status(500).json({ 
      success: false, 
      message: "Errore nel recupero delle aliquote: " + error.message 
    });
  }
});

// POST /api/taxrates/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // Validazione input
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Nessun file caricato" 
      });
    }

    const teamId = req.body.teamId;
    if (!teamId) {
      return res.status(400).json({ 
        success: false, 
        message: "Team ID mancante" 
      });
    }

    console.log('🔵 TaxRates Upload: File ricevuto:', req.file.originalname, 'TeamId:', teamId);

    const results = [];
    let processedCount = 0;

    // Leggi e processa il CSV manualmente
    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: "File CSV vuoto o formato non valido" 
      });
    }

    // Prima riga = headers
    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
    console.log('🔵 TaxRates Upload: Headers rilevati:', headers);

    // Processa le righe di dati
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        console.log('🔵 TaxRates Upload: Riga CSV:', row);
        results.push(row);
      }
    }

    // Processa i risultati
    try {
      console.log('🔵 TaxRates Upload: Processando', results.length, 'righe');

      for (const row of results) {
        // Validazione dati
        if (!row.year || !row.type || !row.inps || !row.ffc) {
          console.log('🔴 TaxRates Upload: Riga incompleta:', row);
          continue;
        }

        const year = parseInt(row.year);
        const type = row.type.trim().toUpperCase();
        // Gestisci sia virgole che punti come separatori decimali
        const inps = parseFloat(row.inps.replace(',', '.'));
        const inail = row.inail && row.inail.trim() ? parseFloat(row.inail.replace(',', '.')) : null;
        const ffc = parseFloat(row.ffc.replace(',', '.'));

        // Valida che il tipo sia un valore ENUM valido
        const validTypes = ['PERMANENT', 'LOAN', 'TRIAL', 'YOUTH', 'PROFESSIONAL', 'AMATEUR', 'APPRENTICESHIP', 'TRAINING_AGREEMENT'];
        if (!validTypes.includes(type)) {
          console.log('🔴 TaxRates Upload: Tipo contratto non valido:', type, 'Validi:', validTypes);
          continue;
        }

        console.log('🔵 TaxRates Upload: Upserting:', { year, type, inps, inail, ffc, teamId });

        await prisma.taxRate.upsert({
          where: {
            year_type_teamId: { year, type, teamId },
          },
          update: { inps, inail, ffc, updatedAt: new Date() },
          create: { year, type, inps, inail, ffc, teamId },
        });

        processedCount++;
      }

      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      console.log('🟢 TaxRates Upload: Completato, processate', processedCount, 'aliquote');
      res.json({ 
        success: true, 
        message: `Aliquote caricate con successo! Processate ${processedCount} aliquote.` 
      });

    } catch (dbError) {
      console.error('🔴 TaxRates Upload: Errore database:', dbError);
      
      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      res.status(500).json({ 
        success: false, 
        message: "Errore nel salvataggio delle aliquote: " + dbError.message 
      });
    }

  } catch (error) {
    console.error('🔴 TaxRates Upload: Errore generale:', error);
    
    // Cleanup file temporaneo se esiste
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Errore interno del server: " + error.message 
    });
  }
});

// DELETE /api/taxrates/:id - Elimina aliquota specifica
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { teamId } = req.query;
    
    if (!teamId) {
      return res.status(400).json({ 
        success: false, 
        message: "Team ID mancante" 
      });
    }

    console.log('🔵 TaxRates DELETE: Eliminazione aliquota ID:', id, 'TeamId:', teamId);

    // Verifica che l'aliquota appartenga al team
    const existingRate = await prisma.taxRate.findFirst({
      where: { 
        id: parseInt(id),
        teamId: teamId
      }
    });

    if (!existingRate) {
      return res.status(404).json({ 
        success: false, 
        message: "Aliquota non trovata o non autorizzata" 
      });
    }

    // Elimina l'aliquota
    await prisma.taxRate.delete({
      where: { id: parseInt(id) }
    });

    console.log('🟢 TaxRates DELETE: Aliquota eliminata con successo');

    res.json({
      success: true,
      message: "Aliquota eliminata con successo"
    });

  } catch (error) {
    console.error('🔴 TaxRates DELETE: Errore:', error);
    res.status(500).json({ 
      success: false, 
      message: "Errore nell'eliminazione dell'aliquota: " + error.message 
    });
  }
});

module.exports = router;
