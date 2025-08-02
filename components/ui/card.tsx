import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "outlined" | "elevated" | "glass";
    hover?: boolean;
  }
>(({ className, variant = "default", hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl bg-card text-card-foreground transition-all duration-300",
      {
        // Default card with subtle shadow
        "border border-neutral-200 shadow-modern": variant === "default",
        // Outlined card with border emphasis
        "border-2 border-neutral-300 shadow-sm": variant === "outlined",
        // Elevated card with stronger shadow
        "border border-neutral-100 shadow-modern-lg": variant === "elevated", 
        // Glass morphism card
        "glass border-white/20": variant === "glass",
      },
      hover && "card-hover cursor-pointer",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    centered?: boolean;
  }
>(({ className, centered = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-2 p-6",
      centered && "items-center text-center",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: boolean;
    size?: "sm" | "md" | "lg" | "xl";
  }
>(({ className, gradient = false, size = "md", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-semibold leading-tight tracking-tight",
      {
        "text-lg": size === "sm",
        "text-xl": size === "md", 
        "text-2xl": size === "lg",
        "text-3xl": size === "xl",
      },
      gradient && "text-gradient",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    muted?: boolean;
  }
>(({ className, muted = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm leading-relaxed",
      muted ? "text-muted-foreground" : "text-foreground",
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    noPadding?: boolean;
  }
>(({ className, noPadding = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      !noPadding && "p-6 pt-0", 
      className
    )} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    justified?: boolean;
    centered?: boolean;
  }
>(({ className, justified = false, centered = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0 gap-4",
      {
        "justify-between": justified,
        "justify-center": centered,
        "justify-start": !justified && !centered,
      },
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// New modern card variants
const StatusCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    status: "success" | "error" | "warning" | "info";
    title: string;
    description?: string;
    icon?: React.ReactNode;
  }
>(({ className, status, title, description, icon, ...props }, ref) => {
  const statusStyles = {
    success: "border-l-4 border-l-success bg-success/5",
    error: "border-l-4 border-l-error bg-error/5", 
    warning: "border-l-4 border-l-yellow-500 bg-yellow-50",
    info: "border-l-4 border-l-primary bg-primary/5",
  };

  return (
    <Card
      ref={ref}
      className={cn(
        "border-l-4",
        statusStyles[status],
        className
      )}
      {...props}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex-shrink-0 mt-0.5">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{title}</h4>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
StatusCard.displayName = "StatusCard";

const MetricCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title: string;
    value: string | number;
    change?: {
      value: string | number;
      type: "increase" | "decrease" | "neutral";
    };
    icon?: React.ReactNode;
    trend?: React.ReactNode;
  }
>(({ className, title, value, change, icon, trend, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("hover:shadow-modern-lg transition-all duration-300", className)}
    {...props}
  >
    <CardContent className="pt-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        {change && (
          <span
            className={cn(
              "text-xs font-medium",
              {
                "text-success": change.type === "increase",
                "text-error": change.type === "decrease", 
                "text-neutral-500": change.type === "neutral",
              }
            )}
          >
            {change.type === "increase" && "↗"}
            {change.type === "decrease" && "↘"}
            {change.type === "neutral" && "→"}
            {change.value}
          </span>
        )}
      </div>
      {trend && (
        <div className="mt-3">
          {trend}
        </div>
      )}
    </CardContent>
  </Card>
));
MetricCard.displayName = "MetricCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatusCard,
  MetricCard,
};
