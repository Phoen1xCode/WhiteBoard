import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const FILL_PRESET_COLORS = [
  "#FFFFFF", // White
  "#F8F9FA", // Light Gray
  "#FFE6E6", // Light Red
  "#E6FFE6", // Light Green
  "#E6E6FF", // Light Blue
  "#FFFCE6", // Light Yellow
  "#FFE6FF", // Light Magenta
  "#E6FFFF", // Light Cyan
  "#FFF0E6", // Light Orange
  "#F3E6FF", // Light Purple
];

interface FillColorSelectorProps {
  value?: string;
  onChange: (value?: string) => void;
}

export function FillColorSelector({ value, onChange }: FillColorSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-muted-foreground">
        Fill Color (Optional)
      </Label>
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 w-10 p-0 border-2",
                !value && "bg-transparent"
              )}
              style={value ? { backgroundColor: value } : undefined}
              aria-label={value ? `Current fill color: ${value}` : "No fill color"}
            >
              {!value && (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={value || "#FFFFFF"}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  aria-label="Select fill color"
                />
                <Input
                  type="text"
                  value={value || ""}
                  onChange={(e) => onChange(e.target.value || undefined)}
                  className="h-10 w-24 font-mono text-xs uppercase"
                  placeholder="None"
                />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {FILL_PRESET_COLORS.map((color) => (
                  <Button
                    key={color}
                    variant="outline"
                    size="icon"
                    onClick={() => onChange(color)}
                    className={cn(
                      "h-7 w-7 rounded-md border-2 p-0 transition-all hover:scale-110",
                      value === color
                        ? "ring-2 ring-primary ring-offset-2"
                        : "border-border"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select fill color ${color}`}
                  />
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onChange(undefined)}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Fill
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <span className="text-xs text-muted-foreground font-mono uppercase">
          {value || "None"}
        </span>
      </div>
    </div>
  );
}