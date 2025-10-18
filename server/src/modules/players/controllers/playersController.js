// Percorso: server/src/modules/players/controllers/playersController.js
// Controller per gestione giocatori SoccerXpro V2

const { getPrismaClient } = require('../../../config/database');
const { API_ERRORS, createErrorResponse } = require('../../../constants/errors');

console.log('🟢 [INFO] Caricamento controller giocatori...');

// 📋 Ottieni lista giocatori
const getPlayers = async (req, res) => {
  try {
    console.log('🔵 [DEBUG] Richiesta lista giocatori');

    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const prisma = getPrismaClient();

    const players = await prisma.player.findMany({
      where: { teamId },
      orderBy: [
        { isActive: 'desc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      include: {
        createdBy: { select: { first_name: true, last_name: true } },
        contracts: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            salary: true,
            netSalary: true,
            socialContributions: true,
            contractType: true,
            status: true,
            currency: true
          },
          orderBy: { startDate: 'desc' }
        },
        injuries: {
          where: { status: { in: ['ACTIVE', 'RECOVERING'] } },
          select: {
            id: true,
            injuryType: true,
            bodyPart: true,
            severity: true,
            expectedReturn: true
          }
        }
      }
    });

    console.log('🟢 [INFO] Lista giocatori recuperata:', players.length, 'giocatori');
    return res.json({ message: 'Lista giocatori recuperata con successo', data: players, count: players.length });
  } catch (error) {
    console.log('🔴 Errore recupero lista giocatori:', error.message);
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

// 👤 Ottieni giocatore per ID
const getPlayerById = async (req, res) => {
  try {
    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const playerId = parseInt(req.params.id, 10);
    if (Number.isNaN(playerId)) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'ID giocatore non valido'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    console.log('🔵 [DEBUG] Richiesta dettagli giocatore ID:', playerId);

    const prisma = getPrismaClient();
    const player = await prisma.player.findFirst({
      where: { id: playerId, teamId },
      include: {
        createdBy: { select: { first_name: true, last_name: true } },
        contracts: { 
          orderBy: { startDate: 'desc' },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            salary: true,
            netSalary: true,
            socialContributions: true,
            contractType: true,
            status: true,
            currency: true,
            signedDate: true
          }
        },
        injuries: { orderBy: { injuryDate: 'desc' } },
        medicalVisits: { orderBy: { visitDate: 'desc' }, take: 10 },
        transfers: { orderBy: { createdAt: 'desc' } },
        statistics: { orderBy: { season: 'desc' } }
      }
    });

    if (!player) {
      console.log('🟡 [WARN] Giocatore non trovato o non appartiene al team:', playerId);
      const errorResponse = createErrorResponse(
        API_ERRORS.RESOURCE_NOT_FOUND,
        'Giocatore non trovato'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    console.log('🟢 [INFO] Dettagli giocatore recuperati:', player.firstName, player.lastName);
    return res.json({ message: 'Dettagli giocatore recuperati con successo', data: player });
  } catch (error) {
    console.log('🔴 Errore recupero giocatore:', error.message);
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

// ➕ Crea nuovo giocatore
const createPlayer = async (req, res) => {
  try {
    const teamId = req?.context?.teamId;
    const createdById = req?.context?.userId || req.user?.profile?.id;
    if (!teamId || !createdById) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const { firstName, lastName, dateOfBirth, nationality, position, shirtNumber, height, weight, preferredFoot, placeOfBirth, taxCode, passportNumber } = req.body || {};

    console.log('🔵 [DEBUG] Creazione nuovo giocatore:', firstName, lastName);

    if (!firstName || !lastName || !dateOfBirth || !nationality || !position) {
      const errorResponse = createErrorResponse(
        API_ERRORS.REQUIRED_FIELD_MISSING,
        'Nome, cognome, data di nascita, nazionalità e ruolo sono richiesti'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const validPositions = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
    if (!validPositions.includes(position)) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'Ruolo non valido',
        `Ruoli validi: ${validPositions.join(', ')}`
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    if (preferredFoot && !['LEFT', 'RIGHT', 'BOTH'].includes(preferredFoot)) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'Piede preferito non valido',
        'Valori validi: LEFT, RIGHT, BOTH'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'Data di nascita non valida'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const prisma = getPrismaClient();

    if (shirtNumber !== undefined && shirtNumber !== null && `${shirtNumber}`.trim() !== '') {
      const parsedShirt = parseInt(shirtNumber, 10);
      if (!Number.isNaN(parsedShirt)) {
        const existingPlayer = await prisma.player.findFirst({
          where: { shirtNumber: parsedShirt, isActive: true, teamId }
        });
        if (existingPlayer) {
          const errorResponse = createErrorResponse(
            API_ERRORS.VALIDATION_FAILED,
            `Numero maglia ${parsedShirt} già assegnato a ${existingPlayer.firstName} ${existingPlayer.lastName}`
          );
          return res.status(errorResponse.status).json(errorResponse.body);
        }
      }
    }

    if (taxCode) {
      const existingByTax = await prisma.player.findFirst({ where: { taxCode: taxCode.toUpperCase().trim() } });
      if (existingByTax) {
        const errorResponse = createErrorResponse(
          API_ERRORS.VALIDATION_FAILED,
          'Codice fiscale già presente nel sistema'
        );
        return res.status(errorResponse.status).json(errorResponse.body);
      }
    }

    const player = await prisma.player.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob,
        nationality: nationality.trim(),
        position,
        shirtNumber: (shirtNumber === undefined || shirtNumber === null || `${shirtNumber}`.trim() === '') ? null : parseInt(shirtNumber, 10),
        height: (height === undefined || height === null || `${height}`.trim?.() === '') ? null : parseFloat(height),
        weight: (weight === undefined || weight === null || `${weight}`.trim?.() === '') ? null : parseFloat(weight),
        preferredFoot: preferredFoot || null,
        placeOfBirth: placeOfBirth ? placeOfBirth.trim() : null,
        taxCode: taxCode ? taxCode.toUpperCase().trim() : null,
        passportNumber: passportNumber ? passportNumber.trim() : null,
        isActive: true,
        createdById,
        teamId
      },
      include: { createdBy: { select: { first_name: true, last_name: true } } }
    });

    console.log('🟢 [INFO] Giocatore creato con ID:', player.id);
    return res.status(201).json({ message: 'Giocatore creato con successo', data: player });
  } catch (error) {
    console.log('🔴 Errore creazione giocatore:', error.message);
    if (error.code === 'P2002') {
      const errorResponse = createErrorResponse(
        API_ERRORS.VALIDATION_FAILED,
        'Vincolo di unicità violato - verifica numero maglia, codice fiscale o passaporto'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

// ✏️ Aggiorna giocatore
const updatePlayer = async (req, res) => {
  try {
    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(API_ERRORS.FORBIDDEN, 'Contesto team non disponibile');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      const errorResponse = createErrorResponse(API_ERRORS.INVALID_VALUE, 'ID giocatore non valido');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const prisma = getPrismaClient();

    const { firstName, lastName, dateOfBirth, nationality, position, shirtNumber, height, weight, preferredFoot, placeOfBirth, taxCode, passportNumber, isActive } = req.body || {};

    if (position && !['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'].includes(position)) {
      const errorResponse = createErrorResponse(API_ERRORS.INVALID_VALUE, 'Ruolo non valido');
      return res.status(errorResponse.status).json(errorResponse.body);
    }
    if (preferredFoot && !['LEFT', 'RIGHT', 'BOTH'].includes(preferredFoot)) {
      const errorResponse = createErrorResponse(API_ERRORS.INVALID_VALUE, 'Piede preferito non valido');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    if (shirtNumber !== undefined && shirtNumber !== null && `${shirtNumber}`.trim() !== '') {
      const parsedShirt = parseInt(shirtNumber, 10);
      if (!Number.isNaN(parsedShirt)) {
        const clash = await prisma.player.findFirst({
          where: { id: { not: id }, teamId, isActive: true, shirtNumber: parsedShirt },
          select: { id: true, firstName: true, lastName: true }
        });
        if (clash) {
          const errorResponse = createErrorResponse(
            API_ERRORS.VALIDATION_FAILED,
            `Numero maglia ${parsedShirt} già assegnato a ${clash.firstName} ${clash.lastName}`
          );
          return res.status(errorResponse.status).json(errorResponse.body);
        }
      }
    }

    const data = {};
    if (firstName !== undefined) data.firstName = firstName?.trim();
    if (lastName !== undefined) data.lastName = lastName?.trim();
    if (dateOfBirth !== undefined) {
      const dob = new Date(dateOfBirth);
      if (Number.isNaN(dob.getTime())) {
        const errorResponse = createErrorResponse(API_ERRORS.INVALID_VALUE, 'Data di nascita non valida');
        return res.status(errorResponse.status).json(errorResponse.body);
      }
      data.dateOfBirth = dob;
    }
    if (nationality !== undefined) data.nationality = nationality?.trim();
    if (position !== undefined) data.position = position;
    if (shirtNumber !== undefined) data.shirtNumber = (shirtNumber === '' || shirtNumber === null || typeof shirtNumber === 'undefined') ? null : parseInt(shirtNumber, 10);
    if (height !== undefined) data.height = (height === '' || height === null || typeof height === 'undefined') ? null : parseFloat(height);
    if (weight !== undefined) data.weight = (weight === '' || weight === null || typeof weight === 'undefined') ? null : parseFloat(weight);
    if (preferredFoot !== undefined) data.preferredFoot = preferredFoot || null;
    if (placeOfBirth !== undefined) data.placeOfBirth = placeOfBirth ? placeOfBirth.trim() : null;
    if (taxCode !== undefined) data.taxCode = taxCode ? taxCode.toUpperCase().trim() : null;
    if (passportNumber !== undefined) data.passportNumber = passportNumber ? passportNumber.trim() : null;
    if (isActive !== undefined) data.isActive = !!isActive;

    const result = await prisma.player.updateMany({ where: { id, teamId }, data });
    if (result.count === 0) {
      const errorResponse = createErrorResponse(API_ERRORS.RESOURCE_NOT_FOUND, 'Giocatore non trovato');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const updated = await prisma.player.findFirst({
      where: { id, teamId },
      include: { createdBy: { select: { first_name: true, last_name: true } } }
    });

    return res.json({ message: 'Giocatore aggiornato con successo', data: updated });
  } catch (error) {
    console.log('🔴 Errore aggiornamento giocatore:', error?.message);
    if (error.code === 'P2002') {
      const errorResponse = createErrorResponse(
        API_ERRORS.VALIDATION_FAILED,
        'Vincolo di unicità violato - verifica numero maglia, codice fiscale o passaporto'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

// 🗑️ Elimina giocatore
const deletePlayer = async (req, res) => {
  try {
    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(API_ERRORS.FORBIDDEN, 'Contesto team non disponibile');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      const errorResponse = createErrorResponse(API_ERRORS.INVALID_VALUE, 'ID giocatore non valido');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const prisma = getPrismaClient();

    const player = await prisma.Player.findFirst({ where: { id, teamId } });
    if (!player) {
      const errorResponse = createErrorResponse(API_ERRORS.RESOURCE_NOT_FOUND, 'Giocatore non trovato');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    await prisma.$transaction(async (tx) => {
      await tx.PerformanceData.deleteMany({ where: { playerId: id } });
      await tx.medical_visits.deleteMany({ where: { playerId: id } });
      await tx.player_statistics.deleteMany({ where: { playerId: id } });
      await tx.transfers.deleteMany({ where: { playerId: id } });
      await tx.injuries.deleteMany({ where: { playerId: id } });

      const contracts = await tx.contracts.findMany({ where: { playerId: id }, select: { id: true } });
      for (const contract of contracts) {
        await tx.contract_amendments.deleteMany({ where: { contractId: contract.id } });
        await tx.contract_files.deleteMany({ where: { contractId: contract.id } });
        await tx.contract_clauses.deleteMany({ where: { contractId: contract.id } });
        await tx.contract_payment_schedule.deleteMany({ where: { contractId: contract.id } });
        await tx.contracts.delete({ where: { id: contract.id } });
      }

      await tx.Player.delete({ where: { id } });
    });

    return res.json({ message: 'Giocatore eliminato con successo', data: { id } });
  } catch (error) {
    console.log('🔴 Errore eliminazione giocatore:', error?.message);
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

// 📊 Esporta giocatori in Excel
const exportPlayersToExcel = async (req, res) => {
  try {
    console.log('🔵 [DEBUG] Richiesta esportazione Excel giocatori');

    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const prisma = getPrismaClient();

    const translatePosition = (position) => {
      const translations = { GOALKEEPER: 'Portiere', DEFENDER: 'Difensore', MIDFIELDER: 'Centrocampista', FORWARD: 'Attaccante' };
      return translations[position] || position;
    };

    const players = await prisma.player.findMany({
      where: { teamId },
      orderBy: [ { position: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' } ],
      include: {
        contracts: { select: { startDate: true, endDate: true, contractType: true, status: true, salary: true } },
        createdBy: { select: { first_name: true, last_name: true } }
      }
    });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Giocatori');

    const headers = [
      'ID','Nome','Cognome','Numero Maglia','Posizione','Data Nascita','Luogo Nascita','Nazionalità','Altezza (cm)','Peso (kg)','Piede','Telefono','Email','Indirizzo','Codice Fiscale','Note','Attivo','Data Creazione','Creato da','Contratto Attivo','Tipo Contratto','Data Inizio Contratto','Data Fine Contratto','Stipendio'
    ];
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6d28d9' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };

    players.forEach(player => {
      const activeContract = player.contracts?.find(c => c.status === 'ACTIVE');
      worksheet.addRow([
        player.id,
        player.firstName || '',
        player.lastName || '',
        player.shirtNumber || '',
        translatePosition(player.position) || '',
        player.birthDate ? new Date(player.birthDate).toLocaleDateString('it-IT') : '',
        player.birthPlace || '',
        player.nationality || '',
        player.height || '',
        player.weight || '',
        player.foot || '',
        player.phoneNumber || '',
        player.email || '',
        player.address || '',
        player.fiscalCode || '',
        player.notes || '',
        player.isActive ? 'Sì' : 'No',
        player.createdAt ? new Date(player.createdAt).toLocaleDateString('it-IT') : '',
        player.createdBy ? `${player.createdBy.first_name} ${player.createdBy.last_name}` : '',
        activeContract ? 'Sì' : 'No',
        activeContract?.contractType || '',
        activeContract?.startDate ? new Date(activeContract.startDate).toLocaleDateString('it-IT') : '',
        activeContract?.endDate ? new Date(activeContract.endDate).toLocaleDateString('it-IT') : '',
        activeContract?.salary || ''
      ]);
    });

    worksheet.columns.forEach(column => { column.width = 15; });

    const fileName = `giocatori_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await workbook.xlsx.write(res);
    res.end();
    console.log('🟢 [SUCCESS] Esportazione Excel completata:', fileName);
  } catch (error) {
    console.error('🔴 [ERROR] Errore esportazione Excel:', error);
    res.status(500).json({ error: 'Errore durante l\'esportazione Excel', details: error.message });
  }
};

// 🔄 Aggiorna stato del giocatore
const updatePlayerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const teamId = req?.context?.teamId;

    if (!teamId) {
      const errorResponse = createErrorResponse(API_ERRORS.FORBIDDEN, 'Contesto team non disponibile');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const playerId = parseInt(id, 10);
    if (Number.isNaN(playerId)) {
      const errorResponse = createErrorResponse(API_ERRORS.INVALID_VALUE, 'ID giocatore non valido');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const prisma = getPrismaClient();
    const result = await prisma.player.updateMany({ where: { id: playerId, teamId }, data: { isActive: status === 'active' } });
    if (result.count === 0) {
      const errorResponse = createErrorResponse(API_ERRORS.RESOURCE_NOT_FOUND, 'Giocatore non trovato');
      return res.status(errorResponse.status).json(errorResponse.body);
    }
    const updated = await prisma.player.findFirst({ where: { id: playerId, teamId } });
    res.json({ message: 'Stato giocatore aggiornato con successo', data: updated });
  } catch (err) {
    console.error('[updatePlayerStatus]', err);
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    res.status(errorResponse.status).json(errorResponse.body);
  }
};

// 📤 Upload file giocatori
const uploadPlayersFile = async (req, res) => {
  try {
    console.log('🔵 [DEBUG] Richiesta upload file giocatori');

    const teamId = req?.context?.teamId;
    const createdById = req?.context?.userId || req.user?.profile?.id;
    
    if (!teamId || !createdById) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    if (!req.file) {
      const errorResponse = createErrorResponse(
        API_ERRORS.REQUIRED_FIELD_MISSING,
        'Nessun file caricato'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    console.log('🔵 [DEBUG] File ricevuto:', req.file.originalname, 'TeamId:', teamId);

    const fs = require('fs');
    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      const errorResponse = createErrorResponse(
        API_ERRORS.VALIDATION_FAILED,
        'File CSV vuoto o formato non valido'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Prima riga = headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('🔵 [DEBUG] Headers rilevati:', headers);

    const prisma = getPrismaClient();
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Processa le righe di dati
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        try {
          // Validazione dati obbligatori
          if (!row.firstName || !row.lastName || !row.dateOfBirth || !row.nationality || !row.position) {
            throw new Error('Campi obbligatori mancanti: nome, cognome, data di nascita, nazionalità, ruolo');
          }

          // Validazione ruolo
          const validPositions = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
          if (!validPositions.includes(row.position)) {
            throw new Error(`Ruolo non valido: ${row.position}. Valori validi: ${validPositions.join(', ')}`);
          }

          // Validazione data
          const dob = new Date(row.dateOfBirth);
          if (Number.isNaN(dob.getTime())) {
            throw new Error(`Data di nascita non valida: ${row.dateOfBirth}`);
          }

          // Controllo numero maglia duplicato
          if (row.shirtNumber && row.shirtNumber.trim() !== '') {
            const parsedShirt = parseInt(row.shirtNumber, 10);
            if (!Number.isNaN(parsedShirt)) {
              const existingPlayer = await prisma.player.findFirst({
                where: { shirtNumber: parsedShirt, isActive: true, teamId }
              });
              if (existingPlayer) {
                throw new Error(`Numero maglia ${parsedShirt} già assegnato a ${existingPlayer.firstName} ${existingPlayer.lastName}`);
              }
            }
          }

          // Crea giocatore
          const player = await prisma.player.create({
            data: {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              dateOfBirth: dob,
              nationality: row.nationality.trim(),
              position: row.position,
              shirtNumber: (row.shirtNumber && row.shirtNumber.trim() !== '') ? parseInt(row.shirtNumber, 10) : null,
              height: (row.height && row.height.trim() !== '') ? parseFloat(row.height) : null,
              weight: (row.weight && row.weight.trim() !== '') ? parseFloat(row.weight) : null,
              preferredFoot: row.preferredFoot || null,
              placeOfBirth: row.placeOfBirth ? row.placeOfBirth.trim() : null,
              taxCode: row.taxCode ? row.taxCode.toUpperCase().trim() : null,
              passportNumber: row.passportNumber ? row.passportNumber.trim() : null,
              isActive: true,
              createdById,
              teamId
            }
          });

          results.push({
            row: i + 1,
            player: `${player.firstName} ${player.lastName}`,
            status: 'success',
            message: 'Giocatore creato con successo'
          });
          successCount++;

        } catch (error) {
          results.push({
            row: i + 1,
            player: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
            status: 'error',
            message: error.message
          });
          errorCount++;
        }
      }
    }

    // Pulisci file temporaneo
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('⚠️ [WARN] Errore pulizia file temporaneo:', cleanupError.message);
    }

    console.log('🟢 [SUCCESS] Upload completato:', successCount, 'successi,', errorCount, 'errori');

    return res.json({
      message: 'Upload completato',
      summary: {
        total: lines.length - 1,
        success: successCount,
        errors: errorCount
      },
      results
    });

  } catch (error) {
    console.log('🔴 [ERROR] Errore upload file giocatori:', error.message);
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

module.exports = {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  exportPlayersToExcel,
  updatePlayerStatus,
  uploadPlayersFile
};


