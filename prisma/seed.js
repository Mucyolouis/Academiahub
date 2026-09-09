const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");

const prisma = new PrismaClient();

const users = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    password: "Alice@123",
    role: "ADMIN",
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    password: "Bob@1234",
    role: "USER",
  },
  {
    name: "Carol White",
    email: "carol@example.com",
    password: "Carol@123",
    role: "USER",
  },
  {
    name: "David Brown",
    email: "david@example.com",
    password: "David@123",
    role: "USER",
  },
  {
    name: "Eve Davis",
    email: "eve@example.com",
    password: "Eve@1234",
    role: "USER",
  },
];

async function main() {
  console.log("Seeding database...\n");

  for (const user of users) {
    const hash = await argon2.hash(user.password);
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hash,
        role: user.role,
        emailVerified: new Date(),
      },
    });
    console.log(`Created: ${created.name} (${created.email}) | Role: ${created.role}`);
  }

  console.log("\n--- Dummy Credentials ---\n");
  for (const user of users) {
    console.log(`Email: ${user.email}  |  Password: ${user.password}  |  Role: ${user.role}`);
  }
  console.log("\nSeeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
