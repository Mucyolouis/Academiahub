import prisma from "@/prisma/connection";

interface SessionLike {
  user?: { id?: string | null } | null;
}

export async function recordAdminAction(
  session: SessionLike,
  action: string,
  targetType: string,
  targetId: string,
  details?: string,
) {
  const actorId = session?.user?.id;
  if (!actorId) return;

  await prisma.adminAction.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      details,
    },
  });
}