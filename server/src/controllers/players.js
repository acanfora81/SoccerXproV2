// server/src/controllers/players.js
// Controller per gestione giocatori SoccerXpro V2

const { getPrismaClient } = require('../config/database');
const { API_ERRORS, createErrorResponse } = require('../constants/errors');

console.log('🟢 [INFO] Caricamento controller giocatori...'); // INFO - rimuovere in produzione


/**
 * 📋 Ottieni lista giocatori (scoppiata per team)
 * GET /api/players
 */
const getPlayers = async (req, res) => {
  try {
    console.log('🔵 [DEBUG] Richiesta lista giocatori');

    // ✅ 1) Contesto multi-tenant
    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // ✅ 2) Prisma client condiviso
    const prisma = getPrismaClient();

    // ✅ 3) Query filtrata per teamId (stessa include e ordinamenti)
    const players = await prisma.player.findMany({
      where: { teamId }, // 👈 filtro multi-tenant
      orderBy: [
        { isActive: 'desc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      include: {
        createdBy: {
          select: { first_name: true, last_name: true }
        },
        contracts: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            contractType: true,
            status: true
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

    return res.json({
      message: 'Lista giocatori recuperata con successo',
      data: players,
      count: players.length
    });

  } catch (error) {
    console.log('🔴 Errore recupero lista giocatori:', error.message);
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

/**
 * 👤 Ottieni giocatore per ID (scoppiato per team)
 * GET /api/players/:id
 */
const getPlayerById = async (req, res) => {
  try {
    // ✅ 1) Contesto multi‑tenant
    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // ✅ 2) Validazione ID
    const playerId = parseInt(req.params.id, 10);
    if (Number.isNaN(playerId)) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'ID giocatore non valido'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    console.log('🔵 [DEBUG] Richiesta dettagli giocatore ID:', playerId);

    // ✅ 3) Query vincolata a id + teamId
    const prisma = getPrismaClient();
    const player = await prisma.player.findFirst({
      where: { id: playerId, teamId },   // 👈 filtro tenant
      include: {
        createdBy: { select: { first_name: true, last_name: true } },
        contracts: { orderBy: { startDate: 'desc' } },
        injuries:  { orderBy: { injuryDate: 'desc' } },
        medicalVisits: { orderBy: { visitDate: 'desc' }, take: 10 },
        transfers: { orderBy: { createdAt: 'desc' } },
        statistics:{ orderBy: { season: 'desc' } }
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

    return res.json({
      message: 'Dettagli giocatore recuperati con successo',
      data: player
    });

  } catch (error) {
    console.log('🔴 Errore recupero giocatore:', error.message);
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

/**
 * ➕ Crea nuovo giocatore
 * POST /api/players
 */
const createPlayer = async (req, res) => {
  try {
    // ✅ 1) Contesto multi‑tenant (obbligatorio)
    const teamId = req?.context?.teamId;
    const createdById = req?.context?.userId || req.user?.profile?.id;
    if (!teamId || !createdById) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // ✅ 2) White‑list campi dal body
    const {
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      position,
      shirtNumber,
      height,
      weight,
      preferredFoot,
      placeOfBirth,
      taxCode,
      passportNumber
    } = req.body || {};

    console.log('🔵 [DEBUG] Creazione nuovo giocatore:', firstName, lastName);

    // ✅ 3) Validazioni base
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

    // Data di nascita valida
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'Data di nascita non valida'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // ✅ 4) Client Prisma
    const prisma = getPrismaClient();

    // ✅ 5) Verifiche di unicità (scopiate per team dove ha senso)
    if (shirtNumber !== undefined && shirtNumber !== null && `${shirtNumber}`.trim() !== '') {
      const parsedShirt = parseInt(shirtNumber, 10);
      if (!Number.isNaN(parsedShirt)) {
        const existingPlayer = await prisma.player.findFirst({
          where: {
            shirtNumber: parsedShirt,
            isActive: true,
            teamId                      // ← unicità “di fatto” per team
          }
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
      const existingByTax = await prisma.player.findFirst({
        where: { taxCode: taxCode.toUpperCase().trim() }
      });
      if (existingByTax) {
        const errorResponse = createErrorResponse(
          API_ERRORS.VALIDATION_FAILED,
          'Codice fiscale già presente nel sistema'
        );
        return res.status(errorResponse.status).json(errorResponse.body);
      }
    }

    // ✅ 6) Creazione forzando teamId e createdById
    const player = await prisma.player.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob,
        nationality: nationality.trim(),
        position,
        shirtNumber: (shirtNumber === undefined || shirtNumber === null || `${shirtNumber}`.trim() === '')
          ? null
          : parseInt(shirtNumber, 10),
        height: (height === undefined || height === null || `${height}`.trim?.() === '')
          ? null
          : parseFloat(height),
        weight: (weight === undefined || weight === null || `${weight}`.trim?.() === '')
          ? null
          : parseFloat(weight),
        preferredFoot: preferredFoot || null,
        placeOfBirth: placeOfBirth ? placeOfBirth.trim() : null,
        taxCode: taxCode ? taxCode.toUpperCase().trim() : null,
        passportNumber: passportNumber ? passportNumber.trim() : null,
        isActive: true,
        createdById,      // 👈 audit
        teamId            // 👈 iniezione multi‑tenant
      },
      include: {
        createdBy: {
          select: { first_name: true, last_name: true }
        }
      }
    });

    console.log('🟢 [INFO] Giocatore creato con ID:', player.id);

    return res.status(201).json({
      message: 'Giocatore creato con successo',
      data: player
    });

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

/**
 * ✏️ Aggiorna giocatore
 * PUT /api/players/:id
 */
const updatePlayer = async (req, res) => {
  try {
    // ✅ contesto tenant
    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(API_ERRORS.FORBIDDEN, 'Contesto team non disponibile');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // ✅ id valido
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      const errorResponse = createErrorResponse(API_ERRORS.INVALID_VALUE, 'ID giocatore non valido');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const prisma = getPrismaClient();

    // ✅ white-list campi aggiornabili (teamId ignorato)
    const {
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      position,
      shirtNumber,
      height,
      weight,
      preferredFoot,
      placeOfBirth,
      taxCode,
      passportNumber,
      isActive
    } = req.body || {};

    // (opzionale) validazioni leggere su enum
    if (position && !['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'].includes(position)) {
      const errorResponse = createErrorResponse(API_ERRORS.INVALID_VALUE, 'Ruolo non valido');
      return res.status(errorResponse.status).json(errorResponse.body);
    }
    if (preferredFoot && !['LEFT', 'RIGHT', 'BOTH'].includes(preferredFoot)) {
      const errorResponse = createErrorResponse(API_ERRORS.INVALID_VALUE, 'Piede preferito non valido');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // (opzionale) unicità numero maglia per team
    if (shirtNumber !== undefined && shirtNumber !== null && `${shirtNumber}`.trim() !== '') {
      const parsedShirt = parseInt(shirtNumber, 10);
      if (!Number.isNaN(parsedShirt)) {
        const clash = await prisma.player.findFirst({
          where: {
            id: { not: id },
            teamId,
            isActive: true,
            shirtNumber: parsedShirt
          },
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

    // costruisci l'oggetto data solo con i campi presenti
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
    if (shirtNumber !== undefined)
      data.shirtNumber =
        (shirtNumber === '' || shirtNumber === null || typeof shirtNumber === 'undefined')
          ? null
          : parseInt(shirtNumber, 10);
    if (height !== undefined)
      data.height =
        (height === '' || height === null || typeof height === 'undefined')
          ? null
          : parseFloat(height);
    if (weight !== undefined)
      data.weight =
        (weight === '' || weight === null || typeof weight === 'undefined')
          ? null
          : parseFloat(weight);
    if (preferredFoot !== undefined) data.preferredFoot = preferredFoot || null;
    if (placeOfBirth !== undefined) data.placeOfBirth = placeOfBirth ? placeOfBirth.trim() : null;
    if (taxCode !== undefined) data.taxCode = taxCode ? taxCode.toUpperCase().trim() : null;
    if (passportNumber !== undefined) data.passportNumber = passportNumber ? passportNumber.trim() : null;
    if (isActive !== undefined) data.isActive = !!isActive;

    // ✅ update blindato per team
    const result = await prisma.player.updateMany({
      where: { id, teamId },
      data
    });

    if (result.count === 0) {
      const errorResponse = createErrorResponse(API_ERRORS.RESOURCE_NOT_FOUND, 'Giocatore non trovato');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // ritorna il record aggiornato
    const updated = await prisma.player.findFirst({
      where: { id, teamId },
      include: {
        createdBy: { select: { first_name: true, last_name: true } }
      }
    });

    return res.json({
      message: 'Giocatore aggiornato con successo',
      data: updated
    });

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


/**
 * 🗑️ Elimina giocatore
 * DELETE /api/players/:id
 */
const deletePlayer = async (req, res) => {
  try {
    // ✅ contesto tenant
    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(API_ERRORS.FORBIDDEN, 'Contesto team non disponibile');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // ✅ id valido
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      const errorResponse = createErrorResponse(API_ERRORS.INVALID_VALUE, 'ID giocatore non valido');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const prisma = getPrismaClient();

    // ✅ Verifica che il giocatore esista e appartenga al team
    const player = await prisma.Player.findFirst({
      where: { id, teamId }
    });

    if (!player) {
      const errorResponse = createErrorResponse(API_ERRORS.RESOURCE_NOT_FOUND, 'Giocatore non trovato');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // ✅ Elimina in transazione tutte le relazioni dipendenti
    await prisma.$transaction(async (tx) => {
      // Elimina performance data
      await tx.PerformanceData.deleteMany({
        where: { playerId: id }
      });

      // Elimina medical visits
      await tx.medical_visits.deleteMany({
        where: { playerId: id }
      });

      // Elimina player statistics
      await tx.player_statistics.deleteMany({
        where: { playerId: id }
      });

      // Elimina transfers
      await tx.transfers.deleteMany({
        where: { playerId: id }
      });

      // Elimina injuries
      await tx.injuries.deleteMany({
        where: { playerId: id }
      });

      // Elimina contratti e le loro relazioni
      const contracts = await tx.contracts.findMany({
        where: { playerId: id },
        select: { id: true }
      });

      for (const contract of contracts) {
        // Elimina emendamenti del contratto
        await tx.contract_amendments.deleteMany({
          where: { contractId: contract.id }
        });

        // Elimina file del contratto
        await tx.contract_files.deleteMany({
          where: { contractId: contract.id }
        });

        // Elimina clausole del contratto
        await tx.contract_clauses.deleteMany({
          where: { contractId: contract.id }
        });

        // Elimina schedule di pagamento del contratto
        await tx.contract_payment_schedule.deleteMany({
          where: { contractId: contract.id }
        });

        // Elimina il contratto
        await tx.contracts.delete({
          where: { id: contract.id }
        });
      }

      // Elimina il giocatore
      await tx.Player.delete({
        where: { id }
      });
    });

    return res.json({
      message: 'Giocatore eliminato con successo',
      data: { id }
    });

  } catch (error) {
    console.log('🔴 Errore eliminazione giocatore:', error?.message);
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};


module.exports = {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer
};