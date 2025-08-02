"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

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
  const [name, setName] = useState("");
  const [costPerKg, setCostPerKg] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialIngredient?.name || "");
      setCostPerKg(initialIngredient?.costPerKg?.toString() || "");
      setUnit(initialIngredient?.unit || "Kg");
      setError(null);
    }
  }, [open, initialIngredient]);

  const handleSubmit = () => {
    if (
      !name.trim() ||
      !costPerKg.trim() ||
      isNaN(Number(costPerKg)) ||
      Number(costPerKg) < 0 ||
      !unit.trim()
    ) {
      setError("Please enter valid ingredient details.");
      return;
    }
    onSave({
      name: name.trim(),
      costPerKg: Number(costPerKg),
      unit: unit.trim(),
      id: initialIngredient?.id,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md h-auto max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {initialIngredient ? "Edit Ingredient" : "Add Ingredient"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingredient name"
              />
            </div>
            <div>
              <Label>Cost per Kg (₹)</Label>
              <Input
                type="number"
                value={costPerKg}
                onChange={(e) => setCostPerKg(e.target.value)}
                placeholder="30"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Unit</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Kg"
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
              {initialIngredient ? "Save Changes" : "Add Ingredient"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
