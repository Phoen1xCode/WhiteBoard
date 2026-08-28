import { Wifi, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatusNotificationProps {
  status?: "online" | "offline";
  className?: string;
}

export function StatusNotification({ status = "online", className }: StatusNotificationProps) {
  const isOnline = status === "online";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-base border-2 border-border bg-popover px-3 py-2 text-popover-foreground shadow-shadow",
        className,
      )}
    >
      {isOnline ? (
        <Wifi className="size-4 text-chart-4" />
      ) : (
        <WifiOff className="size-4 text-chart-1" />
      )}
      <span className="text-sm font-base">
        {isOnline ? "在线 · 更改已同步到云端" : "离线 · 更改将保存在本地"}
      </span>
    </div>
  );
}
