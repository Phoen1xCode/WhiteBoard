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
 * 颜色选择器组件
 * 支持预设颜色选择和自定义颜色输入
 */
interface ColorSelectorProps {
  value: string; // 当前颜色值
  onChange: (color: string) => void; // 颜色变化回调
  presetColors?: string[]; // 预设颜色数组
}

export function ColorSelector({
  value,
  onChange,
  presetColors,
}: ColorSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-muted-foreground">
        线条颜色
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
              <span className="sr-only">线条颜色</span>
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
                  aria-label={"Select stroke color"}
                />
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-10 w-24 font-mono text-xs uppercase"
                  placeholder="#1E1E1E"
                  aria-label={"Enter stroke color"}
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
