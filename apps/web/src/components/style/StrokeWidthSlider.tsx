import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface StrokeWidthSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
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
          Stroke Width
        </Label>
        <span className="text-xs text-muted-foreground font-mono">{value}px</span>
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
      <div className="flex justify-between text-[10px] text-muted-foreground px-1">
        <span>{min}px</span>
        <span>{max}px</span>
      </div>
    </div>
  );
}