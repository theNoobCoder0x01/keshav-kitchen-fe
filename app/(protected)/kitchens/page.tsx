"use client";

import { AddEditKitchenDialog } from "@/components/dialogs/add-edit-kitchen-dialog";
import { KitchensTable } from "@/components/kitchens/kitchens-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  createKitchen,
  deleteKitchen,
  fetchKitchens,
  updateKitchen,
} from "@/lib/api/kitchens";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function KitchensPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKitchen, setEditingKitchen] = useState<any | null>(null);
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadKitchens = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchKitchens();
      setKitchens(data);
    } catch (e: any) {
      setError("Failed to load kitchens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKitchens();
  }, []);

  const handleSave = async (kitchen: {
    name: string;
    location: string;
    id?: string;
  }) => {
    try {
      if (kitchen.id) {
        await updateKitchen(kitchen.id, kitchen);
        toast.success("Kitchen updated");
      } else {
        await createKitchen(kitchen);
        toast.success("Kitchen added");
      }
      setDialogOpen(false);
      setEditingKitchen(null);
      loadKitchens();
    } catch (e) {
      toast.error("Failed to save kitchen");
    }
  };

  const handleEdit = (kitchen: any) => {
    setEditingKitchen(kitchen);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this kitchen? This action cannot be undone.",
      )
    ) {
      setDeletingId(id);
      try {
        await deleteKitchen(id);
        toast.success("Kitchen deleted");
        loadKitchens();
      } catch {
        toast.error("Failed to delete kitchen");
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Kitchens Management"
        subtitle="Manage your kitchen locations and settings"
        actions={
          <Button
            onClick={() => {
              setEditingKitchen(null);
              setDialogOpen(true);
            }}
          >
            Add Kitchen
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto">
        <AddEditKitchenDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingKitchen(null);
          }}
          initialKitchen={editingKitchen}
          onSave={handleSave}
        />

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading kitchens...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">{error}</div>
          </div>
        ) : (
          <KitchensTable
            kitchens={kitchens}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </div>
    </div>
  );
}
