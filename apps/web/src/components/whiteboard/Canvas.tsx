import { Stage, Layer, Line } from "react-konva";
import { useState, useMemo } from "react";
import { nanoid } from "nanoid";
import { useWhiteboardStore } from "../../store/whiteboardStore";
import type { WhiteBoardElement } from "@whiteboard/shared/types";

interface Props {
  boardId: string;
  width: number;
  height: number;
}

export function Canvas({ boardId, width, height }: Props) {
  const elementsRecord = useWhiteboardStore((s) => s.elements);
  const applyOperation = useWhiteboardStore((s) => s.applyOperation);
  const elements = useMemo(() => Object.values(elementsRecord), [elementsRecord]);

  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);

  function onPointerDown(e: any) {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    setDraftPoints([pos.x, pos.y]);
  }

  function onPointerMove(e: any) {
    if (!draftPoints) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    setDraftPoints([...draftPoints, pos.x, pos.y]);
  }

  function onPointerUp() {
    if (!draftPoints || draftPoints.length < 4) {
      setDraftPoints(null);
      return;
    }

    const element: WhiteBoardElement = {
      id: nanoid(),
      type: "freehand",
      x: 0,
      y: 0,
      strokeColor: "#000",
      strokeWidth: 2,
      points: draftPoints,
    };

    applyOperation({ type: "add", boardId, element }, { local: true });
    setDraftPoints(null);
  }

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
    >
      <Layer>
        {elements.map((el) => (
          <Line
            key={el.id}
            points={el.points}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            lineCap="round"
            lineJoin="round"
          />
        ))}
        {draftPoints && (
          <Line
            points={draftPoints}
            stroke="#000"
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </Layer>
    </Stage>
  );
}
