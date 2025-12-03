import Konva from "konva";
import { Stage, Layer, Line, Rect, Circle, Transformer } from "react-konva";
import { useState, useMemo, useRef, useEffect } from "react";
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
  const selectedElementId = useWhiteboardStore((s) => s.selectedElementId);
  const setSelectedElementId = useWhiteboardStore(
    (s) => s.setSelectedElementId
  );
  const elements = useMemo(
    () => Object.values(elementsRecord),
    [elementsRecord]
  );

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentShape, setCurrentShape] = useState<WhiteBoardElement | null>(
    null
  );
  const [isErasing, setIsErasing] = useState(false);
  const erasedElementsRef = useRef<Set<string>>(new Set());

  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Shape>>(new Map());
  const stageRef = useRef<Konva.Stage>(null);

  // 当选中元素改变时，更新 Transformer
  useEffect(() => {
    if (transformerRef.current) {
      const selectedNode = selectedElementId
        ? shapeRefs.current.get(selectedElementId)
        : null;

      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedElementId]);

  // 检查点是否在元素边界内
  function checkElementAtPoint(x: number, y: number): string | null {
    const stage = stageRef.current;
    if (!stage) return null;

    const shape = stage.getIntersection({ x, y });
    if (shape && shape.id() && shape.id() !== "") {
      return shape.id();
    }
    return null;
  }

  // 橡皮擦删除元素
  function eraseElementAtPoint(x: number, y: number) {
    const elementId = checkElementAtPoint(x, y);
    if (elementId && !erasedElementsRef.current.has(elementId)) {
      erasedElementsRef.current.add(elementId);
      applyOperation({ type: "delete", boardId, elementId }, { local: true });
    }
  }

  function onPointerDown(e: any) {
    const clickedOnEmpty = e.target === e.target.getStage();

    // 橡皮擦工具
    if (currentTool === "eraser") {
      setIsErasing(true);
      erasedElementsRef.current.clear();
      const pos = e.target.getStage().getPointerPosition();
      if (pos) {
        eraseElementAtPoint(pos.x, pos.y);
      }
      return;
    }

    // 选择工具逻辑
    if (currentTool === "select") {
      // 如果点击了空白区域，取消选中
      if (clickedOnEmpty) {
        setSelectedElementId(null);
      } else {
        // 如果点击了图形，选中它
        const clickedShapeId = e.target.id();
        if (clickedShapeId) {
          setSelectedElementId(clickedShapeId);
        }
      }
      return;
    }

    // 绘制工具逻辑（原有逻辑）
    // 如果点击了空白区域，开始绘制
    if (clickedOnEmpty) {
      setSelectedElementId(null);

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
          strokeDashArray: currentStyle.strokeDashArray,
          points: [pos.x, pos.y],
        };
        setCurrentShape(element);
      }
      return;
    }

    // 如果点击了图形，选中它
    const clickedShapeId = e.target.id();
    if (clickedShapeId) {
      setSelectedElementId(clickedShapeId);
    }
  }

  function onPointerMove(e: any) {
    // 橡皮擦工具
    if (isErasing && currentTool === "eraser") {
      const pos = e.target.getStage().getPointerPosition();
      if (pos) {
        eraseElementAtPoint(pos.x, pos.y);
      }
      return;
    }

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
          strokeDashArray: currentStyle.strokeDashArray,
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
          strokeDashArray: currentStyle.strokeDashArray,
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
          strokeDashArray: currentStyle.strokeDashArray,
        };
        setCurrentShape(line);
        break;
      }
    }
  }

  function onPointerUp() {
    // 橡皮擦工具
    if (isErasing) {
      setIsErasing(false);
      erasedElementsRef.current.clear();
      return;
    }

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

    applyOperation(
      { type: "add", boardId, element: currentShape },
      { local: true }
    );
    setIsDrawing(false);
    setStartPos(null);
    setCurrentShape(null);
  }

  // 处理元素变换（拖动、缩放等）
  function handleTransformEnd(el: WhiteBoardElement) {
    const node = shapeRefs.current.get(el.id);
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // 重置缩放，将缩放应用到实际尺寸
    node.scaleX(1);
    node.scaleY(1);

    let changes: Partial<WhiteBoardElement> = {
      x: node.x(),
      y: node.y(),
    };

    // 根据元素类型更新尺寸
    if (el.type === "rectangle") {
      changes = {
        ...changes,
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
      };
    } else if (el.type === "circle") {
      changes = {
        ...changes,
        radius: Math.max(5, (el as CircleElement).radius * scaleX),
      };
    }

    applyOperation(
      { type: "update", boardId, elementId: el.id, changes },
      { local: true }
    );
  }

  // 渲染单个元素
  function renderElement(el: WhiteBoardElement) {
    const isSelected = el.id === selectedElementId;

    switch (el.type) {
      case "freehand":
        return (
          <Line
            key={el.id}
            id={el.id}
            ref={(node) => {
              if (node) {
                shapeRefs.current.set(el.id, node);
              } else {
                shapeRefs.current.delete(el.id);
              }
            }}
            points={el.points}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            lineCap="round"
            lineJoin="round"
            dash={el.strokeDashArray}
            draggable={isSelected}
            onDragEnd={(e) => {
              applyOperation(
                {
                  type: "update",
                  boardId,
                  elementId: el.id,
                  changes: { x: e.target.x(), y: e.target.y() },
                },
                { local: true }
              );
            }}
          />
        );

      case "rectangle":
        return (
          <Rect
            key={el.id}
            id={el.id}
            ref={(node) => {
              if (node) {
                shapeRefs.current.set(el.id, node);
              } else {
                shapeRefs.current.delete(el.id);
              }
            }}
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            fill={el.fill}
            dash={el.strokeDashArray}
            draggable={isSelected}
            onDragEnd={(e) => {
              applyOperation(
                {
                  type: "update",
                  boardId,
                  elementId: el.id,
                  changes: { x: e.target.x(), y: e.target.y() },
                },
                { local: true }
              );
            }}
            onTransformEnd={() => handleTransformEnd(el)}
          />
        );

      case "circle":
        return (
          <Circle
            key={el.id}
            id={el.id}
            ref={(node) => {
              if (node) {
                shapeRefs.current.set(el.id, node);
              } else {
                shapeRefs.current.delete(el.id);
              }
            }}
            x={el.x}
            y={el.y}
            radius={el.radius}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            fill={el.fill}
            dash={el.strokeDashArray}
            draggable={isSelected}
            onDragEnd={(e) => {
              applyOperation(
                {
                  type: "update",
                  boardId,
                  elementId: el.id,
                  changes: { x: e.target.x(), y: e.target.y() },
                },
                { local: true }
              );
            }}
            onTransformEnd={() => handleTransformEnd(el)}
          />
        );

      case "line":
        return (
          <Line
            key={el.id}
            id={el.id}
            ref={(node) => {
              if (node) {
                shapeRefs.current.set(el.id, node);
              } else {
                shapeRefs.current.delete(el.id);
              }
            }}
            points={el.points}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            lineCap="round"
            lineJoin="round"
            dash={el.strokeDashArray}
            draggable={isSelected}
            onDragEnd={(e) => {
              applyOperation(
                {
                  type: "update",
                  boardId,
                  elementId: el.id,
                  changes: { x: e.target.x(), y: e.target.y() },
                },
                { local: true }
              );
            }}
          />
        );

      default:
        return null;
    }
  }

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
      style={{
        cursor:
          currentTool === "eraser"
            ? "crosshair"
            : currentTool === "select"
            ? "default"
            : "crosshair",
      }}
    >
      <Layer>
        {/* 渲染已保存的元素 */}
        {elements.map(renderElement)}

        {/* 渲染正在绘制的元素 */}
        {currentShape && renderElement(currentShape)}

        {/* Transformer 用于选中元素的变换 */}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // 限制最小尺寸
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
}
