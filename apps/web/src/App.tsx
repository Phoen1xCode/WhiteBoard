import { useRef, useEffect, useState } from "react";
import { Canvas } from "./components/whiteboard/Canvas";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  return (
    <div className="w-screen h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">WhiteBoard</h1>
      </header>
      <main ref={containerRef} className="flex-1 overflow-hidden">
        <Canvas
          boardId="default-board"
          width={dimensions.width}
          height={dimensions.height}
        />
      </main>
    </div>
  );
}

export default App;
