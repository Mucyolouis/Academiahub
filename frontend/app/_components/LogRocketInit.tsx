"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import type LogRocketType from "logrocket";

let logRocketPromise: Promise<typeof LogRocketType> | null = null;

function loadLogRocket() {
  if (process.env.NODE_ENV !== "production") return null;
  if (!logRocketPromise) {
    logRocketPromise = import("logrocket").then((m) => {
      m.default.init("jgsvfu/academiahub");
      return m.default;
    });
  }
  return logRocketPromise;
}

export default function LogRocketInit() {
  const identified = useRef<string | null>(null);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const userName = session?.user?.name;
  const userEmail = session?.user?.email;

  useEffect(() => {
    void loadLogRocket();
  }, []);

  useEffect(() => {
    if (!userId || identified.current === userId) return;
    loadLogRocket()?.then((LogRocket) => {
      LogRocket.identify(userId, {
        name: userName ?? "",
        email: userEmail ?? "",
      });
      identified.current = userId;
    });
  }, [userId, userName, userEmail]);

  return null;
}
