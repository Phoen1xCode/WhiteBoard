import { Home } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  Canvas,
  Toolbar,
  StylePanel,
  ShareButton,
  PropertyPanel,
  ConnectionStatus,
  Cursors,
} from "../components";
import { useBoardSync } from "../hooks/useBoardSync";
import { useCursors } from "../hooks/useCursors";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // 同步白板数据
  useBoardSync(boardId!);

  // 键盘快捷键
  useKeyboardShortcuts({ boardId: boardId! });

  // 光标同步
  const { cursors, updateCursor } = useCursors(boardId!);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // 处理鼠标移动，发送光标位置
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateCursor(x, y);
  };

  if (!boardId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <p className="font-medium text-red-500">Invalid board ID</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-50">
      {/* Minimal header */}
      <header className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <ConnectionStatus />
        <ShareButton boardId={boardId} />
      </header>

      {/* Home button - top left */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 shadow-md transition-colors hover:bg-gray-50"
        >
          <Home size={16} />
          <span className="text-sm font-medium">Home</span>
        </button>
      </div>

      {/* Canvas area */}
      <main
        ref={containerRef}
        className="relative flex-1"
        onMouseMove={handleMouseMove}
        style={{
          backgroundImage: `
            radial-gradient(circle, #d1d5db 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          backgroundColor: "#f9fafb",
        }}
      >
        <Canvas boardId={boardId} width={dimensions.width} height={dimensions.height} />
        <Cursors cursors={cursors} />
        <Toolbar boardId={boardId} />
        <StylePanel />
        <PropertyPanel boardId={boardId} />
      </main>
    </div>
  );
}
