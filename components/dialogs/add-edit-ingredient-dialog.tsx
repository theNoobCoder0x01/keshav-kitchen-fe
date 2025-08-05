"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimpleFormDialog } from "@/components/ui/base-dialog";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { UNIT_OPTIONS, DEFAULT_UNIT } from "@/lib/constants/units";

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
      setUnit(initialIngredient?.unit || DEFAULT_UNIT);
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
    <SimpleFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialIngredient ? "Edit Ingredient" : "Add Ingredient"}
      description={initialIngredient ? "Update ingredient details" : "Create a new ingredient"}
      icon={<Package className="w-5 h-5 text-primary-foreground" />}
      size="md"
      onSubmit={handleSubmit}
      submitLabel={initialIngredient ? "Save Changes" : "Add Ingredient"}
    >
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Ingredient Name *
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter ingredient name"
            className="border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Cost per Unit (₹) *
          </Label>
          <Input
            type="number"
            value={costPerKg}
            onChange={(e) => setCostPerKg(e.target.value)}
            placeholder="30"
            min="0"
            step="0.01"
            className="border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Unit *
          </Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="border-border focus:border-primary focus:ring-primary/20">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((unitOption) => (
                <SelectItem key={unitOption.value} value={unitOption.value}>
                  {unitOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
