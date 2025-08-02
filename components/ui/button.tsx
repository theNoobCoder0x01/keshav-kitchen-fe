import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-modern hover:bg-primary/90 hover:shadow-modern-lg hover:scale-[1.02] active:scale-[0.98]",
        destructive: "bg-error text-error-foreground shadow-modern hover:bg-error/90 hover:shadow-modern-lg hover:scale-[1.02] active:scale-[0.98]",
        outline: "border-2 border-neutral-300 bg-background text-foreground shadow-modern hover:bg-neutral-50 hover:border-primary hover:text-primary hover:shadow-modern-md hover:scale-[1.02] active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground shadow-modern hover:bg-secondary/90 hover:shadow-modern-lg hover:scale-[1.02] active:scale-[0.98]",
        ghost: "text-foreground hover:bg-neutral-100 hover:text-primary hover:scale-[1.02] active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        success: "bg-success text-success-foreground shadow-modern hover:bg-success/90 hover:shadow-modern-lg hover:scale-[1.02] active:scale-[0.98]",
        gradient: "bg-gradient-primary text-white shadow-modern-lg hover:shadow-modern-xl hover:scale-[1.02] active:scale-[0.98] border-0"
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-md px-4 py-2 text-xs",
        lg: "h-12 rounded-lg px-8 py-4 text-base",
        xl: "h-14 rounded-xl px-10 py-5 text-lg font-semibold",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-12 w-12"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {/* Shine effect for gradient buttons */}
        {variant === "gradient" && (
          <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        )}
        
        {/* Loading spinner */}
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        
        {/* Left icon */}
        {leftIcon && !loading && (
          <span className="mr-1">{leftIcon}</span>
        )}
        
        {/* Button content */}
        <span className="relative z-10">{children}</span>
        
        {/* Right icon */}
        {rightIcon && (
          <span className="ml-1">{rightIcon}</span>
        )}
        
        {/* Ripple effect container */}
        <span className="absolute inset-0 overflow-hidden rounded-lg">
          <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-200 hover:opacity-100" />
        </span>
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
