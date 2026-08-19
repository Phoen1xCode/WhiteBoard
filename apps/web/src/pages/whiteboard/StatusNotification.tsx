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
        "flex items-center gap-2 rounded-lg border-2 border-border bg-popover px-3 py-2 text-popover-foreground shadow-[2px_2px_0px_0px_var(--border)]",
        className,
      )}
    >
      {isOnline ? (
        <Wifi className="size-4 text-[#16A34A]" />
      ) : (
        <WifiOff className="size-4 text-[#D97706]" />
      )}
      <span className="text-[13px] font-medium">
        {isOnline ? "在线 · 更改已同步到云端" : "离线 · 更改将保存在本地"}
      </span>
    </div>
  );
}
