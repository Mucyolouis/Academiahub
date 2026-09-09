import { Router, Request, Response } from "express";
import "../types";
import prisma from "../lib/prisma";
import { verifySession } from "../middleware/verifySession";
import { searchLimiter } from "../middleware/rateLimit";

const router = Router();

/**
 * GET /users/search?q=
 * Search for users by name to start a DM.
 * Requires minimum 3 characters. Returns max 10 results.
 * Excludes the requesting user from results.
 */
router.get(
  "/search",
  verifySession,
  searchLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query.q as string | undefined;
      const userId = req.userId;

      if (!query || query.trim().length < 3) {
        res.status(400).json({ error: "Query must be at least 3 characters" });
        return;
      }

      const sanitizedQuery = query.trim();

      const users = await prisma.user.findMany({
        where: {
          id: { not: userId },
          showInSearch: true,
          name: {
            startsWith: sanitizedQuery,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        take: 10,
      });

      // Attach the requester's connection status with each result so the UI
      // can disable actions for non-connected users.
      if (users.length > 0) {
        const statuses = await prisma.connection.findMany({
          where: {
            OR: [
              { userAId: userId, userBId: { in: users.map((u) => u.id) } },
              { userBId: userId, userAId: { in: users.map((u) => u.id) } },
            ],
          },
          select: { userAId: true, userBId: true, status: true, requesterId: true },
        });

        const statusByUserId = new Map<string, "none" | "pending-sent" | "pending-incoming" | "accepted">();
        for (const conn of statuses) {
          const otherId = conn.userAId === userId ? conn.userBId : conn.userAId;
          if (conn.status !== "ACCEPTED") {
            statusByUserId.set(
              otherId,
              conn.requesterId === userId ? "pending-sent" : "pending-incoming",
            );
          } else {
            statusByUserId.set(otherId, "accepted");
          }
        }

        users.forEach((u) => {
          (u as { connectionStatus?: string }).connectionStatus =
            statusByUserId.get(u.id) ?? "none";
        });
      }

      res.status(200).json(users);
    } catch {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

export default router;
