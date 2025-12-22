import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding "customer" value to UserRole enum...');
  
  try {
    // Добавляем значение в enum через raw SQL
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'customer' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
          ALTER TYPE user_role ADD VALUE 'customer';
        END IF;
      END $$;
    `);
    
    console.log('✅ Successfully added "customer" to UserRole enum');
  } catch (error: any) {
    // Если значение уже существует, это нормально
    if (error.message?.includes('already exists') || error.code === 'P2010') {
      console.log('ℹ️  Value "customer" already exists in UserRole enum');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

