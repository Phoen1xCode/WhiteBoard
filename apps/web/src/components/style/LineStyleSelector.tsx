import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";

/**
 * 线型选择器组件
 * 支持实线和虚线两种线型切换
 */
interface LineStyleSelectorProps {
  value?: number[]; // 当前线型值，undefined为实线，数组为虚线
  onChange: (value?: number[]) => void; // 线型变化回调
}

export function LineStyleSelector({ value, onChange }: LineStyleSelectorProps) {
  const currentValue = value ? "dashed" : "solid";

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-muted-foreground">
        线条样式
      </Label>
      <ToggleGroup
        type="single"
        value={currentValue}
        onValueChange={(val: string) => {
          if (val === "solid") onChange(undefined);
          else if (val === "dashed") onChange([10, 5]);
        }}
        className="justify-start gap-2"
      >
        <ToggleGroupItem
          value="solid"
          className="flex-1 h-9 data-[state=on]:bg-primary/10 data-[state=on]:text-primary border border-input hover:bg-accent hover:text-accent-foreground"
          aria-label="Solid line"
        >
          <div className="w-8 h-0 border-t-2 border-current" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="dashed"
          className="flex-1 h-9 data-[state=on]:bg-primary/10 data-[state=on]:text-primary border border-input hover:bg-accent hover:text-accent-foreground"
          aria-label="Dashed line"
        >
          <div className="w-8 h-0 border-t-2 border-current border-dashed" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
