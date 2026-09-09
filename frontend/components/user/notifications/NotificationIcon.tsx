import type { LucideIcon } from "lucide-react";
import { Heart, MessageCircle, ShieldAlert, User, UserCheck, UserPlus } from "lucide-react";

type IconEntry = {
  Icon: LucideIcon;
  label: string;
  color: string;
};

const ICON_MAP: Record<string, IconEntry> = {
  comment: {
    Icon: MessageCircle,
    label: "Comment notification",
    color: "#2aff00",
  },
  like: {
    Icon: Heart,
    label: "Like notification",
    color: "#ff0000",
  },
  message: {
    Icon: User,
    label: "Message notification",
    color: "#ffd700",
  },
  connection_request: {
    Icon: UserPlus,
    label: "Connection request",
    color: "#2563eb",
  },
  connection_accepted: {
    Icon: UserCheck,
    label: "Connection accepted",
    color: "#16a34a",
  },
  moderation: {
    Icon: ShieldAlert,
    label: "Moderation notice",
    color: "#ea580c",
  },
};

export default function NotificationIcon({ type }: { type: string }) {
  const entry = ICON_MAP[type];
  if (!entry) return null;

  const { Icon, label, color } = entry;
  return (
    <Icon
      strokeWidth={1.5}
      color={color}
      className="w-full h-full"
      role="img"
      aria-label={label}
    />
  );
}
