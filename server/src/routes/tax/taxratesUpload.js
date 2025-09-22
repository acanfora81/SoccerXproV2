const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { PrismaClient } = require("../../../prisma/generated/client");
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
      // Colonne legacy
      inps: r.inps,
      inail: r.inail,
      ffc: r.ffc,
      // Nuove colonne separate
      inpsWorker: r.inpsWorker,
      inpsEmployer: r.inpsEmployer,
      inailEmployer: r.inailEmployer,
      ffcWorker: r.ffcWorker,
      ffcEmployer: r.ffcEmployer,
      solidarityWorker: r.solidarityWorker,
      solidarityEmployer: r.solidarityEmployer
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

// POST /api/taxrates - creazione/upsert manuale aliquote stipendi
router.post('/', async (req, res) => {
  try {
    const { teamId, year, type, inps, inail, ffc } = req.body;
    if (!teamId || !year || !type) {
      return res.status(400).json({ success: false, message: 'Parametri mancanti' });
    }
    const yearInt = parseInt(year);
    const normalizedType = String(type).trim().toUpperCase();
    const inpsF = inps !== undefined && inps !== null ? parseFloat(String(inps).replace(',', '.')) : null;
    const inailF = inail !== undefined && inail !== null ? parseFloat(String(inail).replace(',', '.')) : null;
    const ffcF = ffc !== undefined && ffc !== null ? parseFloat(String(ffc).replace(',', '.')) : null;

    const saved = await prisma.taxRate.upsert({
      where: { year_type_teamId: { year: yearInt, type: normalizedType, teamId } },
      update: { inps: inpsF, inail: inailF, ffc: ffcF, updatedAt: new Date() },
      create: { year: yearInt, type: normalizedType, inps: inpsF, inail: inailF, ffc: ffcF, teamId }
    });

    res.json({ success: true, data: saved, message: 'Aliquota salvata' });
  } catch (error) {
    console.error('🔴 TaxRates POST: Errore:', error);
    res.status(500).json({ success: false, message: "Errore nel salvataggio dell'aliquota: " + error.message });
  }
});

// PUT /api/taxrates/:id - modifica manuale
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { inps, inail, ffc } = req.body;
    const data = {};
    if (inps !== undefined) data.inps = parseFloat(String(inps).replace(',', '.'));
    if (inail !== undefined) data.inail = parseFloat(String(inail).replace(',', '.'));
    if (ffc !== undefined) data.ffc = parseFloat(String(ffc).replace(',', '.'));
    data.updatedAt = new Date();

    const updated = await prisma.taxRate.update({ where: { id: parseInt(id) }, data });
    res.json({ success: true, data: updated, message: 'Aliquota aggiornata con successo' });
  } catch (error) {
    console.error('🔴 TaxRates PUT: Errore:', error);
    res.status(500).json({ success: false, message: "Errore nell'aggiornamento dell'aliquota: " + error.message });
  }
});

// ➕ Route per gestire le aliquote IRPEF
router.get('/irpef-brackets', async (req, res) => {
  try {
    const { year } = req.query;
    
    let whereClause = {};
    if (year) {
      whereClause.year = parseInt(year);
    }
    
    const brackets = await prisma.tax_irpef_bracket.findMany({
      where: whereClause,
      orderBy: [
        { year: 'desc' },
        { min: 'asc' }
      ]
    });
    
    console.log('🔵 IRPEF Brackets GET: Trovati', brackets.length, 'scaglioni');
    
    res.json({ success: true, data: brackets });
  } catch (error) {
    console.error('❌ Errore recupero aliquote IRPEF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/irpef-brackets', async (req, res) => {
  try {
    const { year, brackets } = req.body;
    
    if (!year || !brackets || !Array.isArray(brackets)) {
      return res.status(400).json({ 
        success: false, 
        error: 'year e brackets (array) obbligatori' 
      });
    }
    
    console.log('🔵 IRPEF Brackets POST: Inserimento scaglioni per anno', year);
    
    // Elimina brackets esistenti per l'anno
    const deleted = await prisma.tax_irpef_bracket.deleteMany({
      where: { year: parseInt(year) }
    });
    
    console.log('🔵 IRPEF Brackets POST: Eliminati', deleted.count, 'scaglioni esistenti');
    
    // Inserisci nuovi brackets
    const newBrackets = brackets.map(bracket => ({
      year: parseInt(year),
      min: parseFloat(bracket.min),
      max: bracket.max === null ? null : parseFloat(bracket.max),
      rate: parseFloat(bracket.rate)
    }));
    
    const created = await prisma.tax_irpef_bracket.createMany({
      data: newBrackets
    });
    
    console.log('🟢 IRPEF Brackets POST: Inseriti', created.count, 'nuovi scaglioni');
    
    res.json({ 
      success: true, 
      message: `Inseriti ${created.count} scaglioni IRPEF per l'anno ${year}`,
      data: created
    });
  } catch (error) {
    console.error('❌ Errore inserimento aliquote IRPEF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/irpef-brackets/:year', async (req, res) => {
  try {
    const { year } = req.params;
    
    console.log('🔵 IRPEF Brackets DELETE: Eliminazione scaglioni per anno', year);
    
    const deleted = await prisma.tax_irpef_bracket.deleteMany({
      where: { year: parseInt(year) }
    });
    
    console.log('🟢 IRPEF Brackets DELETE: Eliminati', deleted.count, 'scaglioni');
    
    res.json({ 
      success: true, 
      message: `Eliminati ${deleted.count} scaglioni IRPEF per l'anno ${year}`,
      data: deleted
    });
  } catch (error) {
    console.error('❌ Errore eliminazione aliquote IRPEF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ➕ Route per caricare aliquote IRPEF da CSV
router.post('/irpef-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nessun file caricato' 
      });
    }

    console.log('🔵 IRPEF Upload: File ricevuto:', req.file.originalname);

    const results = [];
    let processedCount = 0;

    // Leggi e processa il CSV
    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'File CSV vuoto o formato non valido' 
      });
    }

    // Prima riga = headers
    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
    console.log('🔵 IRPEF Upload: Headers rilevati:', headers);

    // Verifica headers richiesti
    const requiredHeaders = ['year', 'min', 'max', 'rate'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Headers mancanti: ${missingHeaders.join(', ')}` 
      });
    }

    // Processa le righe di dati
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        console.log('🔵 IRPEF Upload: Riga CSV:', row);
        results.push(row);
      }
    }

    // Processa i risultati
    try {
      console.log('🔵 IRPEF Upload: Processando', results.length, 'righe');

      for (const row of results) {
        // Validazione dati
        if (!row.year || !row.min || !row.rate) {
          console.log('🔴 IRPEF Upload: Riga incompleta:', row);
          continue;
        }

        const year = parseInt(row.year);
        const min = parseFloat(row.min);
        const max = row.max && row.max.trim() ? parseFloat(row.max) : null;
        const rate = parseFloat(row.rate);

        if (isNaN(year) || isNaN(min) || isNaN(rate)) {
          console.log('🔴 IRPEF Upload: Dati non numerici:', row);
          continue;
        }

        console.log('🔵 IRPEF Upload: Upserting:', { year, min, max, rate });

        await prisma.tax_irpef_bracket.upsert({
          where: {
            year_min: { year, min },
          },
          update: { max, rate, updatedAt: new Date() },
          create: { year, min, max, rate },
        });

        processedCount++;
      }

      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      console.log('🟢 IRPEF Upload: Completato, processati', processedCount, 'scaglioni');
      res.json({ 
        success: true, 
        message: `Scaglioni IRPEF caricati con successo! Processati ${processedCount} scaglioni.` 
      });

    } catch (dbError) {
      console.error('🔴 IRPEF Upload: Errore database:', dbError);
      
      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      res.status(500).json({ 
        success: false, 
        error: "Errore nel salvataggio degli scaglioni: " + dbError.message 
      });
    }

  } catch (error) {
    console.error('🔴 IRPEF Upload: Errore generale:', error);
    
    // Cleanup file temporaneo se esiste
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });
    }

    res.status(500).json({ 
      success: false, 
      error: "Errore interno del server: " + error.message 
    });
  }
});

// ========================================
// ADDIZIONALI REGIONALI
// ========================================

// GET /api/taxrates/regional-additionals - Recupera addizionali regionali
router.get('/regional-additionals', async (req, res) => {
  try {
    const { year } = req.query;
    let whereClause = {};
    if (year) {
      whereClause.year = parseInt(year);
    }
    
    // Recupera addizionali fisse
    const flatAdditionals = await prisma.tax_regional_additional.findMany({
      where: whereClause,
      orderBy: [
        { year: 'desc' },
        { region: 'asc' }
      ]
    });
    
    // Recupera addizionali progressive
    const progressiveAdditionals = await prisma.tax_regional_additional_scheme.findMany({
      where: whereClause,
      include: {
        tax_regional_additional_bracket: {
          orderBy: { min: 'asc' }
        }
      },
      orderBy: [
        { year: 'desc' },
        { region: 'asc' }
      ]
    });
    
    // Combina i risultati
    const allAdditionals = [
      ...flatAdditionals.map(additional => ({
        ...additional,
        is_progressive: false,
        flat_rate: additional.rate,
        tax_regional_additional_bracket: []
      })),
      ...progressiveAdditionals.map(scheme => ({
        id: scheme.id,
        year: scheme.year,
        region: scheme.region,
        is_progressive: true,
        flat_rate: scheme.flat_rate,
        tax_regional_additional_bracket: scheme.tax_regional_additional_bracket
      }))
    ];
    
    console.log('🔵 Regional Additionals GET: Trovate', allAdditionals.length, 'addizionali');
    res.json({ success: true, data: allAdditionals });
  } catch (error) {
    console.error('❌ Errore recupero addizionali regionali:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/taxrates/regional-additionals - Inserisce nuova addizionale regionale
router.post('/regional-additionals', async (req, res) => {
  try {
    const { year, region, isProgressive, flatRate, brackets } = req.body;
    
    if (!year || !region) {
      return res.status(400).json({ 
        success: false, 
        error: 'year e region obbligatori' 
      });
    }
    
    console.log('🔵 Regional Additionals POST: Inserimento addizionale per', { year, region, isProgressive, flatRate, brackets });
    
    if (isProgressive) {
      // Addizionale progressiva con scaglioni
      if (!brackets || brackets.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'brackets obbligatori per addizionale progressiva' 
        });
      }
      
      // Crea lo schema progressivo
      const scheme = await prisma.tax_regional_additional_scheme.upsert({
        where: {
          year_region_is_default: { 
            year: parseInt(year), 
            region, 
            is_default: true 
          }
        },
        update: { 
          is_progressive: true,
          flat_rate: null,
          createdat: new Date()
        },
        create: {
          year: parseInt(year),
          region,
          is_progressive: true,
          flat_rate: null
        }
      });
      
      // Elimina i bracket esistenti
      await prisma.tax_regional_additional_bracket.deleteMany({
        where: { scheme_id: scheme.id }
      });
      
      // Crea i nuovi bracket
      for (const bracket of brackets) {
        await prisma.tax_regional_additional_bracket.create({
          data: {
            scheme_id: scheme.id,
            min: parseFloat(bracket.min),
            max: bracket.max ? parseFloat(bracket.max) : null,
            rate: parseFloat(bracket.rate)
          }
        });
      }
      
      console.log('🟢 Regional Additionals POST: Inserito schema progressivo:', scheme.id);
      res.json({ 
        success: true, 
        message: `Addizionale regionale progressiva inserita per ${region} ${year}`,
        data: { id: scheme.id, type: 'progressive' }
      });
      
    } else {
      // Addizionale fissa
      if (flatRate === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'flatRate obbligatorio per addizionale fissa' 
        });
      }
      
      const newAdditional = await prisma.tax_regional_additional.upsert({
        where: {
          year_region: { year: parseInt(year), region }
        },
        update: { 
          rate: parseFloat(flatRate),
          createdat: new Date()
        },
        create: {
          year: parseInt(year),
          region,
          rate: parseFloat(flatRate)
        }
      });
      
      console.log('🟢 Regional Additionals POST: Inserita addizionale fissa:', newAdditional.id);
      res.json({ 
        success: true, 
        message: `Addizionale regionale fissa inserita per ${region} ${year}`,
        data: { id: newAdditional.id, type: 'flat' }
      });
    }
  } catch (error) {
    console.error('❌ Errore inserimento addizionale regionale:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/taxrates/regional-additionals/:id - Elimina addizionale regionale
router.delete('/regional-additionals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prova prima a eliminare come addizionale fissa
    try {
      const deleted = await prisma.tax_regional_additional.delete({
        where: { id }
      });
      
      console.log('🟢 Regional Additionals DELETE: Eliminata addizionale fissa:', id);
      res.json({ 
        success: true, 
        message: 'Addizionale regionale eliminata con successo'
      });
      return;
    } catch (error) {
      // Se non è una addizionale fissa, prova come schema progressivo
      if (error.code === 'P2025') { // Record not found
        try {
          const deleted = await prisma.tax_regional_additional_scheme.delete({
            where: { id }
          });
          
          console.log('🟢 Regional Additionals DELETE: Eliminato schema progressivo:', id);
          res.json({ 
            success: true, 
            message: 'Addizionale regionale eliminata con successo'
          });
          return;
        } catch (error2) {
          if (error2.code === 'P2025') {
            return res.status(404).json({ 
              success: false, 
              error: 'Addizionale regionale non trovata' 
            });
          }
          throw error2;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Errore eliminazione addizionale regionale:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// ADDIZIONALI COMUNALI
// ========================================

// GET /api/taxrates/municipal-additionals - Recupera addizionali comunali
router.get('/municipal-additionals', async (req, res) => {
  try {
    const { year, region, municipality } = req.query;
    let whereClause = {};
    if (year) whereClause.year = parseInt(year);
    if (region) whereClause.region = region;
    if (municipality) whereClause.municipality = municipality;
    
    // Recupera addizionali fisse
    const flatAdditionals = await prisma.tax_municipal_additional.findMany({
      where: whereClause,
      orderBy: [
        { year: 'desc' },
        { region: 'asc' },
        { municipality: 'asc' }
      ]
    });
    
    // Recupera addizionali progressive
    const progressiveAdditionals = await prisma.tax_municipal_additional_rule.findMany({
      where: whereClause,
      include: {
        tax_municipal_additional_bracket: {
          orderBy: { min: 'asc' }
        }
      },
      orderBy: [
        { year: 'desc' },
        { region: 'asc' },
        { municipality: 'asc' }
      ]
    });
    
    // Combina i risultati
    const allAdditionals = [
      ...flatAdditionals.map(additional => ({
        ...additional,
        is_progressive: false,
        flat_rate: additional.rate,
        tax_municipal_additional_bracket: []
      })),
      ...progressiveAdditionals.map(rule => ({
        id: rule.id,
        year: rule.year,
        region: rule.region,
        municipality: rule.municipality,
        is_progressive: true,
        flat_rate: rule.flat_rate,
        tax_municipal_additional_bracket: rule.tax_municipal_additional_bracket
      }))
    ];
    
    console.log('🔵 Municipal Additionals GET: Trovate', allAdditionals.length, 'addizionali');
    res.json({ success: true, data: allAdditionals });
  } catch (error) {
    console.error('❌ Errore recupero addizionali comunali:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/taxrates/municipal-additionals - Inserisce nuova addizionale comunale
router.post('/municipal-additionals', async (req, res) => {
  try {
    const { year, region, municipality, isProgressive, flatRate, brackets } = req.body;
    
    if (!year || !region || !municipality) {
      return res.status(400).json({ 
        success: false, 
        error: 'year, region e municipality obbligatori' 
      });
    }
    
    console.log('🔵 Municipal Additionals POST: Inserimento addizionale per', { year, region, municipality, isProgressive, flatRate, brackets });
    
    if (isProgressive) {
      // Addizionale progressiva con scaglioni
      if (!brackets || brackets.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'brackets obbligatori per addizionale progressiva' 
        });
      }
      
      // Crea la regola progressiva
      const rule = await prisma.tax_municipal_additional_rule.upsert({
        where: {
          year_region_municipality_is_default: { 
            year: parseInt(year), 
            region, 
            municipality,
            is_default: true 
          }
        },
        update: { 
          is_progressive: true,
          flat_rate: null,
          createdat: new Date()
        },
        create: {
          year: parseInt(year),
          region,
          municipality,
          is_progressive: true,
          flat_rate: null
        }
      });
      
      // Elimina i bracket esistenti
      await prisma.tax_municipal_additional_bracket.deleteMany({
        where: { rule_id: rule.id }
      });
      
      // Crea i nuovi bracket
      for (const bracket of brackets) {
        await prisma.tax_municipal_additional_bracket.create({
          data: {
            rule_id: rule.id,
            min: parseFloat(bracket.min),
            max: bracket.max ? parseFloat(bracket.max) : null,
            rate: parseFloat(bracket.rate)
          }
        });
      }
      
      console.log('🟢 Municipal Additionals POST: Inserita regola progressiva:', rule.id);
      res.json({ 
        success: true, 
        message: `Addizionale comunale progressiva inserita per ${municipality}, ${region} ${year}`,
        data: { id: rule.id, type: 'progressive' }
      });
      
    } else {
      // Addizionale fissa
      if (flatRate === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'flatRate obbligatorio per addizionale fissa' 
        });
      }
      
      const newAdditional = await prisma.tax_municipal_additional.upsert({
        where: {
          year_region_municipality: { 
            year: parseInt(year), 
            region, 
            municipality 
          }
        },
        update: { 
          rate: parseFloat(flatRate),
          createdat: new Date()
        },
        create: {
          year: parseInt(year),
          region,
          municipality,
          rate: parseFloat(flatRate)
        }
      });
      
      console.log('🟢 Municipal Additionals POST: Inserita addizionale fissa:', newAdditional.id);
      res.json({ 
        success: true, 
        message: `Addizionale comunale fissa inserita per ${municipality}, ${region} ${year}`,
        data: { id: newAdditional.id, type: 'flat' }
      });
    }
  } catch (error) {
    console.error('❌ Errore inserimento addizionale comunale:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================
// UPLOAD CSV REGIONALI (IT)
// =========================
router.post('/regional-additionals/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Nessun file caricato' });
    const csv = fs.readFileSync(req.file.path, 'utf8');
    const rows = csv.split('\n').filter(l => l.trim());
    const sep = rows[0].includes(';') ? ';' : ',';
    const headers = rows[0].split(sep).map(h => h.trim().replace(/"/g, ''));
    // Attesi IT: anno;regione;tipo;aliquota;min;max
    let processed = 0;
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(sep).map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((h, idx) => row[h] = values[idx]);
      const anno = parseInt(row.anno || row.Anno);
      const regione = row.regione || row.Regione;
      const tipo = String(row.tipo || row.Tipo || '').toLowerCase(); // 'fissa' | 'progressiva'
      const aliquota = row.aliquota ? parseFloat(String(row.aliquota).replace('%','').replace(',','.')) : null;
      const minimo = row.min || row.Min || row.minimo;
      const massimo = row.max || row.Max || row.massimo;

      if (!anno || !regione || !tipo) continue;

      if (tipo === 'fissa') {
        await prisma.tax_regional_additional.upsert({
          where: { year_region: { year: anno, region: regione } },
          update: { rate: aliquota, createdat: new Date() },
          create: { year: anno, region: regione, rate: aliquota }
        });
        processed++;
      } else {
        // progressiva: raggruppiamo per (anno, regione) e inseriamo brackets
        const scheme = await prisma.tax_regional_additional_scheme.upsert({
          where: { year_region_is_default: { year: anno, region: regione, is_default: true } },
          update: { is_progressive: true, flat_rate: null, createdat: new Date() },
          create: { year: anno, region: regione, is_progressive: true, flat_rate: null }
        });
        // se riga contiene min/max/rate trattala come bracket
        if (minimo || massimo || aliquota !== null) {
          await prisma.tax_regional_additional_bracket.create({
            data: {
              scheme_id: scheme.id,
              min: minimo ? parseFloat(String(minimo).replace(',','.')) : 0,
              max: massimo ? parseFloat(String(massimo).replace(',','.')) : null,
              rate: aliquota ?? 0
            }
          });
        }
        processed++;
      }
    }
    fs.unlink(req.file.path, () => {});
    res.json({ success: true, message: `Caricate ${processed} righe addizionali regionali` });
  } catch (error) {
    console.error('🔴 Regional upload error:', error);
    res.status(500).json({ success: false, message: 'Errore upload regionali: ' + error.message });
  }
});

// =========================
// UPLOAD CSV COMUNALI (IT)
// =========================
router.post('/municipal-additionals/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Nessun file caricato' });
    const csv = fs.readFileSync(req.file.path, 'utf8');
    const rows = csv.split('\n').filter(l => l.trim());
    const sep = rows[0].includes(';') ? ';' : ',';
    const headers = rows[0].split(sep).map(h => h.trim().replace(/"/g, ''));
    // Attesi IT: anno;regione;comune;tipo;aliquota;min;max
    let processed = 0;
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(sep).map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((h, idx) => row[h] = values[idx]);
      const anno = parseInt(row.anno || row.Anno);
      const regione = row.regione || row.Regione;
      const comune = row.comune || row.Comune || row.municipio;
      const tipo = String(row.tipo || row.Tipo || '').toLowerCase();
      const aliquota = row.aliquota ? parseFloat(String(row.aliquota).replace('%','').replace(',','.')) : null;
      const minimo = row.min || row.Min || row.minimo;
      const massimo = row.max || row.Max || row.massimo;

      if (!anno || !regione || !comune || !tipo) continue;

      if (tipo === 'fissa') {
        await prisma.tax_municipal_additional.upsert({
          where: { year_region_municipality: { year: anno, region: regione, municipality: comune } },
          update: { rate: aliquota, createdat: new Date() },
          create: { year: anno, region: regione, municipality: comune, rate: aliquota }
        });
        processed++;
      } else {
        const rule = await prisma.tax_municipal_additional_rule.upsert({
          where: { year_region_municipality_is_default: { year: anno, region: regione, municipality: comune, is_default: true } },
          update: { is_progressive: true, flat_rate: null, createdat: new Date() },
          create: { year: anno, region: regione, municipality: comune, is_progressive: true, flat_rate: null }
        });
        if (minimo || massimo || aliquota !== null) {
          await prisma.tax_municipal_additional_bracket.create({
            data: {
              rule_id: rule.id,
              min: minimo ? parseFloat(String(minimo).replace(',','.')) : 0,
              max: massimo ? parseFloat(String(massimo).replace(',','.')) : null,
              rate: aliquota ?? 0
            }
          });
        }
        processed++;
      }
    }
    fs.unlink(req.file.path, () => {});
    res.json({ success: true, message: `Caricate ${processed} righe addizionali comunali` });
  } catch (error) {
    console.error('🔴 Municipal upload error:', error);
    res.status(500).json({ success: false, message: 'Errore upload comunali: ' + error.message });
  }
});

// DELETE /api/taxrates/municipal-additionals/:id - Elimina addizionale comunale
router.delete('/municipal-additionals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prova prima a eliminare come addizionale fissa
    try {
      const deleted = await prisma.tax_municipal_additional.delete({
        where: { id }
      });
      
      console.log('🟢 Municipal Additionals DELETE: Eliminata addizionale fissa:', id);
      res.json({ 
        success: true, 
        message: 'Addizionale comunale eliminata con successo'
      });
      return;
    } catch (error) {
      // Se non è una addizionale fissa, prova come regola progressiva
      if (error.code === 'P2025') { // Record not found
        try {
          const deleted = await prisma.tax_municipal_additional_rule.delete({
            where: { id }
          });
          
          console.log('🟢 Municipal Additionals DELETE: Eliminata regola progressiva:', id);
          res.json({ 
            success: true, 
            message: 'Addizionale comunale eliminata con successo'
          });
          return;
        } catch (error2) {
          if (error2.code === 'P2025') {
            return res.status(404).json({ 
              success: false, 
              error: 'Addizionale comunale non trovata' 
            });
          }
          throw error2;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Errore eliminazione addizionale comunale:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
