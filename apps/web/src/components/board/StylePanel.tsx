import { Palette } from "lucide-react";
import { useWhiteboardStore } from "../../store/whiteboardStore";
import { ColorSelector } from "../style/ColorSelector";
import { FillColorSelector } from "../style/FillColorSelector";
import { LineStyleSelector } from "../style/LineStyleSelector";
import { StrokeWidthSlider } from "../style/StrokeWidthSlider";

// Excalidraw-inspired color palette
const PRESET_COLORS = [
  "#1e1e1e", // Black
  "#e03131", // Red
  "#2f9e44", // Green
  "#1971c2", // Blue
  "#f08c00", // Orange
  "#9c36b5", // Purple
  "#0c8599", // Teal
  "#e64980", // Pink
  "#868e96", // Gray
  "#ffffff", // White
];

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

/**
 * 样式面板组件
 * 聚合所有样式控制组件，支持描边颜色、填充颜色、描边宽度和线型选择
 * 橡皮擦工具时不显示
 */
export function StylePanel() {
  const currentStyle = useWhiteboardStore((s) => s.currentStyle);
  const setCurrentStyle = useWhiteboardStore((s) => s.setCurrentStyle);
  const currentTool = useWhiteboardStore((s) => s.currentTool);

  // 橡皮擦工具不显示样式面板
  if (currentTool === "eraser") {
    return null;
  }

  return (
    <div className="fixed left-4 top-20 w-52 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-200">
        <Palette size={14} className="text-gray-500" />
        <span className="text-xs font-medium text-gray-700">Style</span>
      </div>

      <div className="p-3 space-y-4">
        {/* Stroke Color */}
        <ColorSelector
          value={currentStyle.strokeColor}
          onChange={(color) => setCurrentStyle({ strokeColor: color })}
          presetColors={PRESET_COLORS}
        />

        {/* Fill Color - only for shapes */}
        {(currentTool === "rectangle" || currentTool === "circle") && (
          <FillColorSelector
            value={currentStyle.fillColor}
            onChange={(color) => setCurrentStyle({ fillColor: color })}
            presetColors={FILL_PRESET_COLORS}
          />
        )}

        {/* Stroke Width */}
        <StrokeWidthSlider
          value={currentStyle.strokeWidth}
          onChange={(width) => setCurrentStyle({ strokeWidth: width })}
        />

        {/* Line Style */}
        <LineStyleSelector
          value={currentStyle.strokeDashArray}
          onChange={(dashArray) =>
            setCurrentStyle({ strokeDashArray: dashArray })
          }
        />
      </div>
    </div>
  );
}
