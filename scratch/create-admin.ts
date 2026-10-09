import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin1234!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nidoria.com' },
    update: { role: 'admin', verified: new Date() },
    create: {
      email: 'admin@nidoria.com',
      username: 'admin',
      password: hash,
      role: 'admin',
      verified: new Date(),
    },
  });

  const player = await prisma.user.upsert({
    where: { email: 'player@test.com' },
    update: { verified: new Date() },
    create: {
      email: 'player@test.com',
      username: 'player',
      password: hash,
      role: 'user',
      verified: new Date(),
    },
  });

  console.log('Admin user:', admin.id, admin.username, admin.role);
  console.log('Player user:', player.id, player.username, player.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
