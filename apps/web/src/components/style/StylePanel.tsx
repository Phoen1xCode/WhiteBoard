import { useWhiteboardStore } from "../../store/whiteboardStore";
import { ColorSelector } from "./ColorSelector";
import { StrokeWidthSlider } from "./StrokeWidthSlider";
import { LineStyleSelector } from "./LineStyleSelector";
import { FillColorSelector } from "./FillColorSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRESET_COLORS = [
  "#000000", // Black
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
  "#FFC0CB", // Pink
];

export function StylePanel() {
  const currentStyle = useWhiteboardStore((s) => s.currentStyle);
  const setCurrentStyle = useWhiteboardStore((s) => s.setCurrentStyle);

  return (
    <Card className="fixed right-4 top-1/2 -translate-y-1/2 w-64 shadow-xl border-border/50 backdrop-blur-sm bg-background/95 supports-[backdrop-filter]:bg-background/60">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">Style Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-4 pb-4">
        {/* Stroke Color */}
        <ColorSelector
          label="Stroke Color"
          value={currentStyle.strokeColor}
          onChange={(color) => setCurrentStyle({ strokeColor: color })}
          presetColors={PRESET_COLORS}
        />

        {/* Stroke Width */}
        <StrokeWidthSlider
          value={currentStyle.strokeWidth}
          onChange={(width) => setCurrentStyle({ strokeWidth: width })}
        />

        {/* Line Style */}
        <LineStyleSelector
          value={currentStyle.strokeDashArray}
          onChange={(dashArray) => setCurrentStyle({ strokeDashArray: dashArray })}
        />

        {/* Fill Color */}
        <FillColorSelector
          value={currentStyle.fillColor}
          onChange={(color) => setCurrentStyle({ fillColor: color })}
        />
      </CardContent>
    </Card>
  );
}
