import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
  delayDuration: number
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

function TooltipProvider({ children, delayDuration = 400 }: TooltipProviderProps) {
  return (
    <TooltipProviderContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipProviderContext.Provider>
  )
}

const TooltipProviderContext = React.createContext({ delayDuration: 400 })

interface TooltipProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function Tooltip({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLElement>(null)
  const providerContext = React.useContext(TooltipProviderContext)

  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = (newOpen: boolean) => {
    setUncontrolledOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef, delayDuration: providerContext.delayDuration }}>
      {children}
    </TooltipContext.Provider>
  )
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean
}

const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ children, asChild, ...props }, ref) => {
    const context = React.useContext(TooltipContext)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    if (!context) throw new Error("TooltipTrigger must be used within Tooltip")

    const handleMouseEnter = () => {
      timeoutRef.current = setTimeout(() => {
        context.setOpen(true)
      }, context.delayDuration)
    }

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      context.setOpen(false)
    }

    const handleFocus = () => {
      context.setOpen(true)
    }

    const handleBlur = () => {
      context.setOpen(false)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {children}
      </button>
    )
  }
)
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = "top", sideOffset = 4, children, ...props }, ref) => {
    const context = React.useContext(TooltipContext)

    if (!context) throw new Error("TooltipContent must be used within Tooltip")

    if (!context.open) return null

    const sideStyles: Record<string, string> = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
    }

    return (
      <div
        ref={ref}
        role="tooltip"
        className={cn(
          "absolute z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md animate-in fade-in-0 zoom-in-95",
          sideStyles[side],
          className
        )}
        style={{ marginTop: side === "bottom" ? sideOffset : undefined, marginBottom: side === "top" ? sideOffset : undefined }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
