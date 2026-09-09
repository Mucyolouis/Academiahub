import { Router, Request, Response } from "express";
import "../types";
import prisma from "../lib/prisma";
import { verifySession } from "../middleware/verifySession";
import { requireParticipant } from "../middleware/requireParticipant";
import { conversationCreateLimiter } from "../middleware/rateLimit";

const router = Router();

/**
 * POST /conversations
 * Find or create a 1-on-1 DM conversation.
 * Body: { recipientId: string }
 */
router.post(
  "/",
  verifySession,
  conversationCreateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipientId } = req.body;
      const userId = req.userId;

      if (!recipientId || typeof recipientId !== "string") {
        res.status(400).json({ error: "recipientId is required" });
        return;
      }

      // Prevent creating a conversation with yourself
      if (recipientId === userId) {
        res.status(400).json({ error: "Cannot create a conversation with yourself" });
        return;
      }

      // Validate recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true, allowMessages: true },
      });

      if (!recipient) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Respect the recipient's "allow messages" privacy setting.
      if (!recipient.allowMessages) {
        res.status(403).json({
          error: "This user has disabled messages",
          code: "MESSAGES_DISABLED",
        });
        return;
      }

      // Normalize participant/connection order: smaller ID is always A.
      // This ensures the @@unique constraints catch both A→B and B→A.
      const [participantAId, participantBId] =
        userId < recipientId ? [userId, recipientId] : [recipientId, userId];

      // Connection requirement: only ACCEPTED connections can start a DM.
      const connection = await prisma.connection.findUnique({
        where: {
          userAId_userBId: { userAId: participantAId, userBId: participantBId },
        },
        select: { id: true, status: true, requesterId: true },
      });

      if (!connection || connection.status !== "ACCEPTED") {
        const status = !connection
          ? "none"
          : connection.requesterId === userId
            ? "pending-sent"
            : "pending-incoming";

        res.status(403).json({
          error: status === "none"
            ? "You must be connected with this user before messaging them"
            : status === "pending-sent"
              ? "Connection request still pending"
              : "Accept this user's connection request before messaging them",
          code: "CONNECTION_REQUIRED",
          connectionStatus: status,
        });
        return;
      }

      // Find existing or create new conversation
      const conversation = await prisma.conversation.upsert({
        where: {
          participantAId_participantBId: { participantAId, participantBId },
        },
        update: {},
        create: { participantAId, participantBId },
        include: {
          participantA: { select: { id: true, name: true, image: true } },
          participantB: { select: { id: true, name: true, image: true } },
        },
      });

      res.status(200).json(conversation);
    } catch {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

/**
 * GET /conversations
 * List all DM conversations for the authenticated user.
 * Includes the other participant's info and the last message.
 */
router.get(
  "/",
  verifySession,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;

      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [{ participantAId: userId }, { participantBId: userId }],
        },
        include: {
          participantA: { select: { id: true, name: true, image: true } },
          participantB: { select: { id: true, name: true, image: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, content: true, senderId: true, createdAt: true },
          },
          readReceipts: {
            where: { userId },
            select: { lastReadMessageId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Transform: pick the "other" participant, flatten last message
      const result = conversations.map((convo: typeof conversations[number]) => {
        const otherParticipant =
          convo.participantAId === userId
            ? convo.participantB
            : convo.participantA;

        const lastMessage = convo.messages[0] ?? null;
        const lastReadMessageId = convo.readReceipts[0]?.lastReadMessageId ?? null;

        return {
          id: convo.id,
          otherParticipant,
          lastMessage,
          lastReadMessageId,
          createdAt: convo.createdAt,
        };
      });

      // Sort by last message date (conversations with recent messages first)
      result.sort((a: typeof result[number], b: typeof result[number]) => {
        const aDate = a.lastMessage?.createdAt ?? a.createdAt;
        const bDate = b.lastMessage?.createdAt ?? b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      res.status(200).json(result);
    } catch {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

/**
 * GET /conversations/:id/receipts
 * Get read receipts for a conversation.
 */
router.get(
  "/:id/receipts",
  verifySession,
  requireParticipant,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const conversationId = req.params.id as string;

      const receipts = await prisma.readReceipt.findMany({
        where: { conversationId },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      res.status(200).json(receipts);
    } catch {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

export default router;
