import { useWhiteboardStore } from "../../store/whiteboardStore";
import type { ShapeType } from "@whiteboard/shared/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pencil,
  Square,
  Circle,
  Minus,
  Undo2,
  Redo2,
  Eraser,
  MousePointer,
} from "lucide-react";

const tools = [
  {
    type: "select" as ShapeType,
    icon: MousePointer,
    label: "Select",
    shortcut: "V",
  },
  {
    type: "freehand" as ShapeType,
    icon: Pencil,
    label: "Pencil",
    shortcut: "P",
  },
  {
    type: "rectangle" as ShapeType,
    icon: Square,
    label: "Rectangle",
    shortcut: "R",
  },
  {
    type: "circle" as ShapeType,
    icon: Circle,
    label: "Ellipse",
    shortcut: "O",
  },
  { type: "line" as ShapeType, icon: Minus, label: "Line", shortcut: "L" },
  { type: "eraser" as ShapeType, icon: Eraser, label: "Eraser", shortcut: "E" },
];

interface ToolbarProps {
  boardId: string;
}

export function Toolbar({ boardId }: ToolbarProps) {
  const currentTool = useWhiteboardStore((s) => s.currentTool);
  const setCurrentTool = useWhiteboardStore((s) => s.setCurrentTool);
  const undo = useWhiteboardStore((s) => s.undo);
  const redo = useWhiteboardStore((s) => s.redo);
  const canUndo = useWhiteboardStore((s) => s.canUndo());
  const canRedo = useWhiteboardStore((s) => s.canRedo());

  return (
    <TooltipProvider delayDuration={300}>
      {/* Main horizontal toolbar*/}
      <div className="fixed left-1/2 top-4 -translate-x-1/2 flex items-center gap-1 bg-white rounded-lg shadow-lg p-1.5 border border-gray-200">
        {/* Drawing Tools */}
        <ToggleGroup
          type="single"
          value={currentTool}
          onValueChange={(value) => value && setCurrentTool(value as ShapeType)}
          className="flex items-center gap-0.5"
        >
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentTool === tool.type;
            return (
              <Tooltip key={tool.type}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={tool.type}
                    aria-label={tool.label}
                    className={`
                      h-9 w-9 p-0 rounded-md transition-all duration-150
                      ${
                        isActive
                          ? "bg-violet-100 text-violet-700 shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={8}
                  className="flex items-center gap-2"
                >
                  <span>{tool.label}</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border border-gray-200 font-mono">
                    {tool.shortcut}
                  </kbd>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Undo/Redo buttons */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-md transition-all duration-150 ${
                  canUndo
                    ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                onClick={() => undo(boardId)}
                disabled={!canUndo}
              >
                <Undo2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="flex items-center gap-2"
            >
              <span>Undo</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border border-gray-200 font-mono">
                Ctrl+Z
              </kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-md transition-all duration-150 ${
                  canRedo
                    ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                onClick={() => redo(boardId)}
                disabled={!canRedo}
              >
                <Redo2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="flex items-center gap-2"
            >
              <span>Redo</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border border-gray-200 font-mono">
                Ctrl+Y
              </kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
