import { Stage, Layer, Line, Rect, Circle } from "react-konva";
import { useState, useMemo } from "react";
import { nanoid } from "nanoid";
import { useWhiteboardStore } from "../../store/whiteboardStore";
import type {
  WhiteBoardElement,
  RectangleElement,
  CircleElement,
  LineElement,
  FreehandElement,
} from "@whiteboard/shared/types";

interface Props {
  boardId: string;
  width: number;
  height: number;
}

export function Canvas({ boardId, width, height }: Props) {
  const elementsRecord = useWhiteboardStore((s) => s.elements);
  const currentTool = useWhiteboardStore((s) => s.currentTool);
  const currentStyle = useWhiteboardStore((s) => s.currentStyle);
  const applyOperation = useWhiteboardStore((s) => s.applyOperation);
  const elements = useMemo(() => Object.values(elementsRecord), [elementsRecord]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentShape, setCurrentShape] = useState<WhiteBoardElement | null>(null);

  function onPointerDown(e: any) {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);
    setStartPos(pos);

    // 为自由线条初始化点数组
    if (currentTool === "freehand") {
      const element: FreehandElement = {
        id: nanoid(),
        type: "freehand",
        x: 0,
        y: 0,
        strokeColor: currentStyle.strokeColor,
        strokeWidth: currentStyle.strokeWidth,
        points: [pos.x, pos.y],
      };
      setCurrentShape(element);
    }
  }

  function onPointerMove(e: any) {
    if (!isDrawing || !startPos) return;

    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    switch (currentTool) {
      case "freehand":
        if (currentShape && currentShape.type === "freehand") {
          setCurrentShape({
            ...currentShape,
            points: [...currentShape.points, pos.x, pos.y],
          });
        }
        break;

      case "rectangle": {
        const width = pos.x - startPos.x;
        const height = pos.y - startPos.y;
        const rect: RectangleElement = {
          id: currentShape?.id || nanoid(),
          type: "rectangle",
          x: width > 0 ? startPos.x : pos.x,
          y: height > 0 ? startPos.y : pos.y,
          width: Math.abs(width),
          height: Math.abs(height),
          strokeColor: currentStyle.strokeColor,
          strokeWidth: currentStyle.strokeWidth,
          fill: currentStyle.fillColor,
        };
        setCurrentShape(rect);
        break;
      }

      case "circle": {
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        const circle: CircleElement = {
          id: currentShape?.id || nanoid(),
          type: "circle",
          x: startPos.x,
          y: startPos.y,
          radius,
          strokeColor: currentStyle.strokeColor,
          strokeWidth: currentStyle.strokeWidth,
          fill: currentStyle.fillColor,
        };
        setCurrentShape(circle);
        break;
      }

      case "line": {
        const line: LineElement = {
          id: currentShape?.id || nanoid(),
          type: "line",
          x: 0,
          y: 0,
          points: [startPos.x, startPos.y, pos.x, pos.y],
          strokeColor: currentStyle.strokeColor,
          strokeWidth: currentStyle.strokeWidth,
        };
        setCurrentShape(line);
        break;
      }
    }
  }

  function onPointerUp() {
    if (!isDrawing || !currentShape) {
      setIsDrawing(false);
      setStartPos(null);
      setCurrentShape(null);
      return;
    }

    // 检查是否为有效图形
    if (currentTool === "freehand" && currentShape.type === "freehand") {
      if (currentShape.points.length < 4) {
        setIsDrawing(false);
        setStartPos(null);
        setCurrentShape(null);
        return;
      }
    }

    applyOperation({ type: "add", boardId, element: currentShape }, { local: true });
    setIsDrawing(false);
    setStartPos(null);
    setCurrentShape(null);
  }

  // 渲染单个元素
  function renderElement(el: WhiteBoardElement) {
    switch (el.type) {
      case "freehand":
        return (
          <Line
            key={el.id}
            points={el.points}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            lineCap="round"
            lineJoin="round"
            dash={el.strokeDashArray}
          />
        );

      case "rectangle":
        return (
          <Rect
            key={el.id}
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            fill={el.fill}
            dash={el.strokeDashArray}
          />
        );

      case "circle":
        return (
          <Circle
            key={el.id}
            x={el.x}
            y={el.y}
            radius={el.radius}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            fill={el.fill}
            dash={el.strokeDashArray}
          />
        );

      case "line":
        return (
          <Line
            key={el.id}
            points={el.points}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            lineCap="round"
            lineJoin="round"
            dash={el.strokeDashArray}
          />
        );

      default:
        return null;
    }
  }

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      <Layer>
        {/* 渲染已保存的元素 */}
        {elements.map(renderElement)}

        {/* 渲染正在绘制的元素 */}
        {currentShape && renderElement(currentShape)}
      </Layer>
    </Stage>
  );
}
