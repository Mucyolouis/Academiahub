const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/make-admin.cjs <email>");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
    select: { id: true, email: true, role: true },
  });

  console.log(`Done. ${updated.email} is now a(n) ${updated.role}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
