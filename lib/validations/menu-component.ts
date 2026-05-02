import { MealType } from "@prisma/client";
import { z } from "zod";

const quantitySchema = z.coerce
  .number()
  .positive("Quantity must be greater than 0");

const weightPerPieceSchema = z.preprocess((value) => {
  if (value === "" || value == null) {
    return null;
  }

  return Number(value);
}, z.number().positive("Weight per piece must be greater than 0").nullable());

export const MenuComponentAverageSchema = z
  .object({
    id: z.string().optional(),
    personTypeId: z.string().trim().min(1, "Person type is required"),
    quantity: quantitySchema,
    unit: z.enum(["g", "kg", "pcs"]),
    weightPerPiece: weightPerPieceSchema,
    weightPerPieceUnit: z.enum(["g", "kg"]).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.unit === "pcs") {
      if (value.weightPerPiece == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["weightPerPiece"],
          message: "Weight per piece is required when using pcs",
        });
      }

      if (!value.weightPerPieceUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["weightPerPieceUnit"],
          message: "Weight per piece unit is required when using pcs",
        });
      }
    } else {
      if (value.weightPerPiece != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["weightPerPiece"],
          message: "Weight per piece is only allowed when the unit is pcs",
        });
      }

      if (value.weightPerPieceUnit != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["weightPerPieceUnit"],
          message: "Weight per piece unit is only allowed when the unit is pcs",
        });
      }
    }
  });

export const MenuComponentSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required"),
  label: z.string().trim().min(1, "Label is required"),
  mealType: z.nativeEnum(MealType),
  sequenceNumber: z.coerce
    .number()
    .int("Sequence number must be a whole number")
    .min(1, "Sequence number must be at least 1"),
  averages: z
    .array(MenuComponentAverageSchema)
    .min(1, "At least one average is required")
    .superRefine((averages, ctx) => {
      const seenPersonTypes = new Set<string>();

      averages.forEach((average, index) => {
        if (seenPersonTypes.has(average.personTypeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, "personTypeId"],
            message: "Each person type can only be used once",
          });
        }

        seenPersonTypes.add(average.personTypeId);
      });
    }),
});

export type MenuComponentPayload = z.infer<typeof MenuComponentSchema>;
