import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/use-translations";
import { ErrorMessage, Field, Formik, type FieldInputProps } from "formik";
import * as Yup from "yup";

export interface PremisePersonTypeForm {
  id?: string;
  name: string;
  description?: string;
  sequenceNumber: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPersonType?: PremisePersonTypeForm | null;
  onSave: (personType: PremisePersonTypeForm) => boolean | Promise<boolean>;
}

export function AddEditPremisePersonTypeDialog({
  open,
  onOpenChange,
  initialPersonType,
  onSave,
}: Props) {
  const { t } = useTranslations();

  const validationSchema = Yup.object().shape({
    name: Yup.string().trim().required(t("premises.personTypeNameRequired")),
    sequenceNumber: Yup.number()
      .typeError(t("premises.personTypeSequenceNumberRequired"))
      .integer(t("premises.personTypeSequenceNumberRequired"))
      .min(1, t("premises.personTypeSequenceNumberMin"))
      .required(t("premises.personTypeSequenceNumberRequired")),
  });

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        initialPersonType?.id
          ? t("premises.editPersonType")
          : t("premises.addPersonType")
      }
      description={
        initialPersonType?.id
          ? t("premises.editPersonTypeDescription")
          : t("premises.addPersonTypeDescription")
      }
      icon={null}
      size="md"
    >
      <Formik<PremisePersonTypeForm>
        initialValues={
          initialPersonType || {
            name: "",
            description: "",
            sequenceNumber: 1,
          }
        }
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={async (values, { resetForm, setSubmitting }) => {
          try {
            const saved = await onSave({
              ...values,
              name: values.name.trim(),
              description: values.description?.trim() || "",
              sequenceNumber: Number(values.sequenceNumber),
            });
            if (saved) {
              resetForm();
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name">{t("common.name")}</Label>
              <Field name="name">
                {({ field }: { field: FieldInputProps<string> }) => (
                  <Input
                    {...field}
                    id="name"
                    placeholder={t("premises.enterPersonTypeName")}
                    required
                  />
                )}
              </Field>
              <ErrorMessage
                name="name"
                component="div"
                className="mt-1 text-xs text-destructive"
              />
            </div>
            <div>
              <Label htmlFor="description">
                {t("premises.personTypeDescription")}
              </Label>
              <Field name="description">
                {({ field }: { field: FieldInputProps<string> }) => (
                  <Input
                    {...field}
                    id="description"
                    placeholder={t("premises.enterPersonTypeDescription")}
                  />
                )}
              </Field>
              <ErrorMessage
                name="description"
                component="div"
                className="mt-1 text-xs text-destructive"
              />
            </div>
            <div>
              <Label htmlFor="sequenceNumber">
                {t("premises.sequenceNumber")}
              </Label>
              <Field name="sequenceNumber">
                {({ field }: { field: FieldInputProps<number> }) => (
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
                className="mt-1 text-xs text-destructive"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {initialPersonType?.id ? t("common.update") : t("common.add")}
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </BaseDialog>
  );
}
