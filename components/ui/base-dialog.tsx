import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
  children: ReactNode;
  footer?: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  className?: string;
  contentClassName?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  size = "md",
  children,
  footer,
  showCloseButton = true,
  onClose,
  className,
  contentClassName,
}: BaseDialogProps) {
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(sizeClasses[size], "max-h-[90vh]", className)}
      >
        <div className={cn("overflow-y-auto", contentClassName)}>
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  {icon}
                </div>
              )}
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="text-muted-foreground mt-1">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="py-6">{children}</div>

          {footer && (
            <>
              <Separator className="my-4" />
              <DialogFooter className="flex justify-end gap-2 pt-4">
                {showCloseButton && (
                  <Button variant="outline" onClick={handleClose} type="button">
                    Cancel
                  </Button>
                )}
                {footer}
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Convenience component for simple forms
export interface SimpleFormDialogProps
  extends Omit<BaseDialogProps, "children" | "footer"> {
  onSubmit: () => void;
  submitLabel?: string;
  submitVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  isSubmitting?: boolean;
  children: ReactNode;
}

export function SimpleFormDialog({
  onSubmit,
  submitLabel = "Save",
  submitVariant = "default",
  isSubmitting = false,
  children,
  ...props
}: SimpleFormDialogProps) {
  return (
    <BaseDialog
      {...props}
      footer={
        <Button
          onClick={onSubmit}
          variant={submitVariant}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      }
    >
      {children}
    </BaseDialog>
  );
}
