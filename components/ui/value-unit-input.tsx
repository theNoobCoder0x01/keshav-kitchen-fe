"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { useFormikContext } from "formik";

import { cn } from "@/lib/utils";
import { SelectContent, SelectItem } from "@/components/ui/select";
import { UNIT_OPTIONS } from "@/lib/constants/units";
import type { UnitOption } from "@/types";

interface ValueUnitInputProps {
  value: string | number;
  onValueChange: (value: string) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  unitOptions?: UnitOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function ValueUnitInput({
  value,
  onValueChange,
  unit,
  onUnitChange,
  unitOptions = UNIT_OPTIONS,
  placeholder,
  min,
  max,
  step,
  disabled,
  className,
  id,
}: ValueUnitInputProps) {
  return (
    <div
      className={cn(
        "flex h-10 items-center rounded-md border border-input bg-background ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <div className="w-px self-stretch bg-input my-1" />
      <SelectPrimitive.Root
        value={unit}
        onValueChange={onUnitChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          className={cn(
            "flex items-center gap-0.5 rounded-r-md px-2 py-2 text-sm font-medium text-foreground focus:outline-none disabled:cursor-not-allowed data-[placeholder]:text-muted-foreground",
            "min-w-[3rem] justify-center",
          )}
        >
          <span className="shrink-0">{unit}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectContent>
            {unitOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

interface FormikValueUnitInputProps {
  quantityName: string;
  unitName: string;
  unitOptions?: UnitOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  onUnitChange?: (value: string) => void;
}

export function FormikValueUnitInput({
  quantityName,
  unitName,
  unitOptions,
  onUnitChange,
  ...props
}: FormikValueUnitInputProps) {
  const { getFieldProps, setFieldValue } = useFormikContext<any>();
  const quantityField = getFieldProps(quantityName);
  const unitField = getFieldProps(unitName);

  return (
    <ValueUnitInput
      value={quantityField.value ?? ""}
      onValueChange={(val) => setFieldValue(quantityName, val)}
      unit={unitField.value ?? ""}
      onUnitChange={(val) => {
        setFieldValue(unitName, val);
        onUnitChange?.(val);
      }}
      unitOptions={unitOptions}
      {...props}
    />
  );
}
