import type { WhiteBoardElement } from "@whiteboard/shared/types";

import { Settings2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useWhiteboardStore } from "@/store/whiteboardStore";

interface Props {
  boardId: string;
}

const PRESET_COLORS = [
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
  "#9c36b5",
  "#0c8599",
  "#e64980",
  "#868e96",
  "#ffffff",
];

export function PropertyPanel({ boardId }: Props) {
  const elements = useWhiteboardStore((s) => s.elements);
  const selectedElementId = useWhiteboardStore((s) => s.selectedElementId);
  const setSelectedElementId = useWhiteboardStore((s) => s.setSelectedElementId);
  const applyOperation = useWhiteboardStore((s) => s.applyOperation);
  const deleteSelectedElement = useWhiteboardStore((s) => s.deleteSelectedElement);

  const selectedElement = selectedElementId ? elements[selectedElementId] : null;

  if (!selectedElement) {
    return null;
  }

  function updateElement(changes: Partial<WhiteBoardElement>) {
    if (!selectedElementId) return;

    applyOperation(
      { type: "update", boardId, elementId: selectedElementId, changes },
      { local: true },
    );
  }

  function handleDelete() {
    deleteSelectedElement(boardId);
  }

  function handleClose() {
    setSelectedElementId(null);
  }

  const typeLabels: Record<string, string> = {
    freehand: "Pencil",
    rectangle: "Rectangle",
    circle: "Ellipse",
    line: "Line",
  };

  return (
    <div className="fixed top-20 right-4 w-56 overflow-hidden rounded-base border-2 border-border bg-background shadow-shadow">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-border bg-muted px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-muted-foreground" />
          <span className="text-xs font-heading">
            {typeLabels[selectedElement.type] || selectedElement.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="size-7"
            title="Delete (Del)"
          >
            <Trash2 className="text-destructive" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="size-7"
            title="Close (Esc)"
          >
            <X className="text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-3">
        {/* Stroke Color */}
        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Stroke</Label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateElement({ strokeColor: color })}
                className={cn(
                  "h-6 w-6 rounded-base border-2 border-border transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden",
                  selectedElement.strokeColor === color &&
                    "scale-110 ring-2 ring-ring ring-offset-2",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Fill Color - only for shapes */}
        {(selectedElement.type === "rectangle" || selectedElement.type === "circle") && (
          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Fill</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => updateElement({ fill: undefined })}
                className={cn(
                  "relative h-6 w-6 rounded-base border-2 border-border transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden",
                  !selectedElement.fill && "scale-110 ring-2 ring-ring ring-offset-2",
                )}
                style={{
                  background:
                    "linear-gradient(135deg, #fff 45%, #ff0000 45%, #ff0000 55%, #fff 55%)",
                }}
                title="No fill"
              />
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updateElement({ fill: color })}
                  className={cn(
                    "h-6 w-6 rounded-base border-2 border-border transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden",
                    selectedElement.fill === color && "scale-110 ring-2 ring-ring ring-offset-2",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stroke Width */}
        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">
            Stroke width: {selectedElement.strokeWidth}px
          </Label>
          <Slider
            min={1}
            max={20}
            value={[selectedElement.strokeWidth]}
            onValueChange={(value) => updateElement({ strokeWidth: value[0] })}
          />
        </div>

        {/* Line Style */}
        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Stroke style</Label>
          <div className="flex gap-2">
            <button
              onClick={() => updateElement({ strokeDashArray: undefined })}
              className={cn(
                "flex h-8 flex-1 items-center justify-center rounded-base border-2 border-border transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden",
                !selectedElement.strokeDashArray
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary-background hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <div className="h-0.5 w-8 bg-current" />
            </button>
            <button
              onClick={() => updateElement({ strokeDashArray: [10, 5] })}
              className={cn(
                "flex h-8 flex-1 items-center justify-center rounded-base border-2 border-border transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden",
                selectedElement.strokeDashArray
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary-background hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <div className="w-8 border-t-2 border-dashed border-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
