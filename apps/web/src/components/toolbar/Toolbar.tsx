import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil, Square, Circle, Minus } from "lucide-react";
import { useWhiteboardStore } from "../../store/whiteboardStore";
import type { ShapeType } from "@whiteboard/shared/types";

const tools = [
  { type: "freehand" as ShapeType, icon: Pencil, label: "Freehand" },
  { type: "rectangle" as ShapeType, icon: Square, label: "Rectangle" },
  { type: "circle" as ShapeType, icon: Circle, label: "Circle" },
  { type: "line" as ShapeType, icon: Minus, label: "Line" },
];

export function Toolbar() {
  const currentTool = useWhiteboardStore((s) => s.currentTool);
  const setCurrentTool = useWhiteboardStore((s) => s.setCurrentTool);

  return (
    <TooltipProvider>
      <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-xl shadow-xl p-2 border border-border">
        <ToggleGroup
          type="single"
          value={currentTool}
          onValueChange={(value) => value && setCurrentTool(value as ShapeType)}
          className="flex flex-col gap-2"
        >
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Tooltip key={tool.type}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={tool.type}
                    aria-label={tool.label}
                    className="h-10 w-10 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-muted hover:text-muted-foreground transition-all"
                  >
                    <Icon size={20} />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}
