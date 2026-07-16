const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invites = await prisma.invitation.findMany();
  console.log("Invitations:", invites);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
