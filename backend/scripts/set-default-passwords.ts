import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const usersWithoutPassword = await prisma.user.findMany({
    where: { password: null },
  });
  console.log(`Found ${usersWithoutPassword.length} users without password.`);

  if (usersWithoutPassword.length === 0) {
    console.log('All users already have passwords.');
    return;
  }

  const hashedPassword = await bcrypt.hash('Test123!', 10);

  for (const user of usersWithoutPassword) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    console.log(`Updated user ${user.email}`);
  }

  console.log('Default password set for all users.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());