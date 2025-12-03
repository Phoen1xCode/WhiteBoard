import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

/**
 * 描边宽度滑块组件
 * 支持自定义范围设置，实时显示当前宽度值
 */
interface StrokeWidthSliderProps {
  value: number; // 描边宽度值
  onChange: (value: number) => void; // 宽度变化回调
  min?: number; // 最小值
  max?: number; // 最大值
}

export function StrokeWidthSlider({
  value,
  onChange,
  min = 1,
  max = 20,
}: StrokeWidthSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-medium text-muted-foreground">
          线条宽度
        </Label>
        <span className="text-xs font-mono text-muted-foreground">
          {value}px
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values: number[]) => onChange(values[0])}
        min={min}
        max={max}
        step={1}
        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        aria-label="Stroke width"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}px</span>
        <span>{max}px</span>
      </div>
    </div>
  );
}
