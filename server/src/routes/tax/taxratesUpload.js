const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { getPrismaClient } = require("../../config/database");
const prisma = getPrismaClient();
const router = express.Router();

// ⚠️ WARNING: Questo file contiene riferimenti a tabelle obsolete
// tax_municipal_additional e tax_regional_additional sono state rimosse
// Usa tax_municipal_additional_rule e tax_regional_additional_scheme invece

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
    console.log('🔵 TaxRates GET: Esempio aliquota:', taxRates[0] ? {
      id: taxRates[0].id,
      year: taxRates[0].year,
      type: taxRates[0].type,
      inpsWorker: taxRates[0].inpsWorker,
      inpsEmployer: taxRates[0].inpsEmployer,
      inailEmployer: taxRates[0].inailEmployer,
      ffcWorker: taxRates[0].ffcWorker,
      ffcEmployer: taxRates[0].ffcEmployer,
      solidarityWorker: taxRates[0].solidarityWorker,
      solidarityEmployer: taxRates[0].solidarityEmployer
    } : null);

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

    // Prima riga = headers (supporta ; e ,)
    const sep = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, ''));
    console.log('🔵 TaxRates Upload: Headers rilevati:', headers);

    // Processa le righe di dati
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(sep).map(v => v.trim().replace(/"/g, ''));
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
        // Normalizza chiavi italiane/inglesi
        const get = (kArr) => {
          for (const k of kArr) {
            if (row[k] !== undefined) return row[k];
          }
          return undefined;
        };
        const yearStr = get(['year','anno','Year','Anno']);
        const typeStr = get(['type','tipo','Type','Tipo']);
        if (!yearStr || !typeStr) {
          console.log('🔴 TaxRates Upload: Riga senza year/type:', row);
          continue;
        }
        const year = parseInt(String(yearStr));
        const type = String(typeStr).trim().toUpperCase();
        const num = (v) => v !== undefined && v !== null && String(v).trim() !== '' ? parseFloat(String(v).replace('%','').replace(',','.')) : null;
        // split
        const inpsWorker = num(get(['inps_lavoratore','inpsWorker','inps_worker']));
        const inpsEmployer = num(get(['inps_datore','inpsEmployer','inps_employer']));
        const ffcWorker = num(get(['ffc_lavoratore','ffcWorker','ffc_worker']));
        const ffcEmployer = num(get(['ffc_datore','ffcEmployer','ffc_employer']));
        const inailEmployer = num(get(['inail_datore','inailEmployer','inail_employer']));
        const solidarityWorker = num(get(['solidarieta_lavoratore','solidarityWorker','solidarity_worker']));
        const solidarityEmployer = num(get(['solidarieta_datore','solidarityEmployer','solidarity_employer']));

        // Valida che il tipo sia un valore ENUM valido
        const validTypes = ['PERMANENT', 'LOAN', 'TRIAL', 'YOUTH', 'PROFESSIONAL', 'AMATEUR', 'APPRENTICESHIP', 'TRAINING_AGREEMENT'];
        if (!validTypes.includes(type)) {
          console.log('🔴 TaxRates Upload: Tipo contratto non valido:', type, 'Validi:', validTypes);
          continue;
        }

        console.log('🔵 TaxRates Upload: Upserting:', { year, type, inpsWorker, inpsEmployer, ffcWorker, ffcEmployer, inailEmployer, solidarityWorker, solidarityEmployer, teamId });

        await prisma.taxRate.upsert({
          where: {
            year_type_teamId: { year, type, teamId },
          },
          update: { 
            inpsWorker, inpsEmployer,
            ffcWorker, ffcEmployer,
            inailEmployer,
            solidarityWorker, solidarityEmployer,
            updatedAt: new Date() 
          },
          create: { year, type, teamId,
            inpsWorker,
            inpsEmployer,
            ffcWorker,
            ffcEmployer,
            inailEmployer,
            solidarityWorker,
            solidarityEmployer },
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
    const { teamId, year, type,
      // campi split
      inpsWorker, inpsEmployer, ffcWorker, ffcEmployer, inailEmployer,
      solidarityWorker, solidarityEmployer } = req.body;
    if (!teamId || !year || !type) {
      return res.status(400).json({ success: false, message: 'Parametri mancanti' });
    }
    const yearInt = parseInt(year);
    const normalizedType = String(type).trim().toUpperCase();
    const parseNum = (v) => v !== undefined && v !== null && v !== '' ? parseFloat(String(v).replace(',', '.')) : null;
    const inpsWorkerF = parseNum(inpsWorker);
    const inpsEmployerF = parseNum(inpsEmployer);
    const ffcWorkerF = parseNum(ffcWorker);
    const ffcEmployerF = parseNum(ffcEmployer);
    const inailEmployerF = parseNum(inailEmployer);
    const solidarityWorkerF = parseNum(solidarityWorker);
    const solidarityEmployerF = parseNum(solidarityEmployer);

    const saved = await prisma.taxRate.upsert({
      where: { year_type_teamId: { year: yearInt, type: normalizedType, teamId } },
      update: { 
        inpsWorker: inpsWorkerF, inpsEmployer: inpsEmployerF,
        ffcWorker: ffcWorkerF, ffcEmployer: ffcEmployerF,
        inailEmployer: inailEmployerF,
        solidarityWorker: solidarityWorkerF, solidarityEmployer: solidarityEmployerF,
        updatedAt: new Date() 
      },
      create: { 
        year: yearInt, type: normalizedType, teamId,
        inpsWorker: inpsWorkerF, 
        inpsEmployer: inpsEmployerF,
        ffcWorker: ffcWorkerF, 
        ffcEmployer: ffcEmployerF,
        inailEmployer: inailEmployerF,
        solidarityWorker: solidarityWorkerF,
        solidarityEmployer: solidarityEmployerF
      }
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
    const {
      inpsWorker, inpsEmployer,
      ffcWorker, ffcEmployer,
      inailEmployer,
      solidarityWorker, solidarityEmployer
    } = req.body;

    const parseNum = (v) => v !== undefined ? parseFloat(String(v).replace(',', '.')) : undefined;
    const data = {};
    if (inpsWorker !== undefined) data.inpsWorker = parseNum(inpsWorker);
    if (inpsEmployer !== undefined) data.inpsEmployer = parseNum(inpsEmployer);
    if (ffcWorker !== undefined) data.ffcWorker = parseNum(ffcWorker);
    if (ffcEmployer !== undefined) data.ffcEmployer = parseNum(ffcEmployer);
    if (inailEmployer !== undefined) data.inailEmployer = parseNum(inailEmployer);
    if (solidarityWorker !== undefined) data.solidarityWorker = parseNum(solidarityWorker);
    if (solidarityEmployer !== undefined) data.solidarityEmployer = parseNum(solidarityEmployer);
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
    
    // ⚠️ DEPRECATO: tax_regional_additional è stata rimossa
    // Usa tax_regional_additional_scheme con flat_rate invece
    const flatAdditionals = []; // await prisma.tax_regional_additional.findMany({
    //   where: whereClause,
    //   orderBy: [
    //     { year: 'desc' },
    //     { region: 'asc' }
    //   ]
    // });
    
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
      
      // ⚠️ DEPRECATO: Usa tax_regional_additional_scheme invece
      const newAdditional = await prisma.tax_regional_additional_scheme.upsert({
        where: {
          year_region_is_default: { year: parseInt(year), region, is_default: true }
        },
        update: { 
          is_progressive: false,
          flat_rate: parseFloat(flatRate),
          createdat: new Date()
        },
        create: {
          year: parseInt(year),
          region,
          is_progressive: false,
          flat_rate: parseFloat(flatRate),
          is_default: true
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
    
    // ⚠️ DEPRECATO: tax_regional_additional è stata rimossa
    // Prova prima a eliminare come addizionale fissa
    try {
      // const deleted = await prisma.tax_regional_additional.delete({
      //   where: { id }
      // });
      throw new Error('tax_regional_additional non più supportata');
      
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
    
    // ⚠️ DEPRECATO: tax_municipal_additional è stata rimossa
    // Usa tax_municipal_additional_rule con flat_rate invece
    const flatAdditionals = []; // await prisma.tax_municipal_additional.findMany({
    //   where: whereClause,
    //   orderBy: [
    //     { year: 'desc' },
    //     { region: 'asc' },
    //     { municipality: 'asc' }
    //   ]
    // });
    
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
  console.log('🟡 Municipal Additionals POST: ENDPOINT CHIAMATO');
  console.log('🟡 Municipal Additionals POST: req.body =', req.body);
  
  try {
    const { year, region, municipality, isProgressive, flatRate, brackets } = req.body;
    
    if (!year || !region || !municipality) {
      console.log('❌ Municipal Additionals POST: Campi obbligatori mancanti', { year, region, municipality });
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
    console.error('❌ Municipal Additionals POST: Errore inserimento addizionale comunale:', error);
    console.error('❌ Municipal Additionals POST: Stack trace:', error.stack);
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

// ========================================
// TAX CONFIG MANAGEMENT
// ========================================

// GET /api/taxrates/tax-config - Recupera configurazioni fiscali
router.get('/tax-config', async (req, res) => {
  try {
    const { year } = req.query;
    let whereClause = {};
    if (year) {
      whereClause.year = parseInt(year);
    }
    
    const configs = await prisma.tax_config.findMany({
      where: whereClause,
      orderBy: { year: 'desc' }
    });
    
    console.log('🔵 Tax Config GET: Trovate', configs.length, 'configurazioni');
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('❌ Errore recupero tax config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/taxrates/tax-config - Crea/aggiorna configurazione fiscale
router.post('/tax-config', async (req, res) => {
  try {
    const { 
      year, 
      contributionrate, 
      solidarityrate, 
      detrazionifixed, 
      detrazionipercentonirpef, 
      ulterioredetrazionefixed, 
      ulterioredetrazionepercent, 
      bonusl207fixed 
    } = req.body;
    
    if (!year) {
      return res.status(400).json({ 
        success: false, 
        error: 'year obbligatorio' 
      });
    }
    
    console.log('🔵 Tax Config POST: Inserimento configurazione per anno', year);
    
    const config = await prisma.tax_config.upsert({
      where: { year: parseInt(year) },
      update: { 
        contributionrate: parseFloat(contributionrate || 0),
        solidarityrate: parseFloat(solidarityrate || 0),
        detrazionifixed: parseFloat(detrazionifixed || 0),
        detrazionipercentonirpef: parseFloat(detrazionipercentonirpef || 0),
        ulterioredetrazionefixed: parseFloat(ulterioredetrazionefixed || 0),
        ulterioredetrazionepercent: parseFloat(ulterioredetrazionepercent || 0),
        bonusl207fixed: parseFloat(bonusl207fixed || 0),
        createdat: new Date()
      },
      create: {
        year: parseInt(year),
        contributionrate: parseFloat(contributionrate || 0),
        solidarityrate: parseFloat(solidarityrate || 0),
        detrazionifixed: parseFloat(detrazionifixed || 0),
        detrazionipercentonirpef: parseFloat(detrazionipercentonirpef || 0),
        ulterioredetrazionefixed: parseFloat(ulterioredetrazionefixed || 0),
        ulterioredetrazionepercent: parseFloat(ulterioredetrazionepercent || 0),
        bonusl207fixed: parseFloat(bonusl207fixed || 0)
      }
    });
    
    console.log('🟢 Tax Config POST: Configurazione salvata:', config.id);
    res.json({ 
      success: true, 
      message: `Configurazione fiscale salvata per l'anno ${year}`,
      data: config
    });
  } catch (error) {
    console.error('❌ Errore inserimento tax config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/taxrates/tax-config/:id - Modifica configurazione fiscale
router.put('/tax-config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      contributionrate, 
      solidarityrate, 
      detrazionifixed, 
      detrazionipercentonirpef, 
      ulterioredetrazionefixed, 
      ulterioredetrazionepercent, 
      bonusl207fixed 
    } = req.body;
    
    console.log('🔵 Tax Config PUT: Modifica configurazione ID:', id);
    
    const config = await prisma.tax_config.update({
      where: { id },
      data: { 
        contributionrate: parseFloat(contributionrate || 0),
        solidarityrate: parseFloat(solidarityrate || 0),
        detrazionifixed: parseFloat(detrazionifixed || 0),
        detrazionipercentonirpef: parseFloat(detrazionipercentonirpef || 0),
        ulterioredetrazionefixed: parseFloat(ulterioredetrazionefixed || 0),
        ulterioredetrazionepercent: parseFloat(ulterioredetrazionepercent || 0),
        bonusl207fixed: parseFloat(bonusl207fixed || 0),
        createdat: new Date()
      }
    });
    
    console.log('🟢 Tax Config PUT: Configurazione aggiornata:', config.id);
    res.json({ 
      success: true, 
      message: 'Configurazione fiscale aggiornata con successo',
      data: config
    });
  } catch (error) {
    console.error('❌ Errore modifica tax config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/taxrates/tax-config/:id - Elimina configurazione fiscale
router.delete('/tax-config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔵 Tax Config DELETE: Eliminazione configurazione ID:', id);
    
    const deleted = await prisma.tax_config.delete({
      where: { id }
    });
    
    console.log('🟢 Tax Config DELETE: Configurazione eliminata:', id);
    res.json({ 
      success: true, 
      message: 'Configurazione fiscale eliminata con successo',
      data: deleted
    });
  } catch (error) {
    console.error('❌ Errore eliminazione tax config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/taxrates/tax-config/upload - Upload CSV configurazioni fiscali
router.post('/tax-config/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nessun file caricato' 
      });
    }

    console.log('🔵 Tax Config Upload: File ricevuto:', req.file.originalname);

    const results = [];
    let processedCount = 0;

    // Leggi e processa il CSV
    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'File CSV vuoto o formato non valido' 
      });
    }

    // Prima riga = headers (supporta ; e ,)
    const sep = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, ''));
    console.log('🔵 Tax Config Upload: Headers rilevati:', headers);

    // Processa le righe di dati
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(sep).map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        console.log('🔵 Tax Config Upload: Riga CSV:', row);
        results.push(row);
      }
    }

    // Processa i risultati
    try {
      console.log('🔵 Tax Config Upload: Processando', results.length, 'righe');

      for (const row of results) {
        // Normalizza chiavi italiane/inglesi
        const get = (kArr) => {
          for (const k of kArr) {
            if (row[k] !== undefined) return row[k];
          }
          return undefined;
        };
        
        const yearStr = get(['year', 'anno', 'Year', 'Anno']);
        if (!yearStr) {
          console.log('🔴 Tax Config Upload: Riga senza anno:', row);
          continue;
        }
        
        const year = parseInt(String(yearStr));
        const num = (v) => v !== undefined && v !== null && String(v).trim() !== '' ? parseFloat(String(v).replace('%', '').replace(',', '.')) : 0;
        
        const contributionrate = num(get(['contributionrate', 'contributi_percentuale', 'contributi_%']));
        const solidarityrate = num(get(['solidarityrate', 'solidarieta_percentuale', 'solidarieta_%']));
        const detrazionifixed = num(get(['detrazionifixed', 'detrazioni_fisse', 'detrazioni_fixed']));
        const detrazionipercentonirpef = num(get(['detrazionipercentonirpef', 'detrazioni_percentuale_irpef', 'detrazioni_%_irpef']));
        const ulterioredetrazionefixed = num(get(['ulterioredetrazionefixed', 'ulteriore_detrazione_fissa', 'ulteriore_detrazione_fixed']));
        const ulterioredetrazionepercent = num(get(['ulterioredetrazionepercent', 'ulteriore_detrazione_percentuale', 'ulteriore_detrazione_%']));
        const bonusl207fixed = num(get(['bonusl207fixed', 'bonus_l207_fisso', 'bonus_l207_fixed']));

        console.log('🔵 Tax Config Upload: Upserting:', { year, contributionrate, solidarityrate, detrazionifixed, detrazionipercentonirpef, ulterioredetrazionefixed, ulterioredetrazionepercent, bonusl207fixed });

        await prisma.tax_config.upsert({
          where: { year },
          update: { 
            contributionrate, solidarityrate, detrazionifixed, detrazionipercentonirpef,
            ulterioredetrazionefixed, ulterioredetrazionepercent, bonusl207fixed,
            createdat: new Date() 
          },
          create: { 
            year, contributionrate, solidarityrate, detrazionifixed, detrazionipercentonirpef,
            ulterioredetrazionefixed, ulterioredetrazionepercent, bonusl207fixed
          }
        });

        processedCount++;
      }

      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      console.log('🟢 Tax Config Upload: Completato, processate', processedCount, 'configurazioni');
      res.json({ 
        success: true, 
        message: `Configurazioni fiscali caricate con successo! Processate ${processedCount} configurazioni.` 
      });

    } catch (dbError) {
      console.error('🔴 Tax Config Upload: Errore database:', dbError);
      
      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      res.status(500).json({ 
        success: false, 
        message: "Errore nel salvataggio delle configurazioni: " + dbError.message 
      });
    }

  } catch (error) {
    console.error('🔴 Tax Config Upload: Errore generale:', error);
    
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

// ========================================
// EXTRA DEDUCTION RULES MANAGEMENT
// ========================================

// GET /api/taxrates/extra-deduction-rules - Recupera regole ulteriore detrazione
router.get('/extra-deduction-rules', async (req, res) => {
  try {
    const { year } = req.query;
    let whereClause = {};
    if (year) {
      whereClause.year = parseInt(year);
    }
    
    const rules = await prisma.tax_extra_deduction_rule.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { min: 'asc' }]
    });
    
    console.log('🔵 Extra Deduction Rules GET: Trovate', rules.length, 'regole');
    res.json({ success: true, data: rules });
  } catch (error) {
    console.error('❌ Errore recupero extra deduction rules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/taxrates/extra-deduction-rules - Crea regola ulteriore detrazione
router.post('/extra-deduction-rules', async (req, res) => {
  try {
    const { year, min, max, amount } = req.body;
    
    if (!year || min === undefined || amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'year, min e amount sono obbligatori' 
      });
    }
    
    console.log('🔵 Extra Deduction Rules POST: Inserimento regola per anno', year);
    
    const yearInt = parseInt(year);
    const minFloat = parseFloat(String(min).replace(',', '.'));
    const maxFloat = max !== undefined && max !== null && String(max).trim() !== '' 
      ? parseFloat(String(max).replace(',', '.')) 
      : null;
    const amountFloat = parseFloat(String(amount).replace(',', '.'));
    
    if (isNaN(yearInt) || isNaN(minFloat) || isNaN(amountFloat)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valori numerici non validi' 
      });
    }
    
    const rule = await prisma.tax_extra_deduction_rule.create({
      data: {
        year: yearInt,
        min: minFloat,
        max: maxFloat,
        amount: amountFloat
      }
    });
    
    console.log('🟢 Extra Deduction Rules POST: Regola salvata:', rule.id);
    res.json({ 
      success: true, 
      message: `Regola ulteriore detrazione salvata per l'anno ${year}`,
      data: rule
    });
  } catch (error) {
    console.error('❌ Errore inserimento extra deduction rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/taxrates/extra-deduction-rules/:id - Modifica regola ulteriore detrazione
router.put('/extra-deduction-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { year, min, max, amount } = req.body;
    
    console.log('🔵 Extra Deduction Rules PUT: Modifica regola ID:', id);
    
    const yearInt = year ? parseInt(year) : undefined;
    const minFloat = min !== undefined ? parseFloat(String(min).replace(',', '.')) : undefined;
    const maxFloat = max !== undefined && max !== null && String(max).trim() !== '' 
      ? parseFloat(String(max).replace(',', '.')) 
      : null;
    const amountFloat = amount !== undefined ? parseFloat(String(amount).replace(',', '.')) : undefined;
    
    const updateData = {};
    if (yearInt !== undefined) updateData.year = yearInt;
    if (minFloat !== undefined) updateData.min = minFloat;
    if (maxFloat !== undefined) updateData.max = maxFloat;
    if (amountFloat !== undefined) updateData.amount = amountFloat;
    
    const rule = await prisma.tax_extra_deduction_rule.update({
      where: { id },
      data: updateData
    });
    
    console.log('🟢 Extra Deduction Rules PUT: Regola aggiornata:', rule.id);
    res.json({ 
      success: true, 
      message: 'Regola ulteriore detrazione aggiornata con successo',
      data: rule
    });
  } catch (error) {
    console.error('❌ Errore modifica extra deduction rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/taxrates/extra-deduction-rules/:id - Elimina regola ulteriore detrazione
router.delete('/extra-deduction-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔵 Extra Deduction Rules DELETE: Eliminazione regola ID:', id);
    
    const deleted = await prisma.tax_extra_deduction_rule.delete({
      where: { id }
    });
    
    console.log('🟢 Extra Deduction Rules DELETE: Regola eliminata:', id);
    res.json({ 
      success: true, 
      message: 'Regola ulteriore detrazione eliminata con successo',
      data: deleted
    });
  } catch (error) {
    console.error('❌ Errore eliminazione extra deduction rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/taxrates/extra-deduction-rules/upload - Upload CSV regole ulteriore detrazione
router.post('/extra-deduction-rules/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nessun file caricato' 
      });
    }

    console.log('🔵 Extra Deduction Rules Upload: File ricevuto:', req.file.originalname);

    const results = [];
    let processedCount = 0;

    // Leggi e processa il CSV
    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'File CSV vuoto o formato non valido' 
      });
    }

    // Prima riga = headers (supporta ; e ,)
    const sep = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, ''));
    console.log('🔵 Extra Deduction Rules Upload: Headers rilevati:', headers);

    // Processa le righe di dati
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(sep).map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        console.log('🔵 Extra Deduction Rules Upload: Riga CSV:', row);
        results.push(row);
      }
    }

    // Processa i risultati
    try {
      console.log('🔵 Extra Deduction Rules Upload: Processando', results.length, 'righe');

      for (const row of results) {
        // Normalizza chiavi italiane/inglesi
        const get = (kArr) => {
          for (const k of kArr) {
            if (row[k] !== undefined) return row[k];
          }
          return undefined;
        };
        
        const yearStr = get(['year', 'anno', 'Year', 'Anno']);
        if (!yearStr) {
          console.log('🔴 Extra Deduction Rules Upload: Riga senza anno:', row);
          continue;
        }
        
        const year = parseInt(String(yearStr));
        const num = (v) => v !== undefined && v !== null && String(v).trim() !== '' ? parseFloat(String(v).replace(',', '.')) : null;
        
        const min = num(get(['min', 'minimo', 'Min', 'Minimo']));
        const max = num(get(['max', 'massimo', 'Max', 'Massimo']));
        const amount = num(get(['amount', 'importo', 'Amount', 'Importo']));

        if (isNaN(year) || min === null || isNaN(min) || amount === null || isNaN(amount)) {
          console.log('🔴 Extra Deduction Rules Upload: Riga con valori non validi:', row);
          continue;
        }

        console.log('🔵 Extra Deduction Rules Upload: Creando regola:', { year, min, max, amount });

        await prisma.tax_extra_deduction_rule.create({
          data: { year, min, max, amount }
        });

        processedCount++;
      }

      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      console.log('🟢 Extra Deduction Rules Upload: Completato, processate', processedCount, 'regole');
      res.json({ 
        success: true, 
        message: `Regole ulteriore detrazione caricate con successo! Processate ${processedCount} regole.` 
      });

    } catch (dbError) {
      console.error('🔴 Extra Deduction Rules Upload: Errore database:', dbError);
      
      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      res.status(500).json({ 
        success: false, 
        message: "Errore nel salvataggio delle regole: " + dbError.message 
      });
    }

  } catch (error) {
    console.error('🔴 Extra Deduction Rules Upload: Errore generale:', error);
    
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

// ========================================
// BONUS L207 RULES - CRUD e Upload
// ========================================

// GET /api/taxrates/bonus-l207-rules - Recupera regole bonus L207
router.get('/bonus-l207-rules', async (req, res) => {
  try {
    const { year } = req.query;
    
    console.log('🔵 Bonus L207 Rules GET: Recupero regole per anno', year);
    
    const where = year ? { year: parseInt(year) } : {};
    const rules = await prisma.tax_bonus_l207_rule.findMany({
      where,
      orderBy: [{ year: 'desc' }, { min: 'asc' }]
    });
    
    console.log('🟢 Bonus L207 Rules GET: Trovate', rules.length, 'regole');
    
    res.json({ 
      success: true, 
      data: rules 
    });
  } catch (error) {
    console.error('❌ Errore recupero regole bonus L207:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/taxrates/bonus-l207-rules - Crea regola bonus L207
router.post('/bonus-l207-rules', async (req, res) => {
  try {
    const { year, min, max, amount } = req.body;
    
    console.log('🔵 Bonus L207 Rules POST: Creazione regola:', { year, min, max, amount });
    
    if (!year || min === undefined || amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Anno, minimo e importo sono obbligatori' 
      });
    }
    
    const rule = await prisma.tax_bonus_l207_rule.create({
      data: {
        year: parseInt(year),
        min: parseFloat(min),
        max: max ? parseFloat(max) : null,
        amount: parseFloat(amount)
      }
    });
    
    console.log('🟢 Bonus L207 Rules POST: Regola creata con ID', rule.id);
    
    res.json({ 
      success: true, 
      data: rule,
      message: 'Regola bonus L207 creata con successo'
    });
  } catch (error) {
    console.error('❌ Errore creazione regola bonus L207:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/taxrates/bonus-l207-rules/:id - Modifica regola bonus L207
router.put('/bonus-l207-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { year, min, max, amount } = req.body;
    
    console.log('🔵 Bonus L207 Rules PUT: Modifica regola ID', id);
    
    const rule = await prisma.tax_bonus_l207_rule.update({
      where: { id },
      data: {
        year: year ? parseInt(year) : undefined,
        min: min !== undefined ? parseFloat(min) : undefined,
        max: max !== undefined ? (max ? parseFloat(max) : null) : undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined
      }
    });
    
    console.log('🟢 Bonus L207 Rules PUT: Regola aggiornata');
    
    res.json({ 
      success: true, 
      data: rule,
      message: 'Regola bonus L207 aggiornata con successo'
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento regola bonus L207:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/taxrates/bonus-l207-rules/:id - Elimina regola bonus L207
router.delete('/bonus-l207-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔵 Bonus L207 Rules DELETE: Eliminazione regola ID', id);
    
    await prisma.tax_bonus_l207_rule.delete({
      where: { id }
    });
    
    console.log('🟢 Bonus L207 Rules DELETE: Regola eliminata');
    
    res.json({ 
      success: true, 
      message: 'Regola bonus L207 eliminata con successo'
    });
  } catch (error) {
    console.error('❌ Errore eliminazione regola bonus L207:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/taxrates/bonus-l207-rules/upload - Upload CSV regole bonus L207
router.post('/bonus-l207-rules/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nessun file caricato' 
      });
    }

    console.log('🔵 Bonus L207 Rules Upload: File ricevuto:', req.file.originalname);

    const results = [];
    let processedCount = 0;

    // Leggi e processa il CSV
    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'File CSV vuoto o formato non valido' 
      });
    }

    // Prima riga = headers (supporta ; e ,)
    const sep = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, ''));
    console.log('🔵 Bonus L207 Rules Upload: Headers rilevati:', headers);

    // Mappa headers italiani
    const headerMap = {
      'anno': 'year',
      'year': 'year',
      'minimo': 'min',
      'min': 'min',
      'massimo': 'max',
      'max': 'max',
      'importo': 'amount',
      'amount': 'amount'
    };

    // Processa ogni riga
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(sep).map(v => v.trim().replace(/"/g, ''));
      const row = {};
      
      headers.forEach((header, index) => {
        const mappedKey = headerMap[header.toLowerCase()];
        if (mappedKey && values[index] !== undefined) {
          row[mappedKey] = values[index];
        }
      });

      if (row.year && row.min !== undefined && row.amount !== undefined) {
        results.push({
          year: parseInt(row.year),
          min: parseFloat(String(row.min).replace(',', '.')),
          max: row.max ? parseFloat(String(row.max).replace(',', '.')) : null,
          amount: parseFloat(String(row.amount).replace(',', '.'))
        });
      }
    }

    console.log('🔵 Bonus L207 Rules Upload: Righe processate:', results.length);

    if (results.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nessuna riga valida trovata nel CSV' 
      });
    }

    try {
      // Inserisci le regole nel database
      for (const rule of results) {
        await prisma.tax_bonus_l207_rule.upsert({
          where: {
            year_min: {
              year: rule.year,
              min: rule.min
            }
          },
          update: {
            max: rule.max,
            amount: rule.amount
          },
          create: rule
        });
        processedCount++;
      }

      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      console.log('🟢 Bonus L207 Rules Upload: Completato, processate', processedCount, 'regole');
      res.json({ 
        success: true, 
        message: `Regole bonus L207 caricate con successo! Processate ${processedCount} regole.` 
      });

    } catch (dbError) {
      console.error('🔴 Bonus L207 Rules Upload: Errore database:', dbError);
      
      // Cleanup file temporaneo
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('🔴 Errore cleanup file:', err);
      });

      res.status(500).json({ 
        success: false, 
        message: "Errore nel salvataggio delle regole: " + dbError.message 
      });
    }

  } catch (error) {
    console.error('🔴 Bonus L207 Rules Upload: Errore generale:', error);
    
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

module.exports = router;
