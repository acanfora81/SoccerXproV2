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
    const player = await prisma.Player.findFirst({
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
          createdById: userId
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
            teamId
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
    const { clauses, ...contractData } = updateData;
    
    // Converte date se presenti
    if (contractData.startDate) contractData.startDate = new Date(contractData.startDate);
    if (contractData.endDate) contractData.endDate = new Date(contractData.endDate);
    if (contractData.signedDate) contractData.signedDate = new Date(contractData.signedDate);
    
    // Converte numeri se presenti
    if (contractData.salary) contractData.salary = parseFloat(contractData.salary);

    // Aggiorna in transazione
    const result = await prisma.$transaction(async (tx) => {
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

    // Recupera il contratto aggiornato
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
        contract_clauses: true
      }
    });

    res.json({
      success: true,
      data: updatedContract,
      message: 'Contratto aggiornato con successo'
    });

  } catch (error) {
    console.error('Errore nell\'aggiornamento contratto:', error);
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
      activeContracts,
      expiringContracts,
      statusStats,
      typeStats
    ] = await Promise.all([
      // Totale contratti
      prisma.contracts.count({ where: { teamId } }),
      
      // Contratti attivi
      prisma.contracts.count({ 
        where: { 
          teamId, 
          status: 'ACTIVE' 
        } 
      }),
      
      // Contratti in scadenza (prossimi 90 giorni)
      prisma.contracts.count({
        where: {
          teamId,
          status: 'ACTIVE',
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

    // Calcola valore totale contratti attivi
    const totalValue = await prisma.contracts.aggregate({
      where: {
        teamId,
        status: 'ACTIVE'
      },
      _sum: {
        salary: true
      }
    });

    res.json({
      success: true,
      data: {
        total: totalContracts,
        active: activeContracts,
        expiring: expiringContracts,
        totalValue: totalValue._sum.salary || 0,
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
  createContract,
  updateContract,
  deleteContract,
  getContractStats
};

