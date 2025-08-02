import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "filled" | "ghost";
  inputSize?: "sm" | "md" | "lg";
  error?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helper?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant = "default",
    inputSize = "md",
    error = false,
    success = false,
    leftIcon,
    rightIcon,
    helper,
    label,
    id,
    ...props 
  }, ref) => {
    const inputId = id || React.useId();
    const helperId = helper ? `${inputId}-helper` : undefined;

    const inputClasses = cn(
      // Base styles
      "flex w-full border transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      
      // Size variants
      {
        "h-9 px-3 py-2 text-sm": inputSize === "sm",
        "h-11 px-4 py-3 text-sm": inputSize === "md",
        "h-12 px-5 py-4 text-base": inputSize === "lg",
      },
      
      // Style variants
      {
        // Default variant
        "border-neutral-300 bg-background rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary hover:border-neutral-400": variant === "default",
        
        // Filled variant
        "border-transparent bg-neutral-100 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:bg-background hover:bg-neutral-50": variant === "filled",
        
        // Ghost variant
        "border-transparent bg-transparent rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-neutral-300 hover:bg-neutral-50": variant === "ghost",
      },
      
      // State styles
      {
        "border-error focus-visible:ring-error": error,
        "border-success focus-visible:ring-success": success,
      },
      
      // Icon padding
      {
        "pl-10": leftIcon && inputSize === "sm",
        "pl-12": leftIcon && inputSize === "md", 
        "pl-14": leftIcon && inputSize === "lg",
        "pr-10": rightIcon && inputSize === "sm",
        "pr-12": rightIcon && inputSize === "md",
        "pr-14": rightIcon && inputSize === "lg",
      },
      
      className
    );

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-foreground block"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              "absolute left-0 top-0 flex items-center justify-center text-muted-foreground pointer-events-none",
              {
                "h-9 w-10": inputSize === "sm",
                "h-11 w-12": inputSize === "md",
                "h-12 w-14": inputSize === "lg",
              }
            )}>
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            className={inputClasses}
            ref={ref}
            id={inputId}
            aria-describedby={helperId}
            aria-invalid={error}
            {...props}
          />
          
          {rightIcon && (
            <div className={cn(
              "absolute right-0 top-0 flex items-center justify-center text-muted-foreground pointer-events-none",
              {
                "h-9 w-10": inputSize === "sm",
                "h-11 w-12": inputSize === "md", 
                "h-12 w-14": inputSize === "lg",
              }
            )}>
              {rightIcon}
            </div>
          )}
        </div>
        
        {helper && (
          <p 
            id={helperId}
            className={cn(
              "text-xs leading-relaxed",
              {
                "text-error": error,
                "text-success": success,
                "text-muted-foreground": !error && !success,
              }
            )}
          >
            {helper}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// Specialized input components
const SearchInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "leftIcon" | "type">>(
  ({ placeholder = "Search...", ...props }, ref) => (
    <Input
      ref={ref}
      type="search"
      placeholder={placeholder}
      leftIcon={
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      {...props}
    />
  )
);
SearchInput.displayName = "SearchInput";

const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "rightIcon" | "type">>(
  ({ ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    
    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground transition-colors pointer-events-auto"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        }
        {...props}
      />
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { Input, SearchInput, PasswordInput };
