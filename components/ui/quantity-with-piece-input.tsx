"use client";

import { ErrorMessage, Field, useFormikContext } from "formik";
import { CornerDownRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { FormikValueUnitInput } from "@/components/ui/value-unit-input";
import type { UnitOption } from "@/types";

interface QuantityWithPieceInputProps {
  label: string;
  id?: string;
  quantityName: string;
  unitName: string;
  /** Formik field name for the shared quantityPerPiece value */
  pieceQuantityName: string;
  /** The unit to display read-only next to the per-piece input (the other quantity's unit) */
  pieceUnit: string;
  unitOptions?: UnitOption[];
  placeholder?: string;
  min?: number;
  step?: number;
  /** className forwarded to the main ValueUnitInput container (e.g. "h-9") */
  inputClassName?: string;
  labelClassName?: string;
  pieceLabel?: string;
}

export function QuantityWithPieceInput({
  label,
  id,
  quantityName,
  unitName,
  pieceQuantityName,
  pieceUnit,
  unitOptions,
  placeholder,
  min,
  step,
  inputClassName,
  labelClassName,
  pieceLabel = "Per piece",
}: QuantityWithPieceInputProps) {
  const { getFieldProps } = useFormikContext<any>();
  const showPieceField =
    getFieldProps(unitName).value === "pcs" && pieceUnit !== "pcs";

  return (
    <div className="w-full min-w-0">
      <Label
        htmlFor={id}
        className={cn(
          "mb-1 block text-sm font-medium text-foreground",
          labelClassName,
        )}
      >
        {label}
      </Label>

      <FormikValueUnitInput
        id={id}
        quantityName={quantityName}
        unitName={unitName}
        unitOptions={unitOptions}
        placeholder={placeholder}
        min={min}
        step={step}
        className={inputClassName}
      />
      <ErrorMessage
        name={quantityName}
        component="p"
        className="mt-1 flex items-center gap-1 text-xs text-destructive"
      />
      <ErrorMessage
        name={unitName}
        component="p"
        className="mt-1 flex items-center gap-1 text-xs text-destructive"
      />

      {showPieceField && (
        <div className="mt-2 flex min-w-0 items-start gap-1.5 pl-1">
          <CornerDownRight
            className="mt-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-xs text-muted-foreground">
              {pieceLabel}
            </span>
            <div
              className={cn(
                "flex min-w-0 items-center rounded-md border border-input bg-background",
                "ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                inputClassName ?? "h-10",
              )}
            >
              <Field
                name={pieceQuantityName}
                type="number"
                min={0}
                step={0.0001}
                placeholder="0"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div className="my-1 w-px shrink-0 self-stretch bg-input" />
              <span className="shrink-0 px-2 text-sm font-medium text-foreground">
                {pieceUnit}
              </span>
            </div>
            <ErrorMessage
              name={pieceQuantityName}
              component="p"
              className="mt-1 text-xs text-destructive"
            />
          </div>
        </div>
      )}
    </div>
  );
}
