import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorSelectorProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}

export function ColorSelector({
  label,
  value,
  onChange,
  presetColors,
}: ColorSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-10 p-0 border-2"
              style={{ backgroundColor: value }}
              aria-label={`Current color: ${value}`}
            >
              <span className="sr-only">{label}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer"
                  aria-label={label}
                />
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-10 w-24 font-mono text-xs uppercase"
                  placeholder="#000000"
                />
              </div>
              {presetColors && (
                <div className="grid grid-cols-5 gap-1.5">
                  {presetColors.map((color) => (
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
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <span className="text-xs text-muted-foreground font-mono uppercase">
          {value}
        </span>
      </div>
    </div>
  );
}