const express = require('express');
const { PrismaClient } = require('../../../prisma/generated/client');
const XLSX = require('xlsx');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/contracts/summary - Recupera il riepilogo dei contratti
router.get('/summary', async (req, res) => {
  try {
    const { teamId } = req.query;

    if (!teamId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Team ID richiesto' 
      });
    }

    console.log('🔵 Contracts Summary: Recupero contratti per teamId:', teamId);

    // Recupera tutti i contratti con i dati del giocatore
    const contracts = await prisma.contracts.findMany({
      where: {
        teamId: teamId
      },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('🔵 Contracts Summary: Trovati', contracts.length, 'contratti');

    // Processa ogni contratto per calcolare i dati del riepilogo
    const summaryData = contracts.map(contract => {
      const playerName = contract.players 
        ? `${contract.players.firstName} ${contract.players.lastName}`
        : 'Giocatore non trovato';

      // Calcola i contributi fiscali
      const grossSalary = parseFloat(contract.salary) || 0;
      const netSalary = contract.netSalary ? parseFloat(contract.netSalary) : 0;
      
      // Recupera le aliquote fiscali per il contratto
      let inpsRate = 0;
      let inailRate = 0;
      let ffcRate = 6.25; // FFC è sempre 6.25%

      // Determina le aliquote in base al tipo di contratto
      if (contract.contractType === 'PROFESSIONAL') {
        inpsRate = 29.58;
        inailRate = 7.9;
      } else if (contract.contractType === 'APPRENTICESHIP') {
        inpsRate = 11.61;
        inailRate = 0;
      }

      // Calcola i contributi
      const inpsContributions = (grossSalary * inpsRate) / 100;
      const inailContributions = (grossSalary * inailRate) / 100;
      const ffcContributions = (grossSalary * ffcRate) / 100;
      
      // Se netSalary è null, calcolalo dal lordo
      const calculatedNetSalary = netSalary || (grossSalary - inpsContributions - inailContributions - ffcContributions);

      // Calcola i bonus e indennità
      const imageRights = parseFloat(contract.imageRights) || 0;
      const loyaltyBonus = parseFloat(contract.loyaltyBonus) || 0;
      const signingBonus = parseFloat(contract.signingBonus) || 0;
      const accommodationBonus = parseFloat(contract.accommodationBonus) || 0;
      const carAllowance = parseFloat(contract.carAllowance) || 0;
      // const transferAllowance = parseFloat(contract.transferAllowance) || 0; // Campo non presente nel modello

      // Calcola il totale netto comprensivo di indennità di trasferta
      const totalBonuses = imageRights + loyaltyBonus + signingBonus + accommodationBonus + carAllowance;
      const netTotal = calculatedNetSalary + totalBonuses;

      // Calcola il totale lordo
      const totalGross = grossSalary + totalBonuses;

      return {
        id: contract.id,
        protocolNumber: contract.protocolNumber || `CTR-${contract.id.toString().slice(-6)}`,
        status: contract.status,
        playerName: playerName,
        birthDate: contract.players?.dateOfBirth,
        startDate: contract.startDate,
        endDate: contract.endDate,
        grossSalary: grossSalary,
        netSalary: calculatedNetSalary,
        netTotal: netTotal,
        totalGross: totalGross,
        inpsContributions: inpsContributions,
        inailContributions: inailContributions,
        ffcContributions: ffcContributions,
        contractPremiums: loyaltyBonus + signingBonus, // Premi del contratto
        exitIncentive: 0, // Da implementare se necessario
        allowances: carAllowance, // Indennità varie (solo car allowance per ora)
        imageRights: imageRights,
        accommodation: accommodationBonus,
        agentName: contract.agentContact || 'Non specificato',
        contractType: contract.contractType,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt
      };
    });

    console.log('🔵 Contracts Summary: Dati processati:', summaryData.length, 'record');

    res.json({
      success: true,
      data: summaryData,
      count: summaryData.length
    });

  } catch (error) {
    console.error('🔴 Contracts Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del riepilogo contratti',
      error: error.message
    });
  }
});

// GET /api/contracts/export - Esporta il riepilogo in Excel
router.get('/export', async (req, res) => {
  try {
    const { teamId } = req.query;

    if (!teamId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Team ID richiesto' 
      });
    }

    console.log('🔵 Contracts Export: Esportazione Excel per teamId:', teamId);

    // Recupera i dati del riepilogo
    const summaryResponse = await fetch(`http://localhost:3001/api/contracts-summary/summary?teamId=${teamId}`);
    const summaryData = await summaryResponse.json();

    if (!summaryData.success) {
      throw new Error('Errore nel recupero dei dati per l\'esportazione');
    }

    const contracts = summaryData.data;

    // Prepara i dati per Excel
    const excelData = contracts.map(contract => ({
      'Protocollo': contract.protocolNumber,
      'STATUS': contract.status,
      'Nominativo': contract.playerName,
      'Data di nascita': contract.birthDate ? new Date(contract.birthDate).toLocaleDateString('it-IT') : '',
      'Data scadenza contratto': contract.endDate ? new Date(contract.endDate).toLocaleDateString('it-IT') : '',
      'NETTO COMPRENSIVO DI INDENNITA\' DI TRASFERTA': contract.netTotal,
      'Emolumenti CONTRATTI': contract.grossSalary,
      'Contributi INPS': contract.inpsContributions,
      'Contributi INAIL': contract.inailContributions,
      'FFC': contract.ffcContributions,
      'Premi contratto': contract.contractPremiums,
      'INCENTIVO ALL\'ESODO': contract.exitIncentive,
      'Indennità': contract.allowances,
      'Diritti d\'immagine': contract.imageRights,
      'ALLOGGIO': contract.accommodation,
      'PROCURATORE': contract.agentName
    }));

    // Crea il workbook Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Imposta la larghezza delle colonne
    const columnWidths = [
      { wch: 15 }, // Protocollo
      { wch: 12 }, // STATUS
      { wch: 25 }, // Nominativo
      { wch: 15 }, // Data di nascita
      { wch: 20 }, // Data scadenza contratto
      { wch: 25 }, // NETTO COMPRENSIVO
      { wch: 20 }, // Emolumenti CONTRATTI
      { wch: 18 }, // Contributi INPS
      { wch: 18 }, // Contributi INAIL
      { wch: 12 }, // FFC
      { wch: 18 }, // Premi contratto
      { wch: 20 }, // INCENTIVO ALL'ESODO
      { wch: 15 }, // Indennità
      { wch: 18 }, // Diritti d'immagine
      { wch: 15 }, // ALLOGGIO
      { wch: 20 }  // PROCURATORE
    ];
    worksheet['!cols'] = columnWidths;

    // Aggiungi il foglio al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riepilogo Contratti');

    // Genera il buffer Excel
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    });

    // Imposta gli header per il download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="riepilogo-contratti-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', excelBuffer.length);

    console.log('🔵 Contracts Export: File Excel generato, dimensione:', excelBuffer.length, 'bytes');

    res.send(excelBuffer);

  } catch (error) {
    console.error('🔴 Contracts Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'esportazione Excel',
      error: error.message
    });
  }
});

module.exports = router;
