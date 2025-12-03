import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function Popover({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = (newOpen: boolean) => {
    setUncontrolledOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const context = React.useContext(PopoverContext)

    if (!context) throw new Error("PopoverTrigger must be used within Popover")

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      context.setOpen(!context.open)
      onClick?.(e)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onClick: handleClick,
        "aria-expanded": context.open,
        "aria-haspopup": "dialog",
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        aria-expanded={context.open}
        aria-haspopup="dialog"
        {...props}
      >
        {children}
      </button>
    )
  }
)
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverAnchor = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
)
PopoverAnchor.displayName = "PopoverAnchor"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", side = "bottom", sideOffset = 4, children, ...props }, ref) => {
    const context = React.useContext(PopoverContext)
    const contentRef = React.useRef<HTMLDivElement>(null)

    if (!context) throw new Error("PopoverContent must be used within Popover")

    // Close on click outside
    React.useEffect(() => {
      if (!context.open) return

      const handleClickOutside = (e: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          context.setOpen(false)
        }
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          context.setOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscape)
      }
    }, [context.open, context])

    if (!context.open) return null

    const alignStyles: Record<string, string> = {
      start: "left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "right-0",
    }

    const sideStyles: Record<string, string> = {
      top: "bottom-full mb-2",
      bottom: "top-full mt-2",
      left: "right-full mr-2",
      right: "left-full ml-2",
    }

    return (
      <div
        ref={(node) => {
          contentRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        role="dialog"
        className={cn(
          "absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
          sideStyles[side],
          alignStyles[align],
          className
        )}
        style={{ marginTop: side === "bottom" ? sideOffset : undefined }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
