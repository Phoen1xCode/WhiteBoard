import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { toggleVariants } from "@/components/ui/toggle-variants";
import { cn } from "@/lib/utils";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    value?: string;
    onValueChange?: (value: string) => void;
  }
>({
  size: "default",
  variant: "default",
});

interface ToggleGroupProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toggleVariants> {
  type: "single";
  value?: string;
  onValueChange?: (value: string) => void;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, variant, size, children, value, onValueChange, ...props }, ref) => (
    <div
      ref={ref}
      role="radiogroup"
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, value, onValueChange }}>
        {children}
      </ToggleGroupContext.Provider>
    </div>
  ),
);
ToggleGroup.displayName = "ToggleGroup";

interface ToggleGroupItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof toggleVariants> {
  value: string;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, children, variant, size, value, onClick, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext);
    const isPressed = context.value === value;

    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
      context.onValueChange?.(isPressed ? "" : value);
      onClick?.(event);
    }

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isPressed}
        aria-pressed={isPressed}
        data-state={isPressed ? "on" : "off"}
        className={cn(
          toggleVariants({
            variant: context.variant ?? variant,
            size: context.size ?? size,
          }),
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  },
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
