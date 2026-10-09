import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 10 });
  for (const u of users) {
    console.log(`#${u.id} ${u.username} ${u.email} role=${u.role} verified=${u.verified} pass_len=${u.password?.length}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
