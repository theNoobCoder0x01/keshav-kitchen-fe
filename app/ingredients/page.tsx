"use client";

import { useEffect, useState } from "react";
import {
  fetchIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "@/lib/api/ingredients";
import { Button } from "@/components/ui/button";
import { AddEditIngredientDialog } from "@/components/dialogs/add-edit-ingredient-dialog";
import { toast } from "sonner";

export default function IngredientsPage() {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id?: string;
  } | null>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any | null>(null);

  const loadIngredients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIngredients();
      setIngredients(data);
    } catch (e: any) {
      setError("Failed to load ingredients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const handleSave = async (ingredient: {
    name: string;
    costPerKg: number;
    unit: string;
    id?: string;
  }) => {
    try {
      if (ingredient.id) {
        await updateIngredient(ingredient.id, ingredient);
        toast.success("Ingredient updated");
      } else {
        await createIngredient(ingredient);
        toast.success("Ingredient added");
      }
      setDialogOpen(false);
      setEditingIngredient(null);
      loadIngredients();
    } catch (e) {
      toast.error("Failed to save ingredient");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Ingredients Management</h1>
      <Button
        className="mb-4"
        onClick={() => {
          setEditingIngredient(null);
          setDialogOpen(true);
        }}
      >
        Add Ingredient
      </Button>
      <AddEditIngredientDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingIngredient(null);
        }}
        initialIngredient={editingIngredient}
        onSave={handleSave}
      />
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">Cost per Kg</th>
              <th className="py-2 px-4 border">Unit</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ingredient) => (
              <tr key={ingredient.id} className="border-t">
                <td className="py-2 px-4 border">{ingredient.name}</td>
                <td className="py-2 px-4 border">
                  ₹{ingredient.costPerKg ?? "-"}
                </td>
                <td className="py-2 px-4 border">{ingredient.unit ?? "-"}</td>
                <td className="py-2 px-4 border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      setEditingIngredient(ingredient);
                      setDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setDeleteConfirm({ open: true, id: ingredient.id })
                    }
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Delete confirmation dialog */}
      {deleteConfirm?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Delete Ingredient</h2>
            <p className="mb-6">
              Are you sure you want to delete this ingredient? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await deleteIngredient(deleteConfirm.id!);
                    toast.success("Ingredient deleted");
                    setDeleteConfirm(null);
                    loadIngredients();
                  } catch {
                    toast.error("Failed to delete ingredient");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
