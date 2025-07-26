"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface AddEditReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialReport?: {
    id?: string;
    name: string;
    weight: string;
    quantity: string;
    type: string; // breakfast, lunch, dinner, etc.
  } | null;
  onSave: (report: { name: string; weight: string; quantity: string; type: string; id?: string }) => void;
}

export function AddEditReportDialog({ open, onOpenChange, initialReport = null, onSave }: AddEditReportDialogProps) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState("breakfast");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialReport?.name || "");
      setWeight(initialReport?.weight || "");
      setQuantity(initialReport?.quantity || "");
      setType(initialReport?.type || "breakfast");
      setError(null);
    }
  }, [open, initialReport]);

  const handleSubmit = () => {
    if (!name.trim() || !weight.trim() || !quantity.trim() || !type.trim()) {
      setError("Please fill all fields.");
      return;
    }
    onSave({
      name: name.trim(),
      weight: weight.trim(),
      quantity: quantity.trim(),
      type: type.trim(),
      id: initialReport?.id,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialReport ? "Edit Report Item" : "Add Report Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" />
          </div>
          <div>
            <Label>Weight</Label>
            <Input value={weight} onChange={e => setWeight(e.target.value)} placeholder="Weight (e.g. 1kg)" />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Quantity" />
          </div>
          <div>
            <Label>Type</Label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded px-2 py-1">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
          <Button onClick={handleSubmit}>{initialReport ? "Save Changes" : "Add Report Item"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
