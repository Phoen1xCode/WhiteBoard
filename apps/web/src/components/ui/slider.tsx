import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  className?: string
  value?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
  disabled?: boolean
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({
    className,
    value,
    defaultValue = [0],
    min = 0,
    max = 100,
    step = 1,
    onValueChange,
    disabled = false,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const currentValue = value ?? internalValue
    const trackRef = React.useRef<HTMLDivElement>(null)

    const percentage = ((currentValue[0] - min) / (max - min)) * 100

    const updateValue = (clientX: number) => {
      if (disabled || !trackRef.current) return

      const rect = trackRef.current.getBoundingClientRect()
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const rawValue = min + percent * (max - min)
      const steppedValue = Math.round(rawValue / step) * step
      const clampedValue = Math.max(min, Math.min(max, steppedValue))

      const newValue = [clampedValue]
      setInternalValue(newValue)
      onValueChange?.(newValue)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
      if (disabled) return
      e.preventDefault()
      updateValue(e.clientX)

      const handleMouseMove = (e: MouseEvent) => {
        updateValue(e.clientX)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return

      let newValue = currentValue[0]
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          newValue = Math.min(max, currentValue[0] + step)
          break
        case 'ArrowLeft':
        case 'ArrowDown':
          newValue = Math.max(min, currentValue[0] - step)
          break
        case 'Home':
          newValue = min
          break
        case 'End':
          newValue = max
          break
        default:
          return
      }

      e.preventDefault()
      const newValueArray = [newValue]
      setInternalValue(newValueArray)
      onValueChange?.(newValueArray)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <div
          ref={trackRef}
          className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20 cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute h-full bg-primary"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <button
          type="button"
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentValue[0]}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          className="absolute block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
          style={{ left: `calc(${percentage}% - 8px)` }}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
