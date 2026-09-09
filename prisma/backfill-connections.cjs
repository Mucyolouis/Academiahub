// One-time backfill: every existing conversation pair becomes an ACCEPTED
// connection so current chat partners aren't blocked when the connection
// requirement ships. Idempotent — safe to run multiple times.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Backfilling connections from existing conversations...\n");

  const conversations = await prisma.conversation.findMany({
    select: {
      participantAId: true,
      participantBId: true,
    },
  });

  console.log(`Found ${conversations.length} conversations.`);

  let created = 0;
  let skipped = 0;

  for (const conversation of conversations) {
    // participantA/B are already normalized (smaller id first).
    const existing = await prisma.connection.findUnique({
      where: {
        userAId_userBId: {
          userAId: conversation.participantAId,
          userBId: conversation.participantBId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.connection.create({
      data: {
        userAId: conversation.participantAId,
        userBId: conversation.participantBId,
        requesterId: conversation.participantAId,
        status: "ACCEPTED",
      },
    });
    created += 1;
  }

  console.log(`Created ${created} connections, skipped ${skipped} existing.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });