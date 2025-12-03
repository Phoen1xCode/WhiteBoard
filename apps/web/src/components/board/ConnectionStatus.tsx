import { useState, useEffect } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import {
  type ConnectionStatus,
  getConnectionStatus,
  onStatusChange,
  offStatusChange,
} from "../../lib/socket";

const statusConfig: Record<
  ConnectionStatus,
  { icon: typeof Wifi; label: string; className: string }
> = {
  connected: {
    icon: Wifi,
    label: "已连接",
    className: "text-green-600 bg-green-50",
  },
  connecting: {
    icon: Loader2,
    label: "连接中...",
    className: "text-yellow-600 bg-yellow-50",
  },
  reconnecting: {
    icon: Loader2,
    label: "重新连接中...",
    className: "text-yellow-600 bg-yellow-50",
  },
  disconnected: {
    icon: WifiOff,
    label: "已断开连接",
    className: "text-red-600 bg-red-50",
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
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.className}`}
    >
      <Icon size={16} className={isAnimated ? "animate-spin" : ""} />
      <span>{config.label}</span>
    </div>
  );
}
