"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md h-auto max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialKitchen ? "Edit Kitchen" : "Add Kitchen"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kitchen name"
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 pt-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {initialKitchen ? "Save Changes" : "Add Kitchen"}
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
