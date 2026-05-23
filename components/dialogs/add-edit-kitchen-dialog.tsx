"use client";

import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/use-translations";
import { trimSpecificFields } from "@/lib/utils/form-utils";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { UtensilsCrossed } from "lucide-react";
import * as Yup from "yup";

interface AddEditKitchenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKitchen?: {
    id?: string;
    name: string;
    description?: string | null;
    defaultCook?: string | null;
  } | null;
  onSave: (kitchen: {
    name: string;
    description?: string;
    defaultCook?: string;
    id?: string;
  }) => void;
}

export function AddEditKitchenDialog({
  open,
  onOpenChange,
  initialKitchen = null,
  onSave,
}: AddEditKitchenDialogProps) {
  const { t } = useTranslations();

  const validationSchema = Yup.object({
    name: Yup.string().trim().required(t("kitchens.nameRequired")),
    description: Yup.string().trim(),
    defaultCook: Yup.string().trim(),
  });

  const initialValues = {
    name: initialKitchen?.name || "",
    description: initialKitchen?.description || "",
    defaultCook: initialKitchen?.defaultCook || "",
  };

  const handleSubmit = (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    const trimmedValues = trimSpecificFields(values, [
      "name",
      "description",
      "defaultCook",
    ]);

    onSave({
      name: trimmedValues.name,
      description: trimmedValues.description || undefined,
      defaultCook: trimmedValues.defaultCook || undefined,
      id: initialKitchen?.id,
    });
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        initialKitchen ? t("kitchens.editKitchen") : t("kitchens.addKitchen")
      }
      description={
        initialKitchen
          ? t("kitchens.editKitchen")
          : t("kitchens.addKitchen")
      }
      icon={<UtensilsCrossed className="w-5 h-5 text-primary-foreground" />}
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
                  {t("kitchens.name")} *
                </Label>
                <Field
                  as={Input}
                  name="name"
                  placeholder={t("kitchens.enterKitchenName")}
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
                  {t("kitchens.description")}
                </Label>
                <Field
                  as={Input}
                  name="description"
                  placeholder={t("kitchens.enterDescription")}
                  className="border-border focus:border-primary focus:ring-primary/20"
                />
                <ErrorMessage
                  name="description"
                  component="p"
                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  {t("kitchens.defaultCook")}
                </Label>
                <Field
                  as={Input}
                  name="defaultCook"
                  placeholder={t("kitchens.enterDefaultCook")}
                  className="border-border focus:border-primary focus:ring-primary/20"
                />
                <ErrorMessage
                  name="defaultCook"
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
                ) : initialKitchen ? (
                  t("common.saveChanges")
                ) : (
                  t("kitchens.addKitchen")
                )}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </BaseDialog>
  );
}
