import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import {
  type ConnectionStatus,
  getConnectionStatus,
  onStatusChange,
  offStatusChange,
} from "@/lib/socket";

const statusConfig: Record<
  ConnectionStatus,
  { icon: typeof Wifi; label: string; className: string }
> = {
  connected: {
    icon: Wifi,
    label: "已连接",
    className: "bg-accent text-accent-foreground",
  },
  connecting: {
    icon: Loader2,
    label: "连接中...",
    className: "bg-secondary text-secondary-foreground",
  },
  reconnecting: {
    icon: Loader2,
    label: "重新连接中...",
    className: "bg-secondary text-secondary-foreground",
  },
  disconnected: {
    icon: WifiOff,
    label: "已断开连接",
    className: "bg-destructive text-destructive-foreground",
  },
};

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus());

  useEffect(() => {
    const handler = (newStatus: ConnectionStatus) => setStatus(newStatus);
    onStatusChange(handler);
    return () => offStatusChange(handler);
  }, []);

  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimated = status === "connecting" || status === "reconnecting";

  return (
    <div
      className={`flex items-center gap-2 rounded-full border-2 border-border px-3 py-1.5 text-sm font-base shadow-shadow ${config.className}`}
    >
      <Icon size={16} className={isAnimated ? "animate-spin" : ""} />
      <span>{config.label}</span>
    </div>
  );
}
