import type { CursorInfo } from "../../hooks/useCursors";
import { MousePointer } from "lucide-react";

interface CursorsProps {
  cursors: CursorInfo[];
}

export function Cursors({ cursors }: CursorsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {cursors.map((cursor) => (
        <div
          key={cursor.clientId}
          className="absolute transition-all duration-75 ease-out"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: "translate(-2px, -2px)",
          }}
        >
          {/* Cursor pointer */}
          <MousePointer
            width="24"
            height="24"
            color={cursor.color}
            stroke="black"
            strokeWidth={1.5}
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
          />
          {/* User label */}
          <div
            className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            User {cursor.clientId.slice(-4)}
          </div>
        </div>
      ))}
    </div>
  );
}
