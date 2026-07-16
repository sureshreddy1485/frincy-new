const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const members = await prisma.businessMember.findMany();
  const businesses = await prisma.business.findMany();
  console.log("Users:", users);
  console.log("Businesses:", businesses);
  console.log("BusinessMembers:", members);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
