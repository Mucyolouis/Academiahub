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

  // Approve Alice as a mentor so the mentorship browse page has one mentor.
  const alice = await prisma.user.findUnique({ where: { email: "alice@example.com" } });
  if (alice) {
    await prisma.mentorProfile.upsert({
      where: { userId: alice.id },
      update: {},
      create: {
        userId: alice.id,
        title: "Senior Lecturer, Computer Science",
        bio: "I help students with programming fundamentals, web development and research methodology.",
        areas: JSON.stringify(["Web Development", "Data Science", "Research Writing"]),
        yearsExperience: 10,
        availability: "2 hrs/week",
        status: "APPROVED",
      },
    });
    console.log("Approved mentor profile for alice@example.com");
  }

  // Create a sample internship posted by Bob.
  const bob = await prisma.user.findUnique({ where: { email: "bob@example.com" } });
  if (bob) {
    await prisma.internship.upsert({
      where: { id: "seed-internship-1" },
      update: {},
      create: {
        id: "seed-internship-1",
        title: "Software Engineering Intern",
        company: "IvomoHub",
        description: "Work alongside our engineering team building web applications for African universities. Learn modern JavaScript/TypeScript, databases and APIs while shipping real features.",
        type: "HYBRID",
        location: "Nairobi, Kenya",
        duration: "3 months",
        stipend: "Paid · KES 25,000/mo",
        postedById: bob.id,
      },
    });
    console.log("Created sample internship for bob@example.com");
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
