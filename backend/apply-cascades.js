const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

(async () => {
  const prisma = new PrismaClient();

  try {
    const sqlPath = path.join(__dirname, 'prisma', 'add_cascades.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Разделяем SQL на отдельные команды
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));

    console.log(`Applying ${commands.length} SQL commands...`);

    for (const command of commands) {
      await prisma.$executeRawUnsafe(command + ';');
      console.log('✓ Applied command');
    }

    console.log('✅ CASCADE constraints applied successfully');
  } catch (error) {
    console.error('❌ Error applying CASCADE constraints:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
