import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KitchenPersonType } from "@/types/kitchens";
import {
  MealType,
  MealTypeEnum,
  MenuComponentAverageInput,
  MenuComponentInput,
} from "@/types";
import { ErrorMessage, Field, FieldArray, Formik } from "formik";
import { Plus, Trash2 } from "lucide-react";
import * as Yup from "yup";

export interface MenuComponentForm extends MenuComponentInput {}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMenuComponent?: MenuComponentForm | null;
  personTypes: KitchenPersonType[];
  onSave: (
    menuComponent: MenuComponentForm,
  ) => boolean | void | Promise<boolean | void>;
}

const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];
const mealTypesObj = {
  [MealTypeEnum.BREAKFAST]: "Breakfast",
  [MealTypeEnum.LUNCH]: "Lunch",
  [MealTypeEnum.DINNER]: "Dinner",
  [MealTypeEnum.SNACK]: "Snack",
};

const quantityUnits = ["g", "kg", "pcs"] as const;
const weightUnits = ["g", "kg"] as const;

const createEmptyAverage = (): MenuComponentAverageInput => ({
  personTypeId: "",
  quantity: 1,
  unit: "g",
  weightPerPiece: null,
  weightPerPieceUnit: null,
});

const averageValidationSchema = Yup.object({
  personTypeId: Yup.string().trim().required("Person type is required"),
  quantity: Yup.number()
    .typeError("Quantity must be a number")
    .moreThan(0, "Quantity must be greater than 0")
    .required("Quantity is required"),
  unit: Yup.string()
    .oneOf(quantityUnits as unknown as string[])
    .required("Unit is required"),
  weightPerPiece: Yup.number()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue == null ? null : value,
    )
    .when("unit", {
      is: "pcs",
      then: (schema) =>
        schema
          .typeError("Weight per piece must be a number")
          .moreThan(0, "Weight per piece must be greater than 0")
          .required("Weight per piece is required when using pcs"),
      otherwise: (schema) => schema.nullable(),
    }),
  weightPerPieceUnit: Yup.string()
    .nullable()
    .when("unit", {
      is: "pcs",
      then: (schema) =>
        schema
          .oneOf(weightUnits as unknown as string[])
          .required("Weight unit is required when using pcs"),
      otherwise: (schema) => schema.nullable(),
    }),
});

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required("Name is required"),
  label: Yup.string().trim().required("Label is required"),
  mealType: Yup.string().oneOf(mealTypes).required("Meal type is required"),
  sequenceNumber: Yup.number()
    .typeError("Sequence number must be a number")
    .integer("Sequence number must be a whole number")
    .min(1, "Sequence number must be at least 1")
    .required("Sequence number is required"),
  averages: Yup.array()
    .of(averageValidationSchema)
    .min(1, "At least one average is required")
    .test(
      "unique-person-types",
      "Each person type can only be used once",
      (averages) => {
        if (!averages) {
          return true;
        }

        const ids = averages
          .map((average) => average.personTypeId)
          .filter(Boolean);
        return ids.length === new Set(ids).size;
      },
    ),
});

function normalizeMenuComponent(values: MenuComponentForm): MenuComponentForm {
  return {
    ...values,
    sequenceNumber: Number(values.sequenceNumber),
    averages: values.averages.map((average) => ({
      ...average,
      quantity: Number(average.quantity),
      weightPerPiece:
        average.unit === "pcs" ? Number(average.weightPerPiece) : null,
      weightPerPieceUnit:
        average.unit === "pcs" ? average.weightPerPieceUnit : null,
    })),
  };
}

function getInitialValues(
  initialMenuComponent?: MenuComponentForm | null,
): MenuComponentForm {
  if (!initialMenuComponent) {
    return {
      name: "",
      label: "",
      mealType: "LUNCH",
      sequenceNumber: 1,
      averages: [createEmptyAverage()],
    };
  }

  return {
    id: initialMenuComponent.id,
    name: initialMenuComponent.name,
    label: initialMenuComponent.label,
    mealType: initialMenuComponent.mealType,
    sequenceNumber: initialMenuComponent.sequenceNumber,
    averages:
      initialMenuComponent.averages?.length > 0
        ? initialMenuComponent.averages.map((average) => ({
            id: average.id,
            personTypeId: average.personTypeId,
            quantity: average.quantity,
            unit: average.unit,
            weightPerPiece: average.weightPerPiece ?? null,
            weightPerPieceUnit: average.weightPerPieceUnit ?? null,
          }))
        : [createEmptyAverage()],
  };
}

export function AddEditMenuComponentDialog({
  open,
  onOpenChange,
  initialMenuComponent,
  personTypes,
  onSave,
}: Props) {
  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        initialMenuComponent?.id ? "Edit menu component" : "Add menu component"
      }
      description="Configure the component details and per-person consumption averages."
      icon={null}
      size="lg"
    >
      <Formik<MenuComponentForm>
        initialValues={getInitialValues(initialMenuComponent)}
        validationSchema={validationSchema}
        onSubmit={async (values, { resetForm, setSubmitting }) => {
          try {
            const saved = await onSave(normalizeMenuComponent(values));
            if (saved !== false) {
              resetForm();
              onOpenChange(false);
            }
          } finally {
            setSubmitting(false);
          }
        }}
        enableReinitialize
      >
        {({
          handleSubmit,
          isSubmitting,
          values,
          setFieldTouched,
          setFieldValue,
        }) => (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Field name="name">
                  {({ field }: { field: any }) => (
                    <Input {...field} id="name" required />
                  )}
                </Field>
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-destructive text-xs mt-1"
                />
              </div>
              <div>
                <Label htmlFor="label">Label</Label>
                <Field name="label">
                  {({ field }: { field: any }) => (
                    <Input {...field} id="label" required />
                  )}
                </Field>
                <ErrorMessage
                  name="label"
                  component="div"
                  className="text-destructive text-xs mt-1"
                />
              </div>
              <div>
                <Label htmlFor="mealType">Meal type</Label>
                <Field name="mealType">
                  {({ field }: { field: any }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        setFieldTouched(field.name, true, false);
                        field.onChange({
                          target: { name: field.name, value },
                        });
                      }}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {mealTypes.map((type: MealType) => (
                          <SelectItem key={type} value={type}>
                            {mealTypesObj[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
                <ErrorMessage
                  name="mealType"
                  component="div"
                  className="text-destructive text-xs mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sequenceNumber">Sequence number</Label>
                <Field name="sequenceNumber">
                  {({ field }: { field: any }) => (
                    <Input
                      {...field}
                      id="sequenceNumber"
                      type="number"
                      min={1}
                      step={1}
                      required
                    />
                  )}
                </Field>
                <ErrorMessage
                  name="sequenceNumber"
                  component="div"
                  className="text-destructive text-xs mt-1"
                />
              </div>
            </div>

            <FieldArray name="averages">
              {({ push, remove }) => (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">
                        Per-person averages
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Set the usual amount eaten by one person of each type.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => push(createEmptyAverage())}
                      disabled={values.averages.length >= personTypes.length}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add average
                    </Button>
                  </div>

                  <ErrorMessage
                    name="averages"
                    component="div"
                    className="text-destructive text-xs"
                  />

                  {values.averages.map((average, index) => {
                    const usesPieces = average.unit === "pcs";
                    const selectedPersonTypeIds = new Set(
                      values.averages
                        .map((item, itemIndex) =>
                          itemIndex === index ? null : item.personTypeId,
                        )
                        .filter(Boolean),
                    );

                    return (
                      <div
                        key={average.id ?? `average-${index}`}
                        className="rounded-lg border border-border p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Average {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={values.averages.length === 1}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <Label htmlFor={`averages.${index}.personTypeId`}>
                              Person type
                            </Label>
                            <Field name={`averages.${index}.personTypeId`}>
                              {({ field }: { field: any }) => (
                                <Select
                                  value={field.value}
                                  onValueChange={(value) => {
                                    setFieldTouched(field.name, true, false);
                                    field.onChange({
                                      target: { name: field.name, value },
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select person type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {personTypes.map((personType) => (
                                      <SelectItem
                                        key={personType.id}
                                        value={personType.id}
                                        disabled={selectedPersonTypeIds.has(
                                          personType.id,
                                        )}
                                      >
                                        {personType.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </Field>
                            <ErrorMessage
                              name={`averages.${index}.personTypeId`}
                              component="div"
                              className="text-destructive text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`averages.${index}.quantity`}>
                              Quantity
                            </Label>
                            <Field
                              as={Input}
                              id={`averages.${index}.quantity`}
                              name={`averages.${index}.quantity`}
                              type="number"
                              min={0}
                              step={0.0001}
                            />
                            <ErrorMessage
                              name={`averages.${index}.quantity`}
                              component="div"
                              className="text-destructive text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`averages.${index}.unit`}>
                              Unit
                            </Label>
                            <Field name={`averages.${index}.unit`}>
                              {({ field }: { field: any }) => (
                                <Select
                                  value={field.value}
                                  onValueChange={(value) => {
                                    setFieldTouched(field.name, true, false);
                                    field.onChange({
                                      target: { name: field.name, value },
                                    });

                                    if (value !== "pcs") {
                                      setFieldValue(
                                        `averages.${index}.weightPerPiece`,
                                        null,
                                      );
                                      setFieldValue(
                                        `averages.${index}.weightPerPieceUnit`,
                                        null,
                                      );
                                    } else if (
                                      !values.averages[index].weightPerPieceUnit
                                    ) {
                                      setFieldValue(
                                        `averages.${index}.weightPerPieceUnit`,
                                        "g",
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {quantityUnits.map((unit) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </Field>
                            <ErrorMessage
                              name={`averages.${index}.unit`}
                              component="div"
                              className="text-destructive text-xs mt-1"
                            />
                          </div>
                          {usesPieces ? (
                            <div>
                              <Label
                                htmlFor={`averages.${index}.weightPerPiece`}
                              >
                                Weight per piece
                              </Label>
                              <Field
                                as={Input}
                                id={`averages.${index}.weightPerPiece`}
                                name={`averages.${index}.weightPerPiece`}
                                type="number"
                                min={0}
                                step={0.0001}
                              />
                              <ErrorMessage
                                name={`averages.${index}.weightPerPiece`}
                                component="div"
                                className="text-destructive text-xs mt-1"
                              />
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground self-end pb-2">
                              Weight per piece is only needed for piece-based
                              averages.
                            </div>
                          )}
                        </div>

                        {usesPieces && (
                          <div className="mt-4 max-w-xs">
                            <Label
                              htmlFor={`averages.${index}.weightPerPieceUnit`}
                            >
                              Weight unit
                            </Label>
                            <Field
                              name={`averages.${index}.weightPerPieceUnit`}
                            >
                              {({ field }: { field: any }) => (
                                <Select
                                  value={field.value || "g"}
                                  onValueChange={(value) => {
                                    setFieldTouched(field.name, true, false);
                                    field.onChange({
                                      target: { name: field.name, value },
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {weightUnits.map((unit) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </Field>
                            <ErrorMessage
                              name={`averages.${index}.weightPerPieceUnit`}
                              component="div"
                              className="text-destructive text-xs mt-1"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </FieldArray>

            <div className="flex gap-2 justify-end mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || personTypes.length === 0}
              >
                {initialMenuComponent?.id ? "Update" : "Add"}
              </Button>
            </div>
            {personTypes.length === 0 ? (
              <p className="text-xs text-destructive">
                Add at least one person type before configuring menu component
                averages.
              </p>
            ) : null}
          </form>
        )}
      </Formik>
    </BaseDialog>
  );
}
