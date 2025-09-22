// server/src/controllers/contracts.js
// Controller per la gestione dei contratti

const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

// Funzione helper per convertire numeri italiani
const parseItalianNumber = (value) => {
  if (!value || value === '') return '';
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  const str = value.toString();
  
  // Se contiene virgola, è formato italiano: rimuovi punti (migliaia) e sostituisci virgola con punto
  if (str.includes(',')) {
    return str.replace(/\./g, '').replace(',', '.');
  }
  
  // Se contiene solo punti, conta per determinare il formato
  const dotCount = (str.match(/\./g) || []).length;
  
  if (dotCount === 1) {
    // Un solo punto = formato americano
    return str;
  } else if (dotCount > 1) {
    // Più punti = formato italiano
    return str.replace(/\./g, '');
  }
  
  // Nessun punto = numero intero
  return str;
};

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
      select: {
        id: true,
        playerId: true,
        startDate: true,
        endDate: true,
        salary: true,
        currency: true,
        contractType: true,
        status: true,
        signedDate: true,
        notes: true,
        teamId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        // Campi bonus
        imageRights: true,
        loyaltyBonus: true,
        signingBonus: true,
        accommodationBonus: true,
        carAllowance: true,
        netSalary: true,
        contractNumber: true,
        fifaId: true,
        leagueRegistrationId: true,
        taxRegime: true,
        taxRate: true,
        socialContributions: true,
        insuranceValue: true,
        insuranceProvider: true,
        medicalInsurance: true,
        autoRenewal: true,
        renewalConditions: true,
        renewalNoticeMonths: true,
        jurisdiction: true,
        arbitrationClause: true,
        confidentialityClause: true,
        nonCompeteClause: true,
        nonCompeteMonths: true,
        isMinor: true,
        parentalConsent: true,
        tutorName: true,
        tutorContact: true,
        educationClause: true,
        languageRequirement: true,
        trainingObligation: true,
        performanceTargets: true,
        kpiTargets: true,
        workPermitRequired: true,
        workPermitStatus: true,
        workPermitExpiry: true,
        visaRequired: true,
        visaType: true,
        relocationPackage: true,
        familySupport: true,
        languageLessons: true,
        mediaObligations: true,
        socialMediaClause: true,
        sponsorshipRights: true,
        medicalExamDate: true,
        medicalExamResult: true,
        medicalRestrictions: true,
        dopingConsent: true,
        lastReviewDate: true,
        nextReviewDate: true,
        complianceStatus: true,
        complianceNotes: true,
        priority: true,
        tags: true,
        internalNotes: true,
        // Campi esistenti
        contractRole: true,
        paymentFrequency: true,
        protocolNumber: true,
        depositDate: true,
        agentContact: true,
        loanFromClub: true,
        loanToClub: true,
        buyOption: true,
        obligationToBuy: true,
        buyPrice: true,
        responsibleUserId: true
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
    
    console.log('🔵 createContract chiamata con:', {
      teamId,
      userId,
      body: req.body
    });
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
      // Campi esistenti
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
      responsibleUserId,
      // Nuovi campi estesi
      netSalary,
      contractNumber,
      fifaId,
      leagueRegistrationId,
      imageRights,
      loyaltyBonus,
      signingBonus,
      accommodationBonus,
      carAllowance,
      taxRegime,
      taxRate,
      socialContributions,
      insuranceValue,
      insuranceProvider,
      medicalInsurance,
      autoRenewal,
      renewalConditions,
      renewalNoticeMonths,
      jurisdiction,
      arbitrationClause,
      confidentialityClause,
      nonCompeteClause,
      nonCompeteMonths,
      isMinor,
      parentalConsent,
      tutorName,
      tutorContact,
      educationClause,
      languageRequirement,
      trainingObligation,
      performanceTargets,
      kpiTargets,
      workPermitRequired,
      workPermitStatus,
      workPermitExpiry,
      visaRequired,
      visaType,
      relocationPackage,
      familySupport,
      languageLessons,
      mediaObligations,
      socialMediaClause,
      sponsorshipRights,
      medicalExamDate,
      medicalExamResult,
      medicalRestrictions,
      dopingConsent,
      lastReviewDate,
      nextReviewDate,
      complianceStatus,
      complianceNotes,
      priority,
      tags,
      internalNotes
    } = req.body;

    // Validazione dati richiesti
    console.log('🔍 Validazione campi obbligatori:', {
      playerId: !!playerId,
      startDate: !!startDate,
      endDate: !!endDate,
      salary: !!salary,
      contractType: !!contractType,
      values: { playerId, startDate, endDate, salary, contractType }
    });
    
    if (!playerId || !startDate || !endDate || !salary || !contractType) {
      const missingFields = [];
      if (!playerId) missingFields.push('playerId');
      if (!startDate) missingFields.push('startDate');
      if (!endDate) missingFields.push('endDate');
      if (!salary) missingFields.push('salary');
      if (!contractType) missingFields.push('contractType');
      
      return res.status(400).json({
        success: false,
        error: `Dati mancanti: ${missingFields.join(', ')} sono obbligatori`,
        missingFields,
        receivedData: { playerId, startDate, endDate, salary, contractType }
      });
    }

    // Validazione valore salary (max 9,999,999,999.99 per Decimal(12,2))
    const maxSalary = 9999999999.99;
    const parsedSalary = parseFloat(parseItalianNumber(salary));
    
    console.log('🔍 Debug salary:', {
      original: salary,
      type: typeof salary,
      parseItalianNumberResult: parseItalianNumber(salary),
      parsed: parsedSalary,
      maxAllowed: maxSalary,
      isOverLimit: parsedSalary > maxSalary,
      isNaN: isNaN(parsedSalary)
    });
    
    if (isNaN(parsedSalary) || parsedSalary <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valore stipendio non valido',
        details: `Valore ricevuto: ${salary}, Valore parsato: ${parsedSalary}`
      });
    }
    
    if (parsedSalary > maxSalary) {
      return res.status(400).json({
        success: false,
        error: `Valore stipendio troppo alto. Massimo consentito: €${maxSalary.toLocaleString('it-IT')}`,
        details: `Valore ricevuto: ${salary}, Valore parsato: ${parsedSalary}`
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
          salary: parseFloat(parseItalianNumber(salary)),
          currency,
          contractType,
          status,
          signedDate: signedDate ? new Date(signedDate) : null,
          notes,
          teamId,
          createdById: userId,
          updatedAt: new Date(),
          // Campi esistenti
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
          responsibleUserId: responsibleUserId ? parseInt(responsibleUserId) : null,
          // Nuovi campi estesi
          netSalary: netSalary !== undefined && netSalary !== null && netSalary !== '' ? parseFloat(parseItalianNumber(netSalary)) : (netSalary === 0 ? 0 : null),
          contractNumber: contractNumber && typeof contractNumber === 'string' && contractNumber.trim() !== '' ? contractNumber.trim() : null,
          fifaId: fifaId && typeof fifaId === 'string' && fifaId.trim() !== '' ? fifaId.trim() : null,
          leagueRegistrationId: leagueRegistrationId && typeof leagueRegistrationId === 'string' && leagueRegistrationId.trim() !== '' ? leagueRegistrationId.trim() : null,
          imageRights: imageRights !== undefined && imageRights !== null && imageRights !== '' ? parseFloat(parseItalianNumber(imageRights)) : (imageRights === 0 ? 0 : null),
          loyaltyBonus: loyaltyBonus !== undefined && loyaltyBonus !== null && loyaltyBonus !== '' ? parseFloat(parseItalianNumber(loyaltyBonus)) : (loyaltyBonus === 0 ? 0 : null),
          signingBonus: signingBonus !== undefined && signingBonus !== null && signingBonus !== '' ? parseFloat(parseItalianNumber(signingBonus)) : (signingBonus === 0 ? 0 : null),
          accommodationBonus: accommodationBonus !== undefined && accommodationBonus !== null && accommodationBonus !== '' ? parseFloat(parseItalianNumber(accommodationBonus)) : (accommodationBonus === 0 ? 0 : null),
          carAllowance: carAllowance !== undefined && carAllowance !== null && carAllowance !== '' ? parseFloat(parseItalianNumber(carAllowance)) : (carAllowance === 0 ? 0 : null),
          taxRegime: taxRegime || null,
          taxRate: taxRate ? parseFloat(taxRate) : null,
          socialContributions: socialContributions ? parseFloat(socialContributions) : null,
          insuranceValue: insuranceValue ? parseFloat(insuranceValue) : null,
          insuranceProvider: insuranceProvider || null,
          medicalInsurance: medicalInsurance || false,
          autoRenewal: autoRenewal || false,
          renewalConditions: renewalConditions || null,
          renewalNoticeMonths: renewalNoticeMonths ? parseInt(renewalNoticeMonths) : null,
          jurisdiction: jurisdiction || null,
          arbitrationClause: arbitrationClause || false,
          confidentialityClause: confidentialityClause || false,
          nonCompeteClause: nonCompeteClause || false,
          nonCompeteMonths: nonCompeteMonths ? parseInt(nonCompeteMonths) : null,
          isMinor: isMinor || false,
          parentalConsent: parentalConsent || false,
          tutorName: tutorName || null,
          tutorContact: tutorContact || null,
          educationClause: educationClause || false,
          languageRequirement: languageRequirement || null,
          trainingObligation: trainingObligation || false,
          performanceTargets: performanceTargets || null,
          kpiTargets: kpiTargets || null,
          workPermitRequired: workPermitRequired || false,
          workPermitStatus: workPermitStatus || null,
          workPermitExpiry: workPermitExpiry ? new Date(workPermitExpiry) : null,
          visaRequired: visaRequired || false,
          visaType: visaType || null,
          relocationPackage: relocationPackage ? parseFloat(relocationPackage) : null,
          familySupport: familySupport || false,
          languageLessons: languageLessons || false,
          mediaObligations: mediaObligations || null,
          socialMediaClause: socialMediaClause || null,
          sponsorshipRights: sponsorshipRights || false,
          medicalExamDate: medicalExamDate ? new Date(medicalExamDate) : null,
          medicalExamResult: medicalExamResult || null,
          medicalRestrictions: medicalRestrictions || null,
          dopingConsent: dopingConsent || false,
          lastReviewDate: lastReviewDate ? new Date(lastReviewDate) : null,
          nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
          complianceStatus: complianceStatus || 'PENDING',
          complianceNotes: complianceNotes || null,
          priority: priority || 'NORMAL',
          tags: tags || [],
          internalNotes: internalNotes || null
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
    // Gestione violazione vincolo univoco su (teamId, contractNumber)
    if (error && error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Numero contratto già esistente per il team',
        details: error.meta?.target || 'contracts_team_contractNumber_key'
      });
    }
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
      contractData.salary = parseFloat(parseItalianNumber(contractData.salary));
    }
    if (contractData.buyPrice && contractData.buyPrice !== '') {
      contractData.buyPrice = parseFloat(parseItalianNumber(contractData.buyPrice));
    }
    if (contractData.responsibleUserId && contractData.responsibleUserId !== '') {
      contractData.responsibleUserId = parseInt(contractData.responsibleUserId);
    }
    
    // Converte nuovi campi numerici - gestisce anche i valori 0
    if (contractData.netSalary !== undefined && contractData.netSalary !== null && contractData.netSalary !== '') {
      contractData.netSalary = parseFloat(parseItalianNumber(contractData.netSalary));
    } else if (contractData.netSalary === 0) {
      contractData.netSalary = 0;
    }
    if (contractData.imageRights !== undefined && contractData.imageRights !== null && contractData.imageRights !== '') {
      contractData.imageRights = parseFloat(parseItalianNumber(contractData.imageRights));
    } else if (contractData.imageRights === 0) {
      contractData.imageRights = 0;
    }
    if (contractData.loyaltyBonus !== undefined && contractData.loyaltyBonus !== null && contractData.loyaltyBonus !== '') {
      contractData.loyaltyBonus = parseFloat(parseItalianNumber(contractData.loyaltyBonus));
    } else if (contractData.loyaltyBonus === 0) {
      contractData.loyaltyBonus = 0;
    }
    if (contractData.signingBonus !== undefined && contractData.signingBonus !== null && contractData.signingBonus !== '') {
      contractData.signingBonus = parseFloat(parseItalianNumber(contractData.signingBonus));
    } else if (contractData.signingBonus === 0) {
      contractData.signingBonus = 0;
    }
    if (contractData.accommodationBonus !== undefined && contractData.accommodationBonus !== null && contractData.accommodationBonus !== '') {
      contractData.accommodationBonus = parseFloat(parseItalianNumber(contractData.accommodationBonus));
    } else if (contractData.accommodationBonus === 0) {
      contractData.accommodationBonus = 0;
    }
    if (contractData.carAllowance !== undefined && contractData.carAllowance !== null && contractData.carAllowance !== '') {
      contractData.carAllowance = parseFloat(parseItalianNumber(contractData.carAllowance));
    } else if (contractData.carAllowance === 0) {
      contractData.carAllowance = 0;
    }
    if (contractData.taxRate && contractData.taxRate !== '') {
      contractData.taxRate = parseFloat(contractData.taxRate);
    }
    if (contractData.socialContributions && contractData.socialContributions !== '') {
      contractData.socialContributions = parseFloat(contractData.socialContributions);
    }
    if (contractData.insuranceValue && contractData.insuranceValue !== '') {
      contractData.insuranceValue = parseFloat(contractData.insuranceValue);
    }
    if (contractData.relocationPackage && contractData.relocationPackage !== '') {
      contractData.relocationPackage = parseFloat(contractData.relocationPackage);
    }
    
    // Converte campi interi
    if (contractData.renewalNoticeMonths && contractData.renewalNoticeMonths !== '') {
      contractData.renewalNoticeMonths = parseInt(contractData.renewalNoticeMonths);
    }
    if (contractData.nonCompeteMonths && contractData.nonCompeteMonths !== '') {
      contractData.nonCompeteMonths = parseInt(contractData.nonCompeteMonths);
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
    // Normalizza identificativi: stringhe vuote -> null, trim
    if (contractData.contractNumber !== undefined) {
      if (contractData.contractNumber === null) {
        // leave as null
      } else {
        const v = String(contractData.contractNumber).trim();
        contractData.contractNumber = v === '' ? null : v;
      }
    }
    if (contractData.fifaId !== undefined) {
      if (contractData.fifaId === null) {
        // leave as null
      } else {
        const v = String(contractData.fifaId).trim();
        contractData.fifaId = v === '' ? null : v;
      }
    }
    if (contractData.leagueRegistrationId !== undefined) {
      if (contractData.leagueRegistrationId === null) {
        // leave as null
      } else {
        const v = String(contractData.leagueRegistrationId).trim();
        contractData.leagueRegistrationId = v === '' ? null : v;
      }
    }
    
    // Converte date opzionali se presenti (solo se sono stringhe)
    if (contractData.depositDate && typeof contractData.depositDate === 'string') {
      contractData.depositDate = new Date(contractData.depositDate);
    }
    if (contractData.workPermitExpiry && typeof contractData.workPermitExpiry === 'string') {
      contractData.workPermitExpiry = new Date(contractData.workPermitExpiry);
    }
    if (contractData.medicalExamDate && typeof contractData.medicalExamDate === 'string') {
      contractData.medicalExamDate = new Date(contractData.medicalExamDate);
    }
    if (contractData.lastReviewDate && typeof contractData.lastReviewDate === 'string') {
      contractData.lastReviewDate = new Date(contractData.lastReviewDate);
    }
    if (contractData.nextReviewDate && typeof contractData.nextReviewDate === 'string') {
      contractData.nextReviewDate = new Date(contractData.nextReviewDate);
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
    
    // Gestisce nuovi campi booleani
    if (contractData.medicalInsurance !== undefined) contractData.medicalInsurance = Boolean(contractData.medicalInsurance);
    if (contractData.autoRenewal !== undefined) contractData.autoRenewal = Boolean(contractData.autoRenewal);
    if (contractData.arbitrationClause !== undefined) contractData.arbitrationClause = Boolean(contractData.arbitrationClause);
    if (contractData.confidentialityClause !== undefined) contractData.confidentialityClause = Boolean(contractData.confidentialityClause);
    if (contractData.nonCompeteClause !== undefined) contractData.nonCompeteClause = Boolean(contractData.nonCompeteClause);
    if (contractData.isMinor !== undefined) contractData.isMinor = Boolean(contractData.isMinor);
    if (contractData.parentalConsent !== undefined) contractData.parentalConsent = Boolean(contractData.parentalConsent);
    if (contractData.educationClause !== undefined) contractData.educationClause = Boolean(contractData.educationClause);
    if (contractData.trainingObligation !== undefined) contractData.trainingObligation = Boolean(contractData.trainingObligation);
    if (contractData.workPermitRequired !== undefined) contractData.workPermitRequired = Boolean(contractData.workPermitRequired);
    if (contractData.visaRequired !== undefined) contractData.visaRequired = Boolean(contractData.visaRequired);
    if (contractData.familySupport !== undefined) contractData.familySupport = Boolean(contractData.familySupport);
    if (contractData.languageLessons !== undefined) contractData.languageLessons = Boolean(contractData.languageLessons);
    if (contractData.sponsorshipRights !== undefined) contractData.sponsorshipRights = Boolean(contractData.sponsorshipRights);
    if (contractData.dopingConsent !== undefined) contractData.dopingConsent = Boolean(contractData.dopingConsent);
    
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
    if (error && error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Numero contratto già esistente per il team',
        details: error.meta?.target || 'contracts_team_contractNumber_key'
      });
    }
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
      salary: parseFloat(parseItalianNumber(renewalData.salary)),
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

    // Elimina in transazione (cascade per le relazioni)
    await prisma.$transaction(async (tx) => {
      // Elimina emendamenti (amendments)
      await tx.contract_amendments.deleteMany({
        where: { contractId: parseInt(id) }
      });

      // Elimina file del contratto
      await tx.contract_files.deleteMany({
        where: { contractId: parseInt(id) }
      });

      // Elimina clausole
      await tx.contract_clauses.deleteMany({
        where: { contractId: parseInt(id) }
      });

      // Elimina schedule di pagamento
      await tx.contract_payment_schedule.deleteMany({
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

/**
 * 📊 Ottieni KPI per dashboard contratti
 */
const getDashboardKPIs = async (req, res) => {
  try {
    const { teamId } = req.context;
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'TeamId non configurato per questo utente'
      });
    }

    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Calcola KPI attuali
    const [
      totalValue,
      activeContracts,
      expiringContracts,
      renewalsThisMonth,
      pendingRenewals
    ] = await Promise.all([
      // Valore totale contratti attivi
      prisma.contracts.aggregate({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
          startDate: { lte: currentDate },
          endDate: { gte: currentDate }
        },
        _sum: { salary: true }
      }),
      
      // Contratti attivi
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] }
        }
      }),
      
      // Contratti in scadenza (90 giorni)
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED'] },
          endDate: {
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            gte: currentDate
          }
        }
      }),
      
      // Rinnovi questo mese
      prisma.contracts.count({
        where: {
          teamId,
          status: 'RENEWED',
          updatedAt: {
            gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          }
        }
      }),
      
      // Contratti in scadenza (30 giorni) - da rinnovare
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED'] },
          endDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: currentDate
          }
        }
      })
    ]);

    // Calcola KPI del mese scorso per i trend
    const [
      lastMonthTotalValue,
      lastMonthActiveContracts,
      lastMonthExpiringContracts,
      lastMonthRenewals,
      lastMonthPendingRenewals
    ] = await Promise.all([
      prisma.contracts.aggregate({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
          startDate: { lte: oneMonthAgo },
          endDate: { gte: oneMonthAgo }
        },
        _sum: { salary: true }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
          updatedAt: { lte: oneMonthAgo }
        }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED'] },
          endDate: {
            lte: new Date(oneMonthAgo.getTime() + 90 * 24 * 60 * 60 * 1000),
            gte: oneMonthAgo
          }
        }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: 'RENEWED',
          updatedAt: {
            gte: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 1),
            lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          }
        }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED'] },
          endDate: {
            lte: new Date(oneMonthAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
            gte: oneMonthAgo
          }
        }
      })
    ]);

    // Calcola trend percentuali
    const calculateTrend = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalValueAmount = parseFloat(totalValue._sum.salary || 0);
    const lastMonthTotalValueAmount = parseFloat(lastMonthTotalValue._sum.salary || 0);
    const averageSalary = activeContracts > 0 ? totalValueAmount / activeContracts : 0;
    const lastMonthAverageSalary = lastMonthActiveContracts > 0 ? lastMonthTotalValueAmount / lastMonthActiveContracts : 0;

    res.json({
      success: true,
      data: {
        totalValue: totalValueAmount,
        totalValueTrend: calculateTrend(totalValueAmount, lastMonthTotalValueAmount),
        activeContracts,
        activeContractsTrend: calculateTrend(activeContracts, lastMonthActiveContracts),
        expiringContracts,
        expiringContractsTrend: calculateTrend(expiringContracts, lastMonthExpiringContracts),
        averageSalary,
        averageSalaryTrend: calculateTrend(averageSalary, lastMonthAverageSalary),
        renewalsThisMonth,
        renewalsThisMonthTrend: calculateTrend(renewalsThisMonth, lastMonthRenewals),
        pendingRenewals,
        pendingRenewalsTrend: calculateTrend(pendingRenewals, lastMonthPendingRenewals)
      }
    });

  } catch (error) {
    console.error('❌ Errore nel recupero KPI dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 📈 Ottieni trend per dashboard contratti
 */
const getDashboardTrends = async (req, res) => {
  try {
    const { teamId } = req.context;
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'TeamId non configurato per questo utente'
      });
    }

    // Genera dati per gli ultimi 12 mesi
    const trends = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      // Calcola valore totale e stipendio medio per il mese
      const monthStats = await prisma.contracts.aggregate({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart }
        },
        _sum: { salary: true },
        _avg: { salary: true },
        _count: { id: true }
      });
      
      trends.push({
        month: monthDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
        totalValue: parseFloat(monthStats._sum.salary || 0),
        averageSalary: parseFloat(monthStats._avg.salary || 0),
        contractCount: monthStats._count.id
      });
    }

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    console.error('❌ Errore nel recupero trend dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 📊 Ottieni distribuzioni per dashboard contratti
 */
const getDashboardDistributions = async (req, res) => {
  try {
    const { teamId } = req.context;
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'TeamId non configurato per questo utente'
      });
    }

    const currentDate = new Date();

    // Distribuzione per ruolo
    const byRole = await prisma.contracts.groupBy({
      by: ['contractRole'],
      where: {
        teamId,
        status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
        startDate: { lte: currentDate },
        endDate: { gte: currentDate }
      },
      _sum: { salary: true },
      _count: { id: true }
    });

    // Distribuzione per status
    const byStatus = await prisma.contracts.groupBy({
      by: ['status'],
      where: { teamId },
      _count: { id: true }
    });

    // Calcola percentuali per status
    const totalContracts = byStatus.reduce((sum, item) => sum + item._count.id, 0);
    const byStatusWithPercentage = byStatus.map(item => ({
      status: item.status,
      count: item._count.id,
      percentage: totalContracts > 0 ? Math.round((item._count.id / totalContracts) * 100) : 0
    }));

    // Calcola percentuali per ruolo
    const totalRoleContracts = byRole.reduce((sum, item) => sum + item._count.id, 0);
    const byRoleWithPercentage = byRole.map(item => ({
      role: item.contractRole || 'Non specificato',
      totalSalary: parseFloat(item._sum.salary || 0),
      count: item._count.id,
      percentage: totalRoleContracts > 0 ? Math.round((item._count.id / totalRoleContracts) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        byRole: byRoleWithPercentage,
        byStatus: byStatusWithPercentage
      }
    });

  } catch (error) {
    console.error('❌ Errore nel recupero distribuzioni dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * ⏰ Ottieni contratti in scadenza per dashboard
 */
const getDashboardExpiring = async (req, res) => {
  try {
    const { teamId } = req.context;
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'TeamId non configurato per questo utente'
      });
    }

    const currentDate = new Date();

    const expiringContracts = await prisma.contracts.findMany({
      where: {
        teamId,
        status: { in: ['ACTIVE', 'RENEWED'] },
        endDate: {
          gte: currentDate  // Solo contratti non ancora scaduti
        }
      },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      },
      orderBy: { endDate: 'asc' }
    });

    const formattedContracts = expiringContracts.map(contract => ({
      id: contract.id,
      playerName: `${contract.players.firstName} ${contract.players.lastName}`,
      role: contract.contractRole || contract.players.position || 'Non specificato',
      salary: contract.salary,
      currency: contract.currency,
      endDate: contract.endDate,
      status: contract.status
    }));

    res.json({
      success: true,
      data: formattedContracts
    });

  } catch (error) {
    console.error('❌ Errore nel recupero contratti in scadenza:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 🏆 Ottieni top giocatori per stipendio
 */
const getDashboardTopPlayers = async (req, res) => {
  try {
    const { teamId } = req.context;
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'TeamId non configurato per questo utente'
      });
    }

    const currentDate = new Date();

    const topPlayers = await prisma.contracts.findMany({
      where: {
        teamId,
        status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
        startDate: { lte: currentDate },
        endDate: { gte: currentDate }
      },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      },
      orderBy: { salary: 'desc' },
      take: 10
    });

    const formattedPlayers = topPlayers.map(contract => ({
      id: contract.id,
      playerName: `${contract.players.firstName} ${contract.players.lastName}`,
      role: contract.contractRole || contract.players.position || 'Non specificato',
      salary: contract.salary,
      currency: contract.currency,
      status: contract.status
    }));

    res.json({
      success: true,
      data: formattedPlayers
    });

  } catch (error) {
    console.error('❌ Errore nel recupero top giocatori:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

/**
 * 📊 Ottieni tutti i dati della dashboard in una singola chiamata (OTTIMIZZATO)
 */
const getDashboardAll = async (req, res) => {
  try {
    const { teamId } = req.context;
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'TeamId non configurato per questo utente'
      });
    }

    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Esegui tutte le query in parallelo per massima performance
    const [
      // KPI
      totalValue,
      activeContracts,
      expiringContracts,
      renewalsThisMonth,
      pendingRenewals,
      lastMonthTotalValue,
      lastMonthActiveContracts,
      lastMonthExpiringContracts,
      lastMonthRenewals,
      lastMonthPendingRenewals,
      
      // Trends (ultimi 12 mesi)
      trendsData,
      
      // Distribuzioni
      byRole,
      byStatus,
      
      // Contratti in scadenza
      expiringContractsData,
      
      // Top players
      topPlayersData,
      
      // Uscite mensili
      monthlyExpensesData
    ] = await Promise.all([
      // KPI attuali
      prisma.contracts.aggregate({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
          startDate: { lte: currentDate },
          endDate: { gte: currentDate }
        },
        _sum: { salary: true }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] }
        }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED'] },
          endDate: {
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            gte: currentDate
          }
        }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: 'RENEWED',
          updatedAt: {
            gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          }
        }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED'] },
          endDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: currentDate
          }
        }
      }),
      
      // KPI del mese scorso
      prisma.contracts.aggregate({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
          startDate: { lte: oneMonthAgo },
          endDate: { gte: oneMonthAgo }
        },
        _sum: { salary: true }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
          updatedAt: { lte: oneMonthAgo }
        }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED'] },
          endDate: {
            lte: new Date(oneMonthAgo.getTime() + 90 * 24 * 60 * 60 * 1000),
            gte: oneMonthAgo
          }
        }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: 'RENEWED',
          updatedAt: {
            gte: new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 1),
            lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          }
        }
      }),
      
      prisma.contracts.count({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED'] },
          endDate: {
            lte: new Date(oneMonthAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
            gte: oneMonthAgo
          }
        }
      }),
      
      // Trends (genera dati per 12 mesi)
      (async () => {
        const trends = [];
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date();
          monthDate.setMonth(monthDate.getMonth() - i);
          
          const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
          
          const monthStats = await prisma.contracts.aggregate({
            where: {
              teamId,
              status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
              startDate: { lte: monthEnd },
              endDate: { gte: monthStart }
            },
            _sum: { salary: true },
            _avg: { salary: true },
            _count: { id: true }
          });
          
          trends.push({
            month: monthDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
            totalValue: parseFloat(monthStats._sum.salary || 0),
            averageSalary: parseFloat(monthStats._avg.salary || 0),
            contractCount: monthStats._count.id
          });
        }
        return trends;
      })(),
      
      // Distribuzioni per posizione del giocatore
      prisma.contracts.findMany({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
          startDate: { lte: currentDate },
          endDate: { gte: currentDate }
        },
        select: {
          salary: true,
          players: {
            select: {
              position: true
            }
          }
        }
      }),
      
      prisma.contracts.groupBy({
        by: ['status'],
        where: { teamId },
        _count: { id: true }
      }),
      
      // Contratti in scadenza
      prisma.contracts.findMany({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED'] },
          endDate: { gte: currentDate }
        },
        include: {
          players: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true
            }
          }
        },
        orderBy: { endDate: 'asc' }
      }),
      
      // Top players
      prisma.contracts.findMany({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
          startDate: { lte: currentDate },
          endDate: { gte: currentDate }
        },
        include: {
          players: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true
            }
          }
        },
        orderBy: { salary: 'desc' },
        take: 10
      }),
      
      // Uscite mensili
      (async () => {
        const monthlyExpenses = [];
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date();
          monthDate.setMonth(currentDate.getMonth() - i);
          
          const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
          
          const contracts = await prisma.contracts.findMany({
            where: {
              teamId,
              status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
              startDate: { lte: monthEnd },
              endDate: { gte: monthStart }
            },
            select: {
              salary: true,
              signingBonus: true,
              loyaltyBonus: true,
              imageRights: true,
              accommodationBonus: true,
              carAllowance: true
            }
          });

          const totalExpenses = contracts.reduce((sum, contract) => {
            const monthlySalary = Number(contract.salary) / 12;
            const signingBonus = Number(contract.signingBonus || 0);
            const loyaltyBonus = Number(contract.loyaltyBonus || 0);
            const imageRights = Number(contract.imageRights || 0);
            const accommodationBonus = Number(contract.accommodationBonus || 0);
            const carAllowance = Number(contract.carAllowance || 0);
            
            return sum + monthlySalary + (signingBonus / 12) + (loyaltyBonus / 12) + 
                   (imageRights / 12) + accommodationBonus + carAllowance;
          }, 0);

          monthlyExpenses.push({
            month: monthDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
            totalExpenses: Math.round(totalExpenses)
          });
        }
        return monthlyExpenses;
      })()
    ]);

    // Calcola trend percentuali
    const calculateTrend = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalValueAmount = parseFloat(totalValue._sum.salary || 0);
    const lastMonthTotalValueAmount = parseFloat(lastMonthTotalValue._sum.salary || 0);
    const averageSalary = activeContracts > 0 ? totalValueAmount / activeContracts : 0;
    const lastMonthAverageSalary = lastMonthActiveContracts > 0 ? lastMonthTotalValueAmount / lastMonthActiveContracts : 0;

    // Calcola percentuali per status
    const totalContracts = byStatus.reduce((sum, item) => sum + item._count.id, 0);
    const byStatusWithPercentage = byStatus.map(item => ({
      status: item.status,
      count: item._count.id,
      percentage: totalContracts > 0 ? Math.round((item._count.id / totalContracts) * 100) : 0
    }));

    // Calcola distribuzione per posizione del giocatore
    const positionStats = {};
    byRole.forEach(contract => {
      const position = contract.players?.position || 'Non specificato';
      if (!positionStats[position]) {
        positionStats[position] = {
          totalSalary: 0,
          count: 0
        };
      }
      positionStats[position].totalSalary += parseFloat(contract.salary || 0);
      positionStats[position].count += 1;
    });

    const totalRoleContracts = Object.values(positionStats).reduce((sum, stat) => sum + stat.count, 0);
    const byRoleWithPercentage = Object.entries(positionStats).map(([position, stats]) => ({
      role: position,
      totalSalary: stats.totalSalary,
      count: stats.count,
      percentage: totalRoleContracts > 0 ? Math.round((stats.count / totalRoleContracts) * 100) : 0
    }));

    // Formatta contratti in scadenza
    const formattedExpiring = expiringContractsData.map(contract => ({
      id: contract.id,
      playerName: `${contract.players.firstName} ${contract.players.lastName}`,
      role: contract.contractRole || contract.players.position || 'Non specificato',
      salary: contract.salary,
      currency: contract.currency,
      endDate: contract.endDate,
      status: contract.status
    }));

    // Formatta top players
    const formattedTopPlayers = topPlayersData.map(contract => ({
      id: contract.id,
      playerName: `${contract.players.firstName} ${contract.players.lastName}`,
      role: contract.contractRole || contract.players.position || 'Non specificato',
      salary: contract.salary,
      currency: contract.currency,
      status: contract.status
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          totalValue: totalValueAmount,
          totalValueTrend: calculateTrend(totalValueAmount, lastMonthTotalValueAmount),
          activeContracts,
          activeContractsTrend: calculateTrend(activeContracts, lastMonthActiveContracts),
          expiringContracts,
          expiringContractsTrend: calculateTrend(expiringContracts, lastMonthExpiringContracts),
          averageSalary,
          averageSalaryTrend: calculateTrend(averageSalary, lastMonthAverageSalary),
          renewalsThisMonth,
          renewalsThisMonthTrend: calculateTrend(renewalsThisMonth, lastMonthRenewals),
          pendingRenewals,
          pendingRenewalsTrend: calculateTrend(pendingRenewals, lastMonthPendingRenewals)
        },
        trends: trendsData,
        distributions: {
          byRole: byRoleWithPercentage,
          byStatus: byStatusWithPercentage
        },
        expiring: formattedExpiring,
        topPlayers: formattedTopPlayers,
        monthlyExpenses: monthlyExpensesData
      }
    });

  } catch (error) {
    console.error('❌ Errore getDashboardAll:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
};

/**
 * 💰 Ottieni uscite mensili per dashboard
 */
const getDashboardExpenses = async (req, res) => {
  try {
    const { teamId } = req.context;
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'TeamId non configurato per questo utente'
      });
    }

    const currentDate = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);

    // Genera array di 12 mesi
    const monthlyExpenses = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(currentDate.getMonth() - i);
      
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      // Calcola uscite totali per il mese (stipendi + bonus)
      const contracts = await prisma.contracts.findMany({
        where: {
          teamId,
          status: { in: ['ACTIVE', 'RENEWED', 'DRAFT'] },
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart }
        },
        select: {
          salary: true,
          signingBonus: true,
          loyaltyBonus: true,
          imageRights: true,
          accommodationBonus: true,
          carAllowance: true
        }
      });

      const totalExpenses = contracts.reduce((sum, contract) => {
        const monthlySalary = Number(contract.salary) / 12;
        const signingBonus = Number(contract.signingBonus || 0);
        const loyaltyBonus = Number(contract.loyaltyBonus || 0);
        const imageRights = Number(contract.imageRights || 0);
        const accommodationBonus = Number(contract.accommodationBonus || 0);
        const carAllowance = Number(contract.carAllowance || 0);
        
        return sum + monthlySalary + (signingBonus / 12) + (loyaltyBonus / 12) + 
               (imageRights / 12) + accommodationBonus + carAllowance;
      }, 0);

      monthlyExpenses.push({
        month: monthDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
        totalExpenses: Math.round(totalExpenses)
      });
    }

    res.json({
      success: true,
      data: monthlyExpenses
    });

  } catch (error) {
    console.error('❌ Errore getDashboardExpenses:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
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
  getPlayerContractHistory,
  getDashboardKPIs,
  getDashboardTrends,
  getDashboardDistributions,
  getDashboardExpiring,
  getDashboardTopPlayers,
  getDashboardExpenses,
  getDashboardAll
};

// Endpoint temporaneo per correggere i dati esistenti
const fixExistingContracts = async (req, res) => {
  try {
    const { teamId } = req.context;
    
    console.log('🔧 Inizio correzione contratti esistenti per team:', teamId);
    
    // Recupera tutti i contratti del team
    const contracts = await prisma.contracts.findMany({
      where: { teamId },
      select: {
        id: true,
        salary: true,
        netSalary: true,
        buyPrice: true,
        imageRights: true,
        loyaltyBonus: true,
        signingBonus: true,
        accommodationBonus: true,
        carAllowance: true
      }
    });
    
    console.log(`📊 Trovati ${contracts.length} contratti da verificare`);
    
    let correctedCount = 0;
    
    for (const contract of contracts) {
      const updates = {};
      let needsUpdate = false;
      
      // Controlla se i valori sono troppo grandi (probabilmente gonfiati)
      if (contract.salary && contract.salary > 1000000) {
        // Se lo stipendio è sopra 1 milione, probabilmente è gonfiato
        // Dividiamo per 100 per correggere (assumendo gonfiaggio 100x)
        const corrected = Math.round(contract.salary / 100);
        updates.salary = corrected;
        needsUpdate = true;
        console.log(`🔧 Contratto ${contract.id}: salary ${contract.salary} -> ${corrected} (correzione gonfiaggio)`);
      }
      
      if (contract.netSalary && contract.netSalary > 1000000) {
        const corrected = Math.round(contract.netSalary / 100);
        updates.netSalary = corrected;
        needsUpdate = true;
        console.log(`🔧 Contratto ${contract.id}: netSalary ${contract.netSalary} -> ${corrected} (correzione gonfiaggio)`);
      }
      
      if (contract.buyPrice && contract.buyPrice > 1000000) {
        const corrected = Math.round(contract.buyPrice / 100);
        updates.buyPrice = corrected;
        needsUpdate = true;
        console.log(`🔧 Contratto ${contract.id}: buyPrice ${contract.buyPrice} -> ${corrected} (correzione gonfiaggio)`);
      }
      
      if (contract.imageRights && contract.imageRights > 1000000) {
        const corrected = Math.round(contract.imageRights / 100);
        updates.imageRights = corrected;
        needsUpdate = true;
        console.log(`🔧 Contratto ${contract.id}: imageRights ${contract.imageRights} -> ${corrected} (correzione gonfiaggio)`);
      }
      
      if (contract.loyaltyBonus && contract.loyaltyBonus > 1000000) {
        const corrected = Math.round(contract.loyaltyBonus / 100);
        updates.loyaltyBonus = corrected;
        needsUpdate = true;
        console.log(`🔧 Contratto ${contract.id}: loyaltyBonus ${contract.loyaltyBonus} -> ${corrected} (correzione gonfiaggio)`);
      }
      
      if (contract.signingBonus && contract.signingBonus > 1000000) {
        const corrected = Math.round(contract.signingBonus / 100);
        updates.signingBonus = corrected;
        needsUpdate = true;
        console.log(`🔧 Contratto ${contract.id}: signingBonus ${contract.signingBonus} -> ${corrected} (correzione gonfiaggio)`);
      }
      
      if (contract.accommodationBonus && contract.accommodationBonus > 1000000) {
        const corrected = Math.round(contract.accommodationBonus / 100);
        updates.accommodationBonus = corrected;
        needsUpdate = true;
        console.log(`🔧 Contratto ${contract.id}: accommodationBonus ${contract.accommodationBonus} -> ${corrected} (correzione gonfiaggio)`);
      }
      
      if (contract.carAllowance && contract.carAllowance > 1000000) {
        const corrected = Math.round(contract.carAllowance / 100);
        updates.carAllowance = corrected;
        needsUpdate = true;
        console.log(`🔧 Contratto ${contract.id}: carAllowance ${contract.carAllowance} -> ${corrected} (correzione gonfiaggio)`);
      }
      
      if (needsUpdate) {
        await prisma.contracts.update({
          where: { id: contract.id },
          data: updates
        });
        correctedCount++;
      }
    }
    
    console.log(`✅ Correzione completata: ${correctedCount} contratti aggiornati`);
    
    res.json({
      success: true,
      message: `Correzione gonfiaggio completata: ${correctedCount} contratti aggiornati su ${contracts.length} totali`,
      corrected: correctedCount,
      total: contracts.length,
      description: 'Valori sopra 1 milione sono stati divisi per 100 per correggere il gonfiaggio'
    });
    
  } catch (error) {
    console.error('❌ Errore durante la correzione dei contratti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la correzione dei contratti',
      error: error.message
    });
  }
};

// Aggiungi la funzione al module.exports
module.exports.fixExistingContracts = fixExistingContracts;

