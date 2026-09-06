require("dotenv").config({ path: "../.env" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.user
  .findMany({ select: { email: true, role: true }, take: 20 })
  .then((users) => {
    console.log(JSON.stringify(users, null, 1));
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
