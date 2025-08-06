"use client";

import { SimpleFormDialog } from "@/components/ui/base-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

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

export function AddEditKitchenDialog({
  open,
  onOpenChange,
  initialKitchen = null,
  onSave,
}: AddEditKitchenDialogProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialKitchen?.name || "");
      setLocation(initialKitchen?.location || "");
      setError(null);
    }
  }, [open, initialKitchen]);

  const handleSubmit = () => {
    if (!name.trim() || !location.trim()) {
      setError("Please enter valid kitchen details.");
      return;
    }
    onSave({
      name: name.trim(),
      location: location.trim(),
      id: initialKitchen?.id,
    });
    onOpenChange(false);
  };

  return (
    <SimpleFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialKitchen ? "Edit Kitchen" : "Add Kitchen"}
      description={
        initialKitchen ? "Update kitchen details" : "Create a new kitchen"
      }
      icon={<Building2 className="w-5 h-5 text-primary-foreground" />}
      size="md"
      onSubmit={handleSubmit}
      submitLabel={initialKitchen ? "Save Changes" : "Add Kitchen"}
    >
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Kitchen Name *
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter kitchen name"
            className="border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Location *
          </Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location"
            className="border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
        {error && (
          <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20">
            {error}
          </div>
        )}
      </div>
    </SimpleFormDialog>
  );
}
