// server/patch-assign-admin.js
const { getPrismaClient } = require('./src/config/database');
const prisma = getPrismaClient();

(async () => {
  try {
    const team = await prisma.team.findUnique({
      where: { slug: 'vis-pesaro-1898' }
    });

    if (!team) {
      throw new Error('❌ Team Vis Pesaro 1898 non trovato');
    }

    const user = await prisma.userProfile.findUnique({
      where: { email: 'acanfora19811@gmail.com' }
    });

    if (!user) {
      throw new Error('❌ Utente admin non trovato');
    }

    await prisma.userProfile.update({
      where: { id: user.id },
      data: { teamId: team.id }
    });

    console.log(`✅ Utente ${user.email} assegnato al team ${team.name} (ID: ${team.id})`);
  } catch (error) {
    console.error('❌ Patch fallita:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
