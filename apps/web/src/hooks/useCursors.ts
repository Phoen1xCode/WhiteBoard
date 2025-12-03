import { useState, useEffect, useCallback, useRef } from "react";
import {
  sendCursor,
  onCursor,
  offCursor,
  getSocketId,
  type CursorData,
} from "../lib/socket";

export interface CursorInfo {
  clientId: string;
  x: number;
  y: number;
  color: string;
  lastUpdate: number;
}

// Generate a consistent color based on client ID
function getColorForClient(clientId: string): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
  ];

  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const CURSOR_TIMEOUT = 5000; // Remove cursor after 5 seconds of inactivity
const THROTTLE_MS = 50; // Throttle cursor updates to 20fps

export function useCursors(boardId: string) {
  const [cursors, setCursors] = useState<Map<string, CursorInfo>>(new Map());
  const lastSentRef = useRef<number>(0);

  // Handle incoming cursor updates
  useEffect(() => {
    const handler = (data: CursorData) => {
      const mySocketId = getSocketId();
      // Ignore our own cursor
      if (data.clientId === mySocketId) return;

      setCursors((prev) => {
        const next = new Map(prev);
        next.set(data.clientId, {
          clientId: data.clientId,
          x: data.x,
          y: data.y,
          color: getColorForClient(data.clientId),
          lastUpdate: Date.now(),
        });
        return next;
      });
    };

    onCursor(handler);
    return () => offCursor(handler);
  }, []);

  // Clean up stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [clientId, cursor] of next) {
          if (now - cursor.lastUpdate > CURSOR_TIMEOUT) {
            next.delete(clientId);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Send cursor position (throttled)
  const updateCursor = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastSentRef.current < THROTTLE_MS) return;
      lastSentRef.current = now;
      sendCursor(boardId, x, y);
    },
    [boardId]
  );

  return {
    cursors: Array.from(cursors.values()),
    updateCursor,
  };
}
