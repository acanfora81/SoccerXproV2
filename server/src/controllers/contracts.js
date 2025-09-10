// server/src/controllers/contracts.js
// Controller per la gestione dei contratti

const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

/**
 * 📋 Ottieni tutti i contratti del team con informazioni giocatore
 */
const getContracts = async (req, res) => {
  try {
    const { teamId } = req.context;
    
    // Debug: controlla se teamId esiste
    if (!teamId) {
      console.log('🔴 [ERROR] teamId non definito nel contesto:', req.context);
      return res.status(400).json({
        success: false,
        error: 'TeamId non configurato per questo utente'
      });
    }
    const { 
      status, 
      contractType, 
      expiring, 
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Costruisci filtri
    const where = {
      teamId,
      ...(status && { status }),
      ...(contractType && { contractType }),
      ...(search && {
        OR: [
          { players: { firstName: { contains: search, mode: 'insensitive' } } },
          { players: { lastName: { contains: search, mode: 'insensitive' } } },
          { notes: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Filtro per contratti in scadenza (prossimi 90 giorni)
    if (expiring === 'true') {
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
      where.endDate = {
        lte: threeMonthsFromNow,
        gte: new Date()
      };
    }

    // Paginazione
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Query principale
    const [contracts, total] = await Promise.all([
      prisma.contracts.findMany({
        where,
        include: {
          players: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              shirtNumber: true,
              dateOfBirth: true,
              nationality: true,
              isActive: true
            }
          },
          contract_clauses: {
            select: {
              id: true,
              clauseType: true,
              description: true,
              amount: true,
              currency: true
            }
          },
          user_profiles: {
            select: {
              first_name: true,
              last_name: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { endDate: 'asc' }
        ],
        skip,
        take
      }),
      prisma.contracts.count({ where })
    ]);

    // Calcola statistiche
    const stats = await prisma.contracts.groupBy({
      by: ['status'],
      where: { teamId },
      _count: { status: true }
    });

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {});

    res.json({
      success: true,
      data: contracts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: statusStats
    });

  } catch (error) {
    console.error('Errore nel recupero contratti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 📋 Ottieni contratto specifico
 */
const getContract = async (req, res) => {
  try {
    const { teamId } = req.context;
    const { id } = req.params;

    const contract = await prisma.contracts.findFirst({
      where: {
        id: parseInt(id),
        teamId
      },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            shirtNumber: true,
            dateOfBirth: true,
            nationality: true,
            isActive: true
          }
        },
        contract_clauses: {
          select: {
            id: true,
            clauseType: true,
            description: true,
            amount: true,
            currency: true,
            conditions: true
          }
        },
        user_profiles: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        amendments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            signedDate: true,
            effectiveFrom: true,
            notes: true,
            createdAt: true
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contratto non trovato'
      });
    }

    res.json({
      success: true,
      data: contract
    });

  } catch (error) {
    console.error('Errore nel recupero contratto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * ➕ Crea nuovo contratto
 */
const createContract = async (req, res) => {
  try {
    const { teamId, userId } = req.context;
    const {
      playerId,
      startDate,
      endDate,
      salary,
      currency = 'EUR',
      contractType,
      status = 'DRAFT',
      signedDate,
      notes,
      clauses = [],
      // Nuovi campi opzionali
      contractRole,
      paymentFrequency,
      protocolNumber,
      depositDate,
      agentContact,
      loanFromClub,
      loanToClub,
      buyOption,
      obligationToBuy,
      buyPrice,
      responsibleUserId
    } = req.body;

    // Validazione dati richiesti
    if (!playerId || !startDate || !endDate || !salary || !contractType) {
      return res.status(400).json({
        success: false,
        error: 'Dati mancanti: playerId, startDate, endDate, salary e contractType sono obbligatori'
      });
    }

    // Verifica che il giocatore appartenga al team
    const player = await prisma.player.findFirst({
      where: {
        id: parseInt(playerId),
        teamId
      }
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Giocatore non trovato o non appartiene al team'
      });
    }

    // Crea contratto con clausole in una transazione
    const result = await prisma.$transaction(async (tx) => {
      // Crea il contratto
      const contract = await tx.contracts.create({
        data: {
          playerId: parseInt(playerId),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          salary: parseFloat(salary),
          currency,
          contractType,
          status,
          signedDate: signedDate ? new Date(signedDate) : null,
          notes,
          teamId,
          createdById: userId,
          updatedAt: new Date(), // Aggiunto campo richiesto
          // Nuovi campi opzionali
          contractRole: contractRole || null,
          paymentFrequency: paymentFrequency || null,
          protocolNumber: protocolNumber || null,
          depositDate: depositDate ? new Date(depositDate) : null,
          agentContact: agentContact || null,
          loanFromClub: loanFromClub || null,
          loanToClub: loanToClub || null,
          buyOption: buyOption || false,
          obligationToBuy: obligationToBuy || false,
          buyPrice: buyPrice ? parseFloat(buyPrice) : null,
          responsibleUserId: responsibleUserId ? parseInt(responsibleUserId) : null
        }
      });

      // Aggiungi clausole se presenti
      if (clauses && clauses.length > 0) {
        await tx.contract_clauses.createMany({
          data: clauses.map(clause => ({
            contractId: contract.id,
            clauseType: clause.clauseType,
            description: clause.description,
            amount: clause.amount ? parseFloat(clause.amount) : null,
            currency: clause.currency || currency,
            conditions: clause.conditions,
            teamId,
            updatedAt: new Date() // Aggiunto campo richiesto
          }))
        });
      }

      return contract;
    });

    // Recupera il contratto completo con relazioni
    const fullContract = await prisma.contracts.findUnique({
      where: { id: result.id },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            shirtNumber: true
          }
        },
        contract_clauses: true
      }
    });

    res.status(201).json({
      success: true,
      data: fullContract,
      message: 'Contratto creato con successo'
    });

  } catch (error) {
    console.error('Errore nella creazione contratto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * ✏️ Aggiorna contratto
 */
const updateContract = async (req, res) => {
  try {
    const { teamId, userId } = req.context;
    const { id } = req.params;
    const updateData = req.body;

    // Verifica che il contratto appartenga al team
    const existingContract = await prisma.contracts.findFirst({
      where: {
        id: parseInt(id),
        teamId
      }
    });

    if (!existingContract) {
      return res.status(404).json({
        success: false,
        error: 'Contratto non trovato'
      });
    }

    // Prepara dati per l'aggiornamento
    const { clauses, isOfficialRenewal, ...contractData } = updateData;
    
    console.log('🔵 Dati ricevuti per aggiornamento:', updateData);
    console.log('🔵 ContractData dopo destructuring:', contractData);
    
    // Converte date se presenti (solo se sono stringhe)
    if (contractData.startDate && typeof contractData.startDate === 'string') {
      contractData.startDate = new Date(contractData.startDate);
    }
    if (contractData.endDate && typeof contractData.endDate === 'string') {
      contractData.endDate = new Date(contractData.endDate);
    }
    if (contractData.signedDate && typeof contractData.signedDate === 'string') {
      contractData.signedDate = new Date(contractData.signedDate);
    }
    
    // Converte numeri se presenti e validi
    if (contractData.salary && contractData.salary !== '') {
      contractData.salary = parseFloat(contractData.salary);
    }
    if (contractData.buyPrice && contractData.buyPrice !== '') {
      contractData.buyPrice = parseFloat(contractData.buyPrice);
    }
    if (contractData.responsibleUserId && contractData.responsibleUserId !== '') {
      contractData.responsibleUserId = parseInt(contractData.responsibleUserId);
    }
    
    // Rimuovi playerId dai dati di aggiornamento - non può essere modificato direttamente
    // Il playerId è una foreign key che non dovrebbe essere aggiornata
    if (contractData.playerId !== undefined) {
      delete contractData.playerId;
    }
    
    // Gestisce campi che possono essere null o undefined
    if (contractData.salary === '' || contractData.salary === null) {
      delete contractData.salary;
    }
    if (contractData.buyPrice === '' || contractData.buyPrice === null) {
      delete contractData.buyPrice;
    }
    if (contractData.responsibleUserId === '' || contractData.responsibleUserId === null) {
      delete contractData.responsibleUserId;
    }
    
    // Gestisce campi stringa che possono essere vuoti
    if (contractData.notes === '' || contractData.notes === null) {
      contractData.notes = null;
    }
    if (contractData.agentContact === '' || contractData.agentContact === null) {
      contractData.agentContact = null;
    }
    if (contractData.loanFromClub === '' || contractData.loanFromClub === null) {
      contractData.loanFromClub = null;
    }
    if (contractData.loanToClub === '' || contractData.loanToClub === null) {
      contractData.loanToClub = null;
    }
    if (contractData.protocolNumber === '' || contractData.protocolNumber === null) {
      contractData.protocolNumber = null;
    }
    
    // Converte date opzionali se presenti (solo se sono stringhe)
    if (contractData.depositDate && typeof contractData.depositDate === 'string') {
      contractData.depositDate = new Date(contractData.depositDate);
    }
    
    // Gestisce date che possono essere vuote
    if (contractData.startDate === '' || contractData.startDate === null) {
      delete contractData.startDate;
    }
    if (contractData.endDate === '' || contractData.endDate === null) {
      delete contractData.endDate;
    }
    if (contractData.signedDate === '' || contractData.signedDate === null) {
      contractData.signedDate = null;
    }
    if (contractData.depositDate === '' || contractData.depositDate === null) {
      contractData.depositDate = null;
    }
    
    // Gestisce campi enum che possono essere vuoti
    if (contractData.contractType === '' || contractData.contractType === null) {
      delete contractData.contractType;
    }
    if (contractData.status === '' || contractData.status === null) {
      delete contractData.status;
    }
    if (contractData.contractRole === '' || contractData.contractRole === null) {
      contractData.contractRole = null;
    }
    if (contractData.paymentFrequency === '' || contractData.paymentFrequency === null) {
      contractData.paymentFrequency = null;
    }
    
    // Gestisce campi booleani
    if (contractData.buyOption !== undefined) contractData.buyOption = Boolean(contractData.buyOption);
    if (contractData.obligationToBuy !== undefined) contractData.obligationToBuy = Boolean(contractData.obligationToBuy);
    
    // Aggiungi solo il campo updatedAt - gli altri sono foreign keys che non possono essere aggiornate
    contractData.updatedAt = new Date();
    
    // Rimuovi foreign keys che non possono essere aggiornate direttamente
    delete contractData.teamId;
    delete contractData.userId;
    delete contractData.profileId;
    
    // Rimuovi anche createdAt e id che non possono essere modificati
    delete contractData.createdAt;
    delete contractData.id;
    
    console.log('🔵 Dati finali per aggiornamento database:', contractData);

    // Aggiorna in transazione
    const result = await prisma.$transaction(async (tx) => {
      // Crea emendamento solo se è un rinnovo ufficiale esplicito
      let amendment = null;
      
      if (isOfficialRenewal) {
        console.log('🔄 Rinnovo ufficiale richiesto - Creazione emendamento');
        
        // Determina il tipo di emendamento basato sui cambiamenti
        let amendmentType = 'MODIFICATION';
        if (contractData.endDate && contractData.endDate > existingContract.endDate) {
          amendmentType = 'EXTENSION';
        }
        if (contractData.startDate && contractData.startDate !== existingContract.startDate) {
          amendmentType = 'RENEWAL';
        }
        
        // Crea un emendamento per tracciare il rinnovo ufficiale
        amendment = await tx.contract_amendments.create({
          data: {
            contractId: parseInt(id),
            type: amendmentType,
            signedDate: new Date(),
            effectiveFrom: contractData.startDate || existingContract.startDate,
            notes: `Rinnovo ufficiale - Modifiche: ${contractData.startDate ? 'Inizio: ' + existingContract.startDate.toISOString().split('T')[0] + ' → ' + contractData.startDate.toISOString().split('T')[0] : ''} ${contractData.endDate ? 'Fine: ' + existingContract.endDate.toISOString().split('T')[0] + ' → ' + contractData.endDate.toISOString().split('T')[0] : ''} ${contractData.salary ? 'Stipendio: ' + existingContract.salary + ' → ' + contractData.salary : ''}`,
            teamId
          }
        });
        
        // Aggiorna lo status del contratto a RENEWED se è un'estensione
        if (amendmentType === 'EXTENSION' || amendmentType === 'RENEWAL') {
          contractData.status = 'RENEWED';
        }
      }
      
      // Aggiorna il contratto
      const contract = await tx.contracts.update({
        where: { id: parseInt(id) },
        data: contractData
      });

      // Aggiorna clausole se fornite
      if (clauses) {
        // Rimuovi clausole esistenti
        await tx.contract_clauses.deleteMany({
          where: { contractId: parseInt(id) }
        });

        // Aggiungi nuove clausole
        if (clauses.length > 0) {
          await tx.contract_clauses.createMany({
            data: clauses.map(clause => ({
              contractId: parseInt(id),
              clauseType: clause.clauseType,
              description: clause.description,
              amount: clause.amount ? parseFloat(clause.amount) : null,
              currency: clause.currency || contractData.currency || 'EUR',
              conditions: clause.conditions,
              teamId
            }))
          });
        }
      }

      return contract;
    });

    // Recupera il contratto aggiornato con emendamenti
    const updatedContract = await prisma.contracts.findUnique({
      where: { id: parseInt(id) },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            shirtNumber: true
          }
        },
        contract_clauses: true,
        amendments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: updatedContract,
      message: 'Contratto aggiornato con successo'
    });

  } catch (error) {
    console.error('❌ Errore nell\'aggiornamento contratto:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * 📋 Ottieni emendamenti di un contratto
 */
const getContractAmendments = async (req, res) => {
  try {
    const { teamId } = req.context;
    const { id } = req.params;

    // Verifica che il contratto appartenga al team
    const contract = await prisma.contracts.findFirst({
      where: {
        id: parseInt(id),
        teamId
      },
      select: { id: true }
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contratto non trovato'
      });
    }

    // Recupera tutti gli emendamenti del contratto
    const amendments = await prisma.contract_amendments.findMany({
      where: {
        contractId: parseInt(id),
        teamId
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        signedDate: true,
        effectiveFrom: true,
        notes: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: amendments,
      message: 'Emendamenti recuperati con successo'
    });

  } catch (error) {
    console.error('❌ Errore nel recupero emendamenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 📝 Crea emendamento manuale per un contratto
 */
const createContractAmendment = async (req, res) => {
  try {
    const { teamId } = req.context;
    const { id } = req.params;
    const { type, signedDate, effectiveFrom, notes } = req.body;

    // Verifica che il contratto appartenga al team
    const contract = await prisma.contracts.findFirst({
      where: {
        id: parseInt(id),
        teamId
      },
      select: { id: true }
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contratto non trovato'
      });
    }

    // Crea l'emendamento
    const amendment = await prisma.contract_amendments.create({
      data: {
        contractId: parseInt(id),
        type: type || 'MODIFICATION',
        signedDate: signedDate ? new Date(signedDate) : new Date(),
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        notes: notes || 'Emendamento manuale',
        teamId
      }
    });

    res.status(201).json({
      success: true,
      data: amendment,
      message: 'Emendamento creato con successo'
    });

  } catch (error) {
    console.error('❌ Errore nella creazione emendamento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 🔄 Rinnova contratto (crea nuovo contratto e chiude quello vecchio)
 */
const renewContract = async (req, res) => {
  try {
    const { teamId, userId } = req.context;
    const { id } = req.params;
    const renewalData = req.body;

    // Verifica che il contratto appartenga al team
    const existingContract = await prisma.contracts.findFirst({
      where: {
        id: parseInt(id),
        teamId
      },
      include: {
        players: true,
        contract_clauses: true
      }
    });

    if (!existingContract) {
      return res.status(404).json({
        success: false,
        error: 'Contratto non trovato'
      });
    }

    // Prepara dati per il nuovo contratto
    const newContractData = {
      startDate: new Date(renewalData.startDate),
      endDate: new Date(renewalData.endDate),
      salary: parseFloat(renewalData.salary),
      currency: renewalData.currency || existingContract.currency,
      contractType: renewalData.contractType || existingContract.contractType,
      status: 'ACTIVE',
      signedDate: new Date(),
      notes: renewalData.notes || `Rinnovo del contratto ${existingContract.id}`,
      playerId: existingContract.playerId,
      teamId,
      userId,
      profileId: req.user.profileId,
      agentContact: renewalData.agentContact || existingContract.agentContact,
      buyOption: renewalData.buyOption !== undefined ? Boolean(renewalData.buyOption) : existingContract.buyOption,
      buyPrice: renewalData.buyPrice ? parseFloat(renewalData.buyPrice) : existingContract.buyPrice,
      contractRole: renewalData.contractRole || existingContract.contractRole,
      depositDate: renewalData.depositDate ? new Date(renewalData.depositDate) : null,
      loanFromClub: renewalData.loanFromClub || existingContract.loanFromClub,
      loanToClub: renewalData.loanToClub || existingContract.loanToClub,
      obligationToBuy: renewalData.obligationToBuy !== undefined ? Boolean(renewalData.obligationToBuy) : existingContract.obligationToBuy,
      paymentFrequency: renewalData.paymentFrequency || existingContract.paymentFrequency,
      protocolNumber: renewalData.protocolNumber || `Rinnovo_${existingContract.protocolNumber}_${new Date().toISOString().split('T')[0]}`,
      responsibleUserId: renewalData.responsibleUserId || existingContract.responsibleUserId
    };

    const result = await prisma.$transaction(async (tx) => {
      // Chiudi il contratto esistente
      await tx.contracts.update({
        where: { id: parseInt(id) },
        data: { 
          status: 'EXPIRED',
          endDate: new Date(renewalData.startDate) // Il vecchio contratto finisce quando inizia il nuovo
        }
      });

      // Crea il nuovo contratto
      const newContract = await tx.contracts.create({
        data: newContractData
      });

      // Copia le clausole dal contratto precedente se non specificate
      if (existingContract.contract_clauses.length > 0 && !renewalData.clauses) {
        await tx.contract_clauses.createMany({
          data: existingContract.contract_clauses.map(clause => ({
            contractId: newContract.id,
            clauseType: clause.clauseType,
            description: clause.description,
            amount: clause.amount,
            currency: clause.currency,
            conditions: clause.conditions,
            percentage: clause.percentage,
            teamId
          }))
        });
      }

      // Crea un emendamento per tracciare il rinnovo
      await tx.contract_amendments.create({
        data: {
          contractId: newContract.id,
          type: 'RENEWAL',
          signedDate: new Date(),
          effectiveFrom: new Date(renewalData.startDate),
          notes: `Rinnovo completo - Nuovo contratto ${newContract.id} sostituisce contratto ${existingContract.id}`,
          teamId
        }
      });

      return newContract;
    });

    // Recupera il nuovo contratto completo
    const fullNewContract = await prisma.contracts.findUnique({
      where: { id: result.id },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            shirtNumber: true
          }
        },
        contract_clauses: true,
        amendments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: fullNewContract,
      message: 'Contratto rinnovato con successo',
      previousContractId: parseInt(id)
    });

  } catch (error) {
    console.error('❌ Errore nel rinnovo contratto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 🗑️ Elimina contratto
 */
const deleteContract = async (req, res) => {
  try {
    const { teamId } = req.context;
    const { id } = req.params;

    // Verifica che il contratto appartenga al team
    const contract = await prisma.contracts.findFirst({
      where: {
        id: parseInt(id),
        teamId
      }
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contratto non trovato'
      });
    }

    // Elimina in transazione (cascade per le clausole)
    await prisma.$transaction(async (tx) => {
      // Elimina clausole
      await tx.contract_clauses.deleteMany({
        where: { contractId: parseInt(id) }
      });

      // Elimina contratto
      await tx.contracts.delete({
        where: { id: parseInt(id) }
      });
    });

    res.json({
      success: true,
      message: 'Contratto eliminato con successo'
    });

  } catch (error) {
    console.error('Errore nell\'eliminazione contratto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 🔍 Verifica contratti sovrapposti per un giocatore
 */
const checkContractOverlaps = async (req, res) => {
  try {
    const { teamId } = req.context;
    const { playerId } = req.params;

    // Recupera tutti i contratti del giocatore
    const contracts = await prisma.contracts.findMany({
      where: {
        teamId,
        playerId: parseInt(playerId),
        status: { in: ['ACTIVE', 'RENEWED'] }
      },
      orderBy: { startDate: 'asc' },
      include: {
        players: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Verifica sovrapposizioni
    const overlaps = [];
    for (let i = 0; i < contracts.length; i++) {
      for (let j = i + 1; j < contracts.length; j++) {
        const contract1 = contracts[i];
        const contract2 = contracts[j];
        
        // Controlla se le date si sovrappongono
        if (contract1.endDate >= contract2.startDate && contract1.startDate <= contract2.endDate) {
          overlaps.push({
            contract1: {
              id: contract1.id,
              startDate: contract1.startDate,
              endDate: contract1.endDate,
              salary: contract1.salary,
              status: contract1.status
            },
            contract2: {
              id: contract2.id,
              startDate: contract2.startDate,
              endDate: contract2.endDate,
              salary: contract2.salary,
              status: contract2.status
            },
            overlapPeriod: {
              start: new Date(Math.max(contract1.startDate.getTime(), contract2.startDate.getTime())),
              end: new Date(Math.min(contract1.endDate.getTime(), contract2.endDate.getTime()))
            }
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        playerId: parseInt(playerId),
        playerName: contracts[0]?.players ? `${contracts[0].players.firstName} ${contracts[0].players.lastName}` : 'Giocatore sconosciuto',
        totalContracts: contracts.length,
        overlaps: overlaps,
        hasOverlaps: overlaps.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Errore nel controllo sovrapposizioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 📚 Ottieni storia completa dei contratti di un giocatore
 */
const getPlayerContractHistory = async (req, res) => {
  try {
    const { teamId } = req.context;
    const { playerId } = req.params;

    // Verifica che il giocatore appartenga al team
    const player = await prisma.player.findFirst({
      where: {
        id: parseInt(playerId),
        teamId
      },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Giocatore non trovato'
      });
    }

    // Recupera tutti i contratti del giocatore (inclusi quelli scaduti)
    const contracts = await prisma.contracts.findMany({
      where: {
        teamId,
        playerId: parseInt(playerId)
      },
      include: {
        contract_clauses: {
          select: {
            id: true,
            clauseType: true,
            description: true,
            amount: true,
            currency: true
          }
        },
        amendments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            signedDate: true,
            effectiveFrom: true,
            notes: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { startDate: 'desc' }, // Più recenti prima
        { createdAt: 'desc' }
      ]
    });

    // Raggruppa i contratti per stato e periodo
    const history = {
      player: {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`
      },
      contracts: contracts.map(contract => ({
        id: contract.id,
        startDate: contract.startDate,
        endDate: contract.endDate,
        salary: contract.salary,
        currency: contract.currency,
        contractType: contract.contractType,
        status: contract.status,
        signedDate: contract.signedDate,
        notes: contract.notes,
        clauses: contract.contract_clauses,
        amendments: contract.amendments,
        // Calcola durata in giorni
        durationDays: Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24)),
        // Determina se è il contratto attuale
        isCurrent: contract.status === 'ACTIVE' && 
                   new Date(contract.startDate) <= new Date() && 
                   new Date(contract.endDate) >= new Date()
      })),
      summary: {
        totalContracts: contracts.length,
        activeContracts: contracts.filter(c => c.status === 'ACTIVE').length,
        totalValue: contracts
          .filter(c => ['ACTIVE', 'RENEWED'].includes(c.status))
          .reduce((sum, c) => sum + parseFloat(c.salary || 0), 0),
        averageSalary: contracts.length > 0 
          ? contracts.reduce((sum, c) => sum + parseFloat(c.salary || 0), 0) / contracts.length 
          : 0,
        totalDuration: contracts.reduce((sum, c) => 
          sum + Math.ceil((new Date(c.endDate) - new Date(c.startDate)) / (1000 * 60 * 60 * 24)), 0)
      }
    };

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('❌ Errore nel recupero storia contratti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 📊 Ottieni statistiche contratti
 */
const getContractStats = async (req, res) => {
  try {
    const { teamId } = req.context;
    
    // Debug: controlla se teamId esiste
    if (!teamId) {
      console.log('🔴 [ERROR] teamId non definito nel contesto per stats:', req.context);
      return res.status(400).json({
        success: false,
        error: 'TeamId non configurato per questo utente'
      });
    }

    const [
      totalContracts,
      activeContractsCount,
      expiringContracts,
      statusStats,
      typeStats
    ] = await Promise.all([
      // Totale contratti
      prisma.contracts.count({ where: { teamId } }),
      
      // Contratti attivi (esclude SUSPENDED e EXPIRED)
      prisma.contracts.count({ 
        where: { 
          teamId, 
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] }
        } 
      }),
      
      // Contratti in scadenza (prossimi 90 giorni) - solo ACTIVE e RENEWED
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED'] },
          endDate: {
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            gte: new Date()
          }
        }
      }),
      
      // Statistiche per status
      prisma.contracts.groupBy({
        by: ['status'],
        where: { teamId },
        _count: { status: true }
      }),
      
      // Statistiche per tipo
      prisma.contracts.groupBy({
        by: ['contractType'],
        where: { teamId },
        _count: { contractType: true }
      })
    ]);

    // Calcola valore totale contratti attivi (logica migliorata)
    const currentDate = new Date();
    
    // Recupera tutti i contratti attivi, rinnovati e bozze che sono effettivamente validi oggi
    // Esclude contratti SUSPENDED (Sospeso) dal conteggio del valore totale
    const activeContracts = await prisma.contracts.findMany({
      where: {
        teamId,
        status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
        startDate: { lte: currentDate },
        endDate: { gte: currentDate }
      },
      include: {
        players: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: [
        { playerId: 'asc' },
        { endDate: 'desc' } // Prendi il contratto più recente per ogni giocatore
      ]
    });

    // Debug: log dei contratti trovati
    console.log('🔍 Contratti attivi trovati:', {
      currentDate: currentDate.toISOString(),
      totalFound: activeContracts.length,
      contracts: activeContracts.map(c => ({
        id: c.id,
        playerId: c.playerId,
        playerName: `${c.players.firstName} ${c.players.lastName}`,
        salary: c.salary,
        status: c.status,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString()
      }))
    });

    // Raggruppa per giocatore e prendi solo il contratto più recente
    const uniquePlayerContracts = new Map();
    activeContracts.forEach(contract => {
      if (!uniquePlayerContracts.has(contract.playerId)) {
        uniquePlayerContracts.set(contract.playerId, contract);
      }
    });

    // Calcola il valore totale
    const totalValue = Array.from(uniquePlayerContracts.values())
      .reduce((sum, contract) => sum + parseFloat(contract.salary), 0);

    console.log('💰 Calcolo valore totale:', {
      uniquePlayers: uniquePlayerContracts.size,
      totalValue: totalValue,
      contractsUsed: Array.from(uniquePlayerContracts.values()).map(c => ({
        playerId: c.playerId,
        playerName: `${c.players.firstName} ${c.players.lastName}`,
        salary: c.salary
      }))
    });

    res.json({
      success: true,
      data: {
        total: totalContracts,
        active: activeContractsCount,
        expiring: expiringContracts,
        totalValue: totalValue,
        uniqueActiveContracts: uniquePlayerContracts.size,
        totalActiveContracts: activeContracts.length,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, stat) => {
          acc[stat.contractType] = stat._count.contractType;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Errore nel recupero statistiche contratti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

module.exports = {
  getContracts,
  getContract,
  getContractAmendments,
  createContract,
  updateContract,
  createContractAmendment,
  renewContract,
  deleteContract,
  checkContractOverlaps,
  getContractStats,
  getPlayerContractHistory
};

