import { useWhiteboardStore } from "../../store/whiteboardStore";
import type { WhiteBoardElement } from "@whiteboard/shared/types";
import { Trash2, Settings2, X } from "lucide-react";

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
  const setSelectedElementId = useWhiteboardStore(
    (s) => s.setSelectedElementId
  );
  const applyOperation = useWhiteboardStore((s) => s.applyOperation);
  const deleteSelectedElement = useWhiteboardStore(
    (s) => s.deleteSelectedElement
  );

  const selectedElement = selectedElementId
    ? elements[selectedElementId]
    : null;

  if (!selectedElement) {
    return null;
  }

  function updateElement(changes: Partial<WhiteBoardElement>) {
    if (!selectedElementId) return;

    applyOperation(
      { type: "update", boardId, elementId: selectedElementId, changes },
      { local: true }
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
    <div className="fixed right-4 top-20 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-700">
            {typeLabels[selectedElement.type] || selectedElement.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Delete (Del)"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Close (Esc)"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* Stroke Color */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Stroke
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateElement({ strokeColor: color })}
                className={`w-6 h-6 rounded-md border-2 transition-all ${
                  selectedElement.strokeColor === color
                    ? "border-violet-500 scale-110"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Fill Color - only for shapes */}
        {(selectedElement.type === "rectangle" ||
          selectedElement.type === "circle") && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Fill
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => updateElement({ fill: undefined })}
                className={`w-6 h-6 rounded-md border-2 transition-all relative ${
                  !selectedElement.fill
                    ? "border-violet-500 scale-110"
                    : "border-gray-200 hover:border-gray-400"
                }`}
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
                  className={`w-6 h-6 rounded-md border-2 transition-all ${
                    selectedElement.fill === color
                      ? "border-violet-500 scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stroke Width */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Stroke width: {selectedElement.strokeWidth}px
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={selectedElement.strokeWidth}
            onChange={(e) =>
              updateElement({ strokeWidth: Number(e.target.value) })
            }
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
        </div>

        {/* Line Style */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Stroke style
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => updateElement({ strokeDashArray: undefined })}
              className={`flex-1 h-8 rounded-md border-2 transition-all flex items-center justify-center ${
                !selectedElement.strokeDashArray
                  ? "border-violet-500 bg-violet-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="w-8 h-0.5 bg-current" />
            </button>
            <button
              onClick={() => updateElement({ strokeDashArray: [10, 5] })}
              className={`flex-1 h-8 rounded-md border-2 transition-all flex items-center justify-center ${
                selectedElement.strokeDashArray
                  ? "border-violet-500 bg-violet-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="w-8 border-t-2 border-dashed border-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
