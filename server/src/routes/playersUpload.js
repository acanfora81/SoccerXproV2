const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { getPrismaClient } = require("../config/database");
const { createErrorResponse, API_ERRORS } = require("../constants/errors");

const router = express.Router();

// Configurazione multer per upload file
const upload = multer({ dest: "uploads/" });

// POST /api/players/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log('🔵 Players Upload: Inizio processo');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Nessun file caricato" 
      });
    }

    const teamId = req.body.teamId;
    const createdById = req.context?.userId;
    
    if (!teamId) {
      fs.unlink(req.file.path, (err) => { 
        if (err) console.log('🔴 Errore cleanup file:', err); 
      });
      return res.status(400).json({ 
        success: false, 
        message: "Team ID mancante" 
      });
    }

    if (!createdById) {
      fs.unlink(req.file.path, (err) => { 
        if (err) console.log('🔴 Errore cleanup file:', err); 
      });
      return res.status(401).json({ 
        success: false, 
        message: "Utente non autenticato" 
      });
    }

    console.log('🔵 Players Upload: Team ID:', teamId, 'User ID:', createdById);

    const prisma = getPrismaClient();
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    let players = [];

    // Leggi il file in base all'estensione
    if (ext === '.csv') {
      players = await parseCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      players = await parseExcel(filePath);
    } else {
      fs.unlink(filePath, (err) => { 
        if (err) console.log('🔴 Errore cleanup file:', err); 
      });
      return res.status(400).json({ 
        success: false, 
        message: "Formato file non supportato. Usa CSV o Excel." 
      });
    }

    if (players.length === 0) {
      fs.unlink(filePath, (err) => { 
        if (err) console.log('🔴 Errore cleanup file:', err); 
      });
      return res.status(400).json({ 
        success: false, 
        message: "Nessun giocatore valido trovato nel file" 
      });
    }

    console.log('🔵 Players Upload: Trovati', players.length, 'giocatori da importare');

    // Valida e importa i giocatori
    const results = await importPlayers(prisma, players, teamId, createdById);

    // Cleanup file
    fs.unlink(filePath, (err) => { 
      if (err) console.log('🔴 Errore cleanup file:', err); 
    });

    return res.json({
      success: true,
      message: `Importazione completata: ${results.success} giocatori importati, ${results.errors} errori`,
      data: {
        imported: results.success,
        errors: results.errors,
        details: results.details
      }
    });

  } catch (error) {
    console.log('🔴 Errore upload giocatori:', error?.message);
    
    // Cleanup file in caso di errore
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => { 
        if (err) console.log('🔴 Errore cleanup file:', err); 
      });
    }

    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR, error?.message);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
});

// Mappa delle intestazioni italiane ai campi del database
const ITALIAN_HEADER_MAPPING = {
  // Nome e cognome
  'nome': 'firstName',
  'cognome': 'lastName',
  'nome e cognome': 'firstName', // Per casi come "Mario Rossi"
  
  // Data e luogo
  'data di nascita': 'dateOfBirth',
  'data nascita': 'dateOfBirth',
  'nato il': 'dateOfBirth',
  'data di nascitá': 'dateOfBirth', // Con accento acuto
  'luogo di nascita': 'placeOfBirth',
  'luogo nascita': 'placeOfBirth',
  'nato a': 'placeOfBirth',
  'luogo di nascitá': 'placeOfBirth', // Con accento acuto
  
  // Nazionalità
  'nazionalità': 'nationality',
  'nazionalita': 'nationality',
  'nazionalitá': 'nationality', // Con accento acuto
  'nazionalit': 'nationality', // Carattere corrotto da Excel
  'cittadinanza': 'nationality',
  
  // Ruolo e posizione
  'ruolo': 'position',
  'posizione': 'position',
  'ruolo giocatore': 'position',
  
  // Numero maglia
  'numero maglia': 'shirtNumber',
  'numero': 'shirtNumber',
  'maglia': 'shirtNumber',
  'n°': 'shirtNumber',
  'n.': 'shirtNumber',
  
  // Caratteristiche fisiche
  'altezza': 'height',
  'peso': 'weight',
  'piede preferito': 'preferredFoot',
  'piede preferitó': 'preferredFoot', // Con accento acuto
  'piede': 'preferredFoot',
  'piede dominante': 'preferredFoot',
  
  // Documenti
  'codice fiscale': 'taxCode',
  'cf': 'taxCode',
  'numero passaporto': 'passportNumber',
  'passaporto': 'passportNumber',
  'n° passaporto': 'passportNumber'
};

// Funzione per normalizzare i caratteri accentati - DISABILITATA
// Questa funzione causava corruzione dei caratteri, ora disabilitata
function normalizeText(text) {
  // Ritorna il testo originale senza modifiche
  return text;
}

// Funzione per normalizzare le intestazioni
function normalizeHeader(header) {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Rimuove caratteri speciali
    .replace(/\s+/g, ' '); // Normalizza spazi
}

// Funzione per mappare le intestazioni italiane
function mapItalianHeaders(headers) {
  const mappedHeaders = [];
  const mappingLog = [];
  
  headers.forEach(header => {
    const normalized = normalizeHeader(header);
    const mappedField = ITALIAN_HEADER_MAPPING[normalized];
    
    if (mappedField) {
      mappedHeaders.push(mappedField);
      mappingLog.push(`${header} → ${mappedField}`);
    } else {
      // Se non trova mapping, usa l'header originale
      mappedHeaders.push(header);
      mappingLog.push(`${header} → ${header} (nessun mapping)`);
    }
  });
  
  console.log('🔵 Players Upload: Mapping intestazioni:');
  mappingLog.forEach(log => console.log('  ', log));
  
  return mappedHeaders;
}

// Funzione per rilevare la codifica corretta
function detectEncoding(filePath) {
  const encodings = ['utf8', 'latin1', 'utf16le', 'cp1252'];
  
  for (const encoding of encodings) {
    try {
      const content = fs.readFileSync(filePath, { encoding });
      // Controlla se contiene caratteri accentati corretti
      if (content.includes('ò') || content.includes('à') || content.includes('è') || content.includes('ù')) {
        console.log(`🟢 Codifica rilevata: ${encoding} (contiene caratteri accentati)`);
        return { encoding, content };
      }
      // Se non trova caratteri accentati, prova la prossima codifica
    } catch (error) {
      continue;
    }
  }
  
  // Fallback a UTF-8
  console.log('🟡 Usando codifica di fallback: UTF-8');
  return { encoding: 'utf8', content: fs.readFileSync(filePath, { encoding: 'utf8' }) };
}

// Funzione per parsare CSV
async function parseCSV(filePath) {
  // Rileva automaticamente la codifica corretta
  const { encoding, content } = detectEncoding(filePath);
  console.log(`🔵 File letto con codifica: ${encoding}`);
  
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error("File CSV vuoto o formato non valido");
  }

  // Log delle prime righe per debug
  console.log('🔵 Prime 3 righe del file:');
  lines.slice(0, 3).forEach((line, index) => {
    console.log(`  ${index + 1}: "${line}"`);
  });

  // Determina il separatore
  const separator = lines[0].includes(';') ? ';' : ',';
  console.log('🔵 Players Upload: Separatore rilevato:', separator);

  // Parse headers originali
  const originalHeaders = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
  console.log('🔵 Players Upload: Headers originali:', originalHeaders);
  console.log('🔵 Players Upload: Separatore usato:', separator);

  // Mappa le intestazioni italiane
  const mappedHeaders = mapItalianHeaders(originalHeaders);
  console.log('🔵 Players Upload: Headers mappati:', mappedHeaders);

  // Parse data
  const players = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
    if (values.length === originalHeaders.length) {
      const player = {};
      originalHeaders.forEach((originalHeader, index) => {
        const mappedField = mappedHeaders[index];
        // Usa il valore originale senza normalizzazione
        player[mappedField] = values[index];
      });
      players.push(player);
    }
  }

  return players;
}

// Funzione per parsare Excel
async function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  
  if (data.length === 0) {
    throw new Error("File Excel vuoto o formato non valido");
  }

  // Ottieni le intestazioni originali
  const originalHeaders = Object.keys(data[0]);
  console.log('🔵 Players Upload: Headers Excel originali:', originalHeaders);

  // Mappa le intestazioni italiane
  const mappedHeaders = mapItalianHeaders(originalHeaders);
  console.log('🔵 Players Upload: Headers Excel mappati:', mappedHeaders);

  // Rimappa i dati con le intestazioni corrette
  const mappedData = data.map(row => {
    const mappedRow = {};
    originalHeaders.forEach((originalHeader, index) => {
      const mappedField = mappedHeaders[index];
      // Usa il valore originale senza normalizzazione
      mappedRow[mappedField] = row[originalHeader];
    });
    return mappedRow;
  });

  return mappedData;
}

// Funzione per importare i giocatori
async function importPlayers(prisma, players, teamId, createdById) {
  let success = 0;
  let errors = 0;
  const details = [];

  for (const playerData of players) {
    try {
      // Valida i dati obbligatori
      if (!playerData.firstName || !playerData.lastName || !playerData.nationality) {
        throw new Error("Campi obbligatori mancanti: firstName, lastName, nationality");
      }

      // Converte e valida la data di nascita (formato italiano GG/MM/AAAA)
      let birthDate = null;
      if (playerData.dateOfBirth) {
        // Gestisce formato italiano GG/MM/AAAA
        if (playerData.dateOfBirth.includes('/')) {
          const parts = playerData.dateOfBirth.split('/');
          if (parts.length === 3) {
            // Converte da GG/MM/AAAA a AAAA-MM-GG
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            birthDate = new Date(`${year}-${month}-${day}`);
          }
        } else {
          birthDate = new Date(playerData.dateOfBirth);
        }
        
        // Verifica che la data sia valida
        if (isNaN(birthDate.getTime())) {
          throw new Error(`Data di nascita non valida: ${playerData.dateOfBirth}`);
        }
        
        // Verifica età
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 16 || age > 50) {
          throw new Error("Età deve essere tra 16 e 50 anni");
        }
      }

      // Mappa i ruoli italiani
      const positionMapping = {
        'portiere': 'GOALKEEPER',
        'difensore': 'DEFENDER',
        'centrocampista': 'MIDFIELDER',
        'attaccante': 'FORWARD'
      };

      // Normalizza e mappa il ruolo
      let normalizedPosition = playerData.position;
      if (playerData.position) {
        const lowerPosition = playerData.position.toLowerCase().trim();
        normalizedPosition = positionMapping[lowerPosition] || playerData.position;
      }

      // Valida il ruolo
      const validPositions = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
      if (normalizedPosition && !validPositions.includes(normalizedPosition)) {
        throw new Error(`Ruolo non valido: ${playerData.position}. Usa: Portiere, Difensore, Centrocampista, Attaccante o GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD`);
      }

      // Mappa il piede preferito italiano
      const footMapping = {
        'destro': 'RIGHT',
        'sinistro': 'LEFT',
        'ambidestro': 'BOTH'
      };

      // Normalizza e mappa il piede preferito
      let normalizedFoot = playerData.preferredFoot;
      if (playerData.preferredFoot) {
        const lowerFoot = playerData.preferredFoot.toLowerCase().trim();
        normalizedFoot = footMapping[lowerFoot] || playerData.preferredFoot;
      }

      // Valida il piede preferito
      const validFeet = ['LEFT', 'RIGHT', 'BOTH'];
      if (normalizedFoot && !validFeet.includes(normalizedFoot)) {
        throw new Error(`Piede preferito non valido: ${playerData.preferredFoot}. Usa: Destro, Sinistro, Ambidestro o LEFT, RIGHT, BOTH`);
      }

      // Prepara i dati per il database
      const playerToCreate = {
        firstName: playerData.firstName.trim(),
        lastName: playerData.lastName.trim(),
        dateOfBirth: birthDate || new Date('1990-01-01'),
        nationality: playerData.nationality.trim(),
        position: normalizedPosition || 'MIDFIELDER',
        shirtNumber: playerData.shirtNumber ? parseInt(playerData.shirtNumber) : null,
        height: playerData.height ? parseFloat(playerData.height) : null,
        weight: playerData.weight ? parseFloat(playerData.weight) : null,
        preferredFoot: normalizedFoot || null,
        placeOfBirth: playerData.placeOfBirth?.trim() || null,
        taxCode: playerData.taxCode?.trim() || null,
        passportNumber: playerData.passportNumber?.trim() || null,
        teamId: teamId,
        createdById: createdById
      };

      // Crea il giocatore
      const createdPlayer = await prisma.Player.create({
        data: playerToCreate
      });

      console.log('🟢 Giocatore creato:', createdPlayer.firstName, createdPlayer.lastName);
      success++;
      details.push({
        player: `${playerData.firstName} ${playerData.lastName}`,
        status: 'success',
        message: 'Importato con successo'
      });

    } catch (error) {
      console.log('🔴 Errore importazione giocatore:', playerData.firstName, playerData.lastName, error.message);
      errors++;
      details.push({
        player: `${playerData.firstName || 'N/A'} ${playerData.lastName || 'N/A'}`,
        status: 'error',
        message: error.message
      });
    }
  }

  return { success, errors, details };
}

// POST /api/players/fix-encoding
// Endpoint per correggere i caratteri accentati corrotti nel database
router.post("/fix-encoding", async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const createdById = req.context?.userId;
    
    if (!teamId || !createdById) {
      return res.status(401).json({ 
        success: false, 
        message: "Utente non autenticato" 
      });
    }

    console.log('🔵 Players Fix Encoding: Inizio correzione caratteri per team:', teamId);

    const prisma = getPrismaClient();
    
    // Ottieni tutti i giocatori del team
    const players = await prisma.Player.findMany({
      where: { teamId }
    });

    console.log(`🔵 Trovati ${players.length} giocatori per il team ${teamId}`);
    
    // Log dei giocatori con caratteri corrotti - controllo più ampio
    const corruptedPlayers = players.filter(p => 
      (p.firstName && (
        p.firstName.includes('?') || 
        p.firstName.includes('ñ') ||
        p.firstName.includes('Nicol') ||
        p.firstName.includes('Franc') ||
        p.firstName.includes('Jos') ||
        p.firstName.includes('Andr')
      )) ||
      (p.lastName && (
        p.lastName.includes('?') || 
        p.lastName.includes('ñ')
      ))
    );
    console.log(`🔵 Giocatori con caratteri corrotti: ${corruptedPlayers.length}`);
    corruptedPlayers.forEach(p => {
      console.log(`  - "${p.firstName}" "${p.lastName}"`);
    });
    
    // Log di tutti i giocatori per debug
    console.log('🔵 Tutti i giocatori:');
    players.forEach(p => {
      console.log(`  - "${p.firstName}" "${p.lastName}"`);
    });

    let fixedCount = 0;
    const fixedPlayers = [];

    for (const player of players) {
      let needsUpdate = false;
      const updates = {};

      // Correzione specifica per i pattern corrotti più comuni
      let correctedFirstName = player.firstName;
      let correctedLastName = player.lastName;
      let correctedPlaceOfBirth = player.placeOfBirth;
      let correctedNationality = player.nationality;

      // Correzione per firstName
      if (player.firstName) {
        const originalFirstName = player.firstName;
        correctedFirstName = player.firstName
          .replace(/ñ/g, '') // Rimuove caratteri ñ corrotti
          .replace(/Nicol\?/g, 'Nicolò') // Corregge Nicol? → Nicolò
          .replace(/Franc\?/g, 'François') // Corregge Franc? → François
          .replace(/Jos\?/g, 'José') // Corregge Jos? → José
          .replace(/Andr\?/g, 'André') // Corregge Andr? → André
          .replace(/\?/g, 'ò'); // Sostituisce ? con ò (caso generale)
        
        if (correctedFirstName !== originalFirstName) {
          console.log(`🔧 Correzione firstName: "${originalFirstName}" → "${correctedFirstName}"`);
          updates.firstName = correctedFirstName;
          needsUpdate = true;
        }
      }

      // Correzione per lastName
      if (player.lastName) {
        const originalLastName = player.lastName;
        correctedLastName = player.lastName
          .replace(/ñ/g, '') // Rimuove caratteri ñ corrotti
          .replace(/\?/g, 'ò'); // Sostituisce ? con ò (caso generale)
        
        if (correctedLastName !== originalLastName) {
          console.log(`🔧 Correzione lastName: "${originalLastName}" → "${correctedLastName}"`);
          updates.lastName = correctedLastName;
          needsUpdate = true;
        }
      }

      // Correzione per placeOfBirth
      if (player.placeOfBirth) {
        correctedPlaceOfBirth = player.placeOfBirth
          .replace(/ñ/g, '') // Rimuove caratteri ñ corrotti
          .replace(/\?/g, 'ò'); // Sostituisce ? con ò (caso generale)
        
        if (correctedPlaceOfBirth !== player.placeOfBirth) {
          updates.placeOfBirth = correctedPlaceOfBirth;
          needsUpdate = true;
        }
      }

      // Correzione per nationality
      if (player.nationality) {
        correctedNationality = player.nationality
          .replace(/ñ/g, '') // Rimuove caratteri ñ corrotti
          .replace(/\?/g, 'ò'); // Sostituisce ? con ò (caso generale)
        
        if (correctedNationality !== player.nationality) {
          updates.nationality = correctedNationality;
          needsUpdate = true;
        }
      }

      // Aggiorna se necessario
      if (needsUpdate) {
        console.log(`🔄 Aggiornando giocatore ID ${player.id} con:`, updates);
        
        try {
          await prisma.Player.update({
            where: { id: player.id },
            data: updates
          });
          
          fixedCount++;
          fixedPlayers.push({
            id: player.id,
            oldName: `${player.firstName} ${player.lastName}`,
            newName: `${correctedFirstName} ${correctedLastName}`
          });
          
          console.log(`🟢 Corretto: ${player.firstName} ${player.lastName} → ${correctedFirstName} ${correctedLastName}`);
        } catch (error) {
          console.log(`🔴 Errore aggiornamento giocatore ${player.id}:`, error.message);
        }
      }
    }

    return res.json({
      success: true,
      message: `Correzione completata: ${fixedCount} giocatori corretti`,
      data: {
        fixedCount,
        fixedPlayers
      }
    });

  } catch (error) {
    console.log('🔴 Errore correzione encoding:', error?.message);
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR, error?.message);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
});

module.exports = router;
