"use client";

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
import { useTranslation } from "@/lib/hooks/use-translation";
import { DEFAULT_UNIT, UNIT_OPTIONS } from "@/lib/constants/units";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { Package } from "lucide-react";
import * as Yup from "yup";

interface AddEditIngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIngredient?: {
    id?: string;
    name: string;
    costPerKg: number;
    unit: string;
  } | null;
  onSave: (ingredient: {
    name: string;
    costPerKg: number;
    unit: string;
    id?: string;
  }) => void;
}

export function AddEditIngredientDialog({
  open,
  onOpenChange,
  initialIngredient = null,
  onSave,
}: AddEditIngredientDialogProps) {
  const { t } = useTranslation();
  
  const validationSchema = Yup.object({
    name: Yup.string().trim().required(t("ingredients.nameRequired")),
    costPerKg: Yup.number()
      .required(t("ingredients.costRequired"))
      .min(0, t("ingredients.costCannotBeNegative")),
    unit: Yup.string().required(t("ingredients.unitRequired")),
  });

  const initialValues = {
    name: initialIngredient?.name || "",
    costPerKg: initialIngredient?.costPerKg || 0,
    unit: initialIngredient?.unit || DEFAULT_UNIT,
  };

  const handleSubmit = (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    onSave({
      name: values.name.trim(),
      costPerKg: Number(values.costPerKg),
      unit: values.unit.trim(),
      id: initialIngredient?.id,
    });
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialIngredient ? t("ingredients.editIngredient") : t("ingredients.addIngredient")}
      description={
        initialIngredient
          ? t("ingredients.updateIngredientDetails")
          : t("ingredients.createNewIngredient")
      }
      icon={<Package className="w-5 h-5 text-primary-foreground" />}
      size="md"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  {t("ingredients.ingredientName")} *
                </Label>
                <Field
                  as={Input}
                  name="name"
                  placeholder={t("ingredients.enterIngredientName")}
                  className="border-border focus:border-primary focus:ring-primary/20"
                />
                <ErrorMessage
                  name="name"
                  component="p"
                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  {t("ingredients.costPerUnit")} (₹) *
                </Label>
                <Field
                  as={Input}
                  name="costPerKg"
                  type="number"
                  placeholder="30"
                  min="0"
                  step="0.01"
                  className="border-border focus:border-primary focus:ring-primary/20"
                />
                <ErrorMessage
                  name="costPerKg"
                  component="p"
                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  {t("ingredients.unit")} *
                </Label>
                <Field name="unit">
                  {({ field }: { field: any }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange({
                          target: { name: field.name, value },
                        })
                      }
                    >
                      <SelectTrigger className="border-border focus:border-primary focus:ring-primary/20">
                        <SelectValue placeholder={t("ingredients.selectUnit")} />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unitOption) => (
                          <SelectItem
                            key={unitOption.value}
                            value={unitOption.value}
                          >
                            {unitOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
                <ErrorMessage
                  name="unit"
                  component="p"
                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border text-foreground hover:bg-muted bg-transparent"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    {t("common.saving")}
                  </>
                ) : initialIngredient ? (
                  t("common.saveChanges")
                ) : (
                  t("ingredients.addIngredient")
                )}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </BaseDialog>
  );
}
