"use client";

import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { Building2 } from "lucide-react";
import * as Yup from "yup";

interface AddEditKitchenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKitchen?: {
    id?: string;
    name: string;
    location: string;
  } | null;
  onSave: (kitchen: { name: string; location: string; id?: string }) => void;
}

const validationSchema = Yup.object({
  name: Yup.string().trim().required("Kitchen name is required."),
  location: Yup.string().trim().required("Location is required."),
});

export function AddEditKitchenDialog({
  open,
  onOpenChange,
  initialKitchen = null,
  onSave,
}: AddEditKitchenDialogProps) {
  const initialValues = {
    name: initialKitchen?.name || "",
    location: initialKitchen?.location || "",
  };

  const handleSubmit = (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    onSave({
      name: values.name.trim(),
      location: values.location.trim(),
      id: initialKitchen?.id,
    });
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialKitchen ? "Edit Kitchen" : "Add Kitchen"}
      description={
        initialKitchen ? "Update kitchen details" : "Create a new kitchen"
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
                  Kitchen Name *
                </Label>
                <Field
                  as={Input}
                  name="name"
                  placeholder="Enter kitchen name"
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
                  Location *
                </Label>
                <Field
                  as={Input}
                  name="location"
                  placeholder="Enter location"
                  className="border-border focus:border-primary focus:ring-primary/20"
                />
                <ErrorMessage
                  name="location"
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Saving...
                  </>
                ) : initialKitchen ? (
                  "Save Changes"
                ) : (
                  "Add Kitchen"
                )}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </BaseDialog>
  );
}
