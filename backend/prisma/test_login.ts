import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'ritikasthana092019@gmail.com' },
  });

  console.log('User found in DB:', user);

  if (user && user.passwordHash) {
    const matchDefault = await bcrypt.compare('Password123!', user.passwordHash);
    console.log('Does "Password123!" match passwordHash?', matchDefault);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
