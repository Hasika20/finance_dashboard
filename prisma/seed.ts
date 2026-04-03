import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// SEED CONFIGURATION
// ============================================
// Fixed seed for reproducible data
faker.seed(42);

const CATEGORIES_INCOME = ['Salary', 'Freelance', 'Investments', 'Rental Income', 'Dividends'];
const CATEGORIES_EXPENSE = ['Food', 'Rent', 'Utilities', 'Transport', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Insurance', 'Subscriptions'];

// ============================================
// SEED USERS
// ============================================
// Creates 3 users with known credentials for testing:
//   admin@finance.com    / password123  (ADMIN)
//   analyst@finance.com  / password123  (ANALYST)
//   viewer@finance.com   / password123  (VIEWER)

async function seedUsers() {
  console.log('🌱 Seeding users...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@finance.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@finance.com',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@finance.com' },
      update: {},
      create: {
        name: 'Analyst User',
        email: 'analyst@finance.com',
        passwordHash,
        role: 'ANALYST',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'viewer@finance.com' },
      update: {},
      create: {
        name: 'Viewer User',
        email: 'viewer@finance.com',
        passwordHash,
        role: 'VIEWER',
        isActive: true,
      },
    }),
  ]);

  console.log(`   ✅ Created ${users.length} users`);
  return users;
}

// ============================================
// SEED FINANCIAL RECORDS
// ============================================
// Creates 60 realistic financial records over the past 6 months

async function seedRecords(adminUserId: string) {
  console.log('🌱 Seeding financial records...');

  // Delete existing records for clean seed
  await prisma.financialRecord.deleteMany({});

  const records = [];
  const now = new Date();

  for (let i = 0; i < 60; i++) {
    const isIncome = Math.random() < 0.35; // 35% income, 65% expense (realistic ratio)
    const type = isIncome ? 'INCOME' : 'EXPENSE';
    const categories = isIncome ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;
    const category = categories[Math.floor(Math.random() * categories.length)];

    // Amount ranges based on category for realism
    let minAmount: number, maxAmount: number;
    if (isIncome) {
      switch (category) {
        case 'Salary': minAmount = 3000; maxAmount = 8000; break;
        case 'Freelance': minAmount = 500; maxAmount = 3000; break;
        case 'Investments': minAmount = 100; maxAmount = 2000; break;
        case 'Rental Income': minAmount = 800; maxAmount = 2500; break;
        default: minAmount = 50; maxAmount = 500; break;
      }
    } else {
      switch (category) {
        case 'Rent': minAmount = 800; maxAmount = 2000; break;
        case 'Food': minAmount = 20; maxAmount = 200; break;
        case 'Utilities': minAmount = 50; maxAmount = 300; break;
        case 'Transport': minAmount = 10; maxAmount = 150; break;
        case 'Entertainment': minAmount = 15; maxAmount = 200; break;
        case 'Healthcare': minAmount = 50; maxAmount = 500; break;
        case 'Shopping': minAmount = 25; maxAmount = 400; break;
        case 'Education': minAmount = 100; maxAmount = 1000; break;
        case 'Insurance': minAmount = 100; maxAmount = 500; break;
        default: minAmount = 10; maxAmount = 100; break;
      }
    }

    const amount = parseFloat(faker.finance.amount({ min: minAmount, max: maxAmount, dec: 2 }));

    // Random date within last 6 months
    const daysAgo = Math.floor(Math.random() * 180);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    records.push({
      userId: adminUserId,
      amount,
      type,
      category,
      date,
      description: faker.finance.transactionDescription(),
    });
  }

  await prisma.financialRecord.createMany({ data: records });
  console.log(`   ✅ Created ${records.length} financial records`);
}

// ============================================
// SEED AUDIT LOGS
// ============================================

async function seedAuditLogs(adminUserId: string) {
  console.log('🌱 Seeding audit logs...');

  await prisma.auditLog.deleteMany({});

  const logs = [
    {
      userId: adminUserId,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: adminUserId,
      details: JSON.stringify({ message: 'System initialized with admin user' }),
    },
    {
      userId: adminUserId,
      action: 'SEED_EXECUTED',
      entityType: 'SYSTEM',
      entityId: 'seed-script',
      details: JSON.stringify({ message: 'Database seeded with demo data' }),
    },
  ];

  await prisma.auditLog.createMany({ data: logs });
  console.log(`   ✅ Created ${logs.length} audit log entries`);
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('\n🚀 Starting database seed...\n');

  const users = await seedUsers();
  const adminUser = users[0]; // Admin user is first
  await seedRecords(adminUser.id);
  await seedAuditLogs(adminUser.id);

  console.log('\n✨ Seed complete!\n');
  console.log('📋 Test Credentials:');
  console.log('   Admin:   admin@finance.com   / password123');
  console.log('   Analyst: analyst@finance.com / password123');
  console.log('   Viewer:  viewer@finance.com  / password123\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
