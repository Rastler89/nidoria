const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.title.count();
    console.log('Title count:', count);
  } catch (error) {
    console.error('Error checking Title table:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
