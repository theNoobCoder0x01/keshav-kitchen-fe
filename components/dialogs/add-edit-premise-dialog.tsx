"use client";

import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/use-translations";
import { trimSpecificFields } from "@/lib/utils/form-utils";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { Building2 } from "lucide-react";
import * as Yup from "yup";

interface AddEditPremiseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPremise?: {
    id?: string;
    name: string;
    location: string;
    sequenceNumber?: number;
  } | null;
  onSave: (premise: {
    name: string;
    location: string;
    sequenceNumber: number;
    id?: string;
  }) => void;
}

export function AddEditPremiseDialog({
  open,
  onOpenChange,
  initialPremise = null,
  onSave,
}: AddEditPremiseDialogProps) {
  const { t } = useTranslations();

  const validationSchema = Yup.object({
    name: Yup.string().trim().required(t("premises.nameRequired")),
    location: Yup.string().trim().required(t("premises.locationRequired")),
    sequenceNumber: Yup.number().required(t("premises.sequenceNumberRequired")),
  });

  const initialValues = {
    name: initialPremise?.name || "",
    location: initialPremise?.location || "",
    sequenceNumber: initialPremise?.sequenceNumber ?? 0,
  };

  const handleSubmit = (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    // Trim string fields before submission
    const trimmedValues = trimSpecificFields(values, ["name", "location"]);

    onSave({
      name: trimmedValues.name,
      location: trimmedValues.location,
      sequenceNumber: Number(values.sequenceNumber),
      id: initialPremise?.id,
    });
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        initialPremise ? t("premises.editPremise") : t("premises.addPremise")
      }
      description={
        initialPremise
          ? t("premises.updatePremiseDetails")
          : t("premises.createNewPremise")
      }
      icon={<Building2 className="w-5 h-5 text-primary-foreground" />}
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
                  {t("premises.premiseName")} *
                </Label>
                <Field
                  as={Input}
                  name="name"
                  placeholder={t("premises.enterPremiseName")}
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
                  {t("premises.location")} *
                </Label>
                <Field
                  as={Input}
                  name="location"
                  placeholder={t("premises.enterLocation")}
                  className="border-border focus:border-primary focus:ring-primary/20"
                />
                <ErrorMessage
                  name="location"
                  component="p"
                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  {t("premises.sequenceNumber")} *
                </Label>
                <Field
                  as={Input}
                  type="number"
                  name="sequenceNumber"
                  placeholder={t("premises.enterSequenceNumber")}
                  className="border-border focus:border-primary focus:ring-primary/20"
                />
                <ErrorMessage
                  name="sequenceNumber"
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
                ) : initialPremise ? (
                  t("common.saveChanges")
                ) : (
                  t("premises.addPremise")
                )}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </BaseDialog>
  );
}
