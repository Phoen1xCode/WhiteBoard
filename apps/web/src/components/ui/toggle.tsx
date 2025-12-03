import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toggleVariants> {
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

function Toggle({
  className,
  variant,
  size,
  pressed,
  onPressedChange,
  onClick,
  ...props
}: ToggleProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onPressedChange?.(!pressed)
    onClick?.(e)
  }

  return (
    <button
      type="button"
      aria-pressed={pressed}
      data-state={pressed ? "on" : "off"}
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
