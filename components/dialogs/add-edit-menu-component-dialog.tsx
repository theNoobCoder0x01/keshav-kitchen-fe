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
import { useTranslations } from "@/hooks/use-translations";
import { MealType, MealTypeEnum } from "@/types";
import { ErrorMessage, Field, Formik } from "formik";
import * as Yup from "yup";

export interface MenuComponentForm {
  name: string;
  label: string;
  mealType: string;
  sequenceNumber: number;
  id?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMenuComponent?: MenuComponentForm | null;
  onSave: (menuComponent: MenuComponentForm) => void;
}

const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];
const mealTypesObj = {
  [MealTypeEnum.BREAKFAST]: "Breakfast",
  [MealTypeEnum.LUNCH]: "Lunch",
  [MealTypeEnum.DINNER]: "Dinner",
  [MealTypeEnum.SNACK]: "Snack",
};

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required("Name is required"),
  label: Yup.string().trim().required("Label is required"),
  mealType: Yup.string().oneOf(mealTypes).required("Meal type is required"),
  sequenceNumber: Yup.number().min(1).required("Sequence number is required"),
});

export function AddEditMenuComponentDialog({
  open,
  onOpenChange,
  initialMenuComponent,
  onSave,
}: Props) {
  const { t } = useTranslations();

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        initialMenuComponent?.id ? "Edit menu component" : "Add menu component"
      }
      description={
        initialMenuComponent?.id ? "Edit menu component" : "Add menu component"
      }
      icon={null}
      size="md"
    >
      <Formik
        initialValues={
          initialMenuComponent || {
            name: "",
            label: "",
            mealType: "LUNCH",
            sequenceNumber: 1,
          }
        }
        validationSchema={validationSchema}
        onSubmit={(values, { resetForm }) => {
          onSave(values);
          resetForm();
          onOpenChange(false);
        }}
        enableReinitialize
      >
        {({ handleSubmit, isSubmitting }) => (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
                    onValueChange={field.onChange}
                    required
                  >
                    <SelectTrigger className="w-full border-border focus:border-primary focus:ring-primary/20">
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
            <div className="flex gap-2 justify-end mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {initialMenuComponent?.id ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </BaseDialog>
  );
}
