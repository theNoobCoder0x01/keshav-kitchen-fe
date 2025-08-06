import { useMemo } from "react";

interface UseComponentAccessibilityOptions {
  id?: string;
  helperText?: React.ReactNode;
  error?: boolean;
  componentType?: string;
}

interface UseComponentAccessibilityResult {
  inputId: string;
  helperTextId: string | undefined;
  ariaProps: {
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  };
}

export const useComponentAccessibility = ({
  id,
  helperText,
  error = false,
  componentType = "component",
}: UseComponentAccessibilityOptions): UseComponentAccessibilityResult => {
  const inputId = useMemo(() => {
    return id || `${componentType}-${Math.random().toString(36).substr(2, 9)}`;
  }, [id, componentType]);

  const helperTextId = useMemo(() => {
    return helperText ? `${inputId}-helper` : undefined;
  }, [inputId, helperText]);

  const ariaProps = useMemo(
    () => ({
      "aria-invalid": error,
      "aria-describedby": helperTextId,
    }),
    [error, helperTextId],
  );

  return {
    inputId,
    helperTextId,
    ariaProps,
  };
};
