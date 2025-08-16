export interface UnitOption {
  value: string;
  label: string;
  category: "weight" | "volume" | "count";
  conversionToGrams: number;
  isDefault?: boolean;
}

export interface UnitConversion {
  unit: string;
  toGrams: number;
  category: "weight" | "volume" | "count";
}
