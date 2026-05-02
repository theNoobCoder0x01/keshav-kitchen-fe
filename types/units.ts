export type UnitCategory = "weight" | "volume" | "count";

export type SupportedUnitValue =
  | "kg"
  | "g"
  | "L"
  | "ml"
  | "cup"
  | "tbsp"
  | "tsp"
  | "pcs";

export type UnitValue = SupportedUnitValue | (string & {});

export interface UnitOption {
  value: SupportedUnitValue;
  label: string;
  category: UnitCategory;
  conversionToGrams: number;
  isDefault?: boolean;
}

export interface UnitConversion {
  unit: SupportedUnitValue;
  toGrams: number;
  category: UnitCategory;
}

export interface QuantityWithUnit {
  quantity: number;
  unit: string | null | undefined;
}

export interface AggregatedQuantity {
  quantity: number;
  unit: UnitValue;
  category: UnitCategory | "unknown";
  wasConverted: boolean;
}
