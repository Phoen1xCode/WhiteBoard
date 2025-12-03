import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * 填充颜色选择器组件
 * 支持可选的填充颜色设置，包含清空功能
 */
interface FillColorSelectorProps {
  value?: string; // 当前填充颜色值，可选
  onChange: (value?: string) => void; // 颜色变化回调
  presetColors?: string[]; // 预设颜色数组，可选
}

export function FillColorSelector({
  value,
  onChange,
  presetColors,
}: FillColorSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-muted-foreground">
        填充颜色（可选）
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
              aria-label={value ? `当前填充颜色: ${value}` : "无填充颜色"}
            >
              {!value && <X className="h-4 w-4 text-muted-foreground" />}
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
                      aria-label={`Select fill color ${color}`}
                    />
                  ))}
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onChange(undefined)}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                清除填充颜色
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
