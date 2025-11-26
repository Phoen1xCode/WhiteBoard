import { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Canvas, Toolbar, StylePanel, ShareButton } from "../components";
import { useBoardSync } from "../hooks/useBoardSync";


export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // 同步白板数据
  useBoardSync(boardId!);

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

  if (!boardId) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <p className="text-destructive font-medium">Invalid board ID</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-background flex flex-col overflow-hidden">
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            WhiteBoard
          </h1>
          {/* <Separator orientation="vertical" className="h-6" /> */}
        </div>
        <ShareButton boardId={boardId} />
      </header>
      <main ref={containerRef} className="flex-1 relative bg-dot-pattern">
        <Canvas
          boardId={boardId}
          width={dimensions.width}
          height={dimensions.height}
        />
        <Toolbar />
        <StylePanel />
      </main>
    </div>
  );
}
