/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Promote Service
 * ===============================================================
 * 
 * Gestisce la promozione di un Prospect a Market Target
 */

const { ScoutingModels } = require('../modelRefs');
const eventLogService = require('./eventLog.service');

/**
 * Promuove un prospect a market target
 */
const promoteToTarget = async (prospectId, ctx, options = {}) => {
  try {
    // 1. Verifica prospect
    const prospect = await ScoutingModels.Prospect.findFirst({
      where: { id: prospectId, teamId: ctx.teamId },
      include: { agent: true },
    });

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    // 2. Verifica precondizioni
    const isDirector = ctx.role === 'DIRECTOR_SPORT' || ctx.role === 'ADMIN';
    const isTargeted = prospect.status === 'TARGETED';

    if (!isTargeted && !options.force) {
      throw new Error('Prospect must have status TARGETED to be promoted');
    }

    if (!isTargeted && !isDirector) {
      throw new Error('Only DIRECTOR_SPORT or ADMIN can force promotion');
    }

    // 3. Mappa posizioni da codici a enum
    const positionMapping = {
      'GK': 'GOALKEEPER',
      'CB': 'DEFENDER',
      'FB': 'DEFENDER',
      'DM': 'MIDFIELDER',
      'CM': 'MIDFIELDER',
      'AM': 'MIDFIELDER',
      'W': 'FORWARD',
      'CF': 'FORWARD'
    };

    // 3. Prepara dati target
    const targetData = {
      teamId: ctx.teamId,
      // Anagrafica
      first_name: prospect.firstName,
      last_name: prospect.lastName,
      nationality: prospect.nationalityPrimary,
      date_of_birth: prospect.birthDate,
      position: prospect.mainPosition ? positionMapping[prospect.mainPosition] || null : null,
      secondary_roles: prospect.secondaryPositions ? prospect.secondaryPositions.join(', ') : null,
      foot: prospect.preferredFoot,
      
      // Fisico
      height_cm: prospect.heightCm,
      weight_kg: prospect.weightKg,
      
      // Club
      current_club: prospect.currentClub,
      club_country: prospect.countryClub,
      contract_until: prospect.contractUntil,
      
      // Agente
      // agentId: prospect.agentId, // Commentato perché colonna temporaneamente assente
      
      // Valutazione
      market_value: prospect.marketValue,
      overall_rating: prospect.overallScore,
      potential_rating: prospect.potentialScore,
      
      // Note
      notes: options.targetNotes || prospect.notes || `Promosso da scouting: ${prospect.id}`,
      
      // Priorità
      priority: options.targetPriority || 3,
      
      // Status
      status: 'SCOUTING',
      
      // Discovery info
      discovery_user_id: null, // Non abbiamo UUID valido, lasciamo null
      discovery_date: new Date(),
    };

    // 4. Crea o aggiorna target
    // Cerca se esiste già un target per questo prospect
    const existingTarget = await ScoutingModels.Target.findFirst({
      where: {
        teamId: ctx.teamId,
        first_name: prospect.firstName,
        last_name: prospect.lastName,
        current_club: prospect.currentClub,
      },
    });

    let target;
    if (existingTarget) {
      // Aggiorna target esistente
      target = await ScoutingModels.Target.update({
        where: { id: existingTarget.id },
        data: {
          ...targetData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Crea nuovo target
      target = await ScoutingModels.Target.create({
        data: targetData,
      });
    }

    // 5. Aggiorna status prospect a TARGETED (se non lo era già)
    if (prospect.status !== 'TARGETED') {
      await ScoutingModels.Prospect.update({
        where: { id: prospectId },
        data: {
          status: 'TARGETED',
          updatedById: ctx.userId,
        },
      });
    }

    // 6. Log evento
    await eventLogService.log(prospectId, 'PROMOTE_TO_TARGET', ctx, {
      description: eventLogService.formatDescription('PROMOTE_TO_TARGET', {
        targetId: target.id,
      }),
    });

    // 7. Risposta
    return {
      success: true,
      target,
      prospect,
      message: existingTarget
        ? 'Prospect promoted: target updated'
        : 'Prospect promoted: new target created',
    };
  } catch (error) {
    console.error('[PromoteService] Error promoting:', error);
    throw error;
  }
};

module.exports = {
  promoteToTarget,
};

