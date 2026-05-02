import type { MealType } from "./menus";
import type { KitchenPersonType } from "./kitchens";
import type { UnitValue } from "./units";

export interface MenuComponentAverageInput {
  id?: string;
  personTypeId: string;
  quantity: number;
  unit: UnitValue;
  weightPerPiece?: number | null;
  weightPerPieceUnit?: "g" | "kg" | null;
}

export interface MenuComponentAverageApiItem extends MenuComponentAverageInput {
  id: string;
  menuComponentId: string;
  personType: Pick<KitchenPersonType, "id" | "name" | "description">;
  weightPerPiece: number | null;
  weightPerPieceUnit: "g" | "kg" | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface MenuComponentInput {
  id?: string;
  name: string;
  label: string;
  mealType: MealType;
  sequenceNumber: number;
  averages: MenuComponentAverageInput[];
}

export interface MenuComponentApiItem extends MenuComponentInput {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  averages: MenuComponentAverageApiItem[];
}
