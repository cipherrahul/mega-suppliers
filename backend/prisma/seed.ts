import prisma from '../src/utils/prisma';
import { Role, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Remove the new PrismaClient() line and use the imported one.

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {
      email: 'admin@agriflow.com',
    },
    create: {
      name: 'Main Admin',
      phone: '9999999999',
      email: 'admin@agriflow.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created');

  console.log('✨ Seeding completed successfully! The database is now ready for real production usage.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
