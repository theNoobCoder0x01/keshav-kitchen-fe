"use client";

import { AddEditKitchenDialog } from "@/components/dialogs/add-edit-kitchen-dialog";
import {
  KitchensTable,
  KitchensTableSkeleton,
} from "@/components/kitchens/kitchens-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "@/hooks/use-translations";
import {
  createKitchen,
  deleteKitchen,
  fetchKitchens,
  updateKitchen,
} from "@/lib/api/kitchens";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function KitchensPage() {
  const { t } = useTranslations();
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
      setError(t("messages.failedToLoadKitchens"));
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
        toast.success(t("messages.kitchenUpdated"));
      } else {
        await createKitchen(kitchen);
        toast.success(t("messages.kitchenAdded"));
      }
      setDialogOpen(false);
      setEditingKitchen(null);
      loadKitchens();
    } catch (e) {
      toast.error(t("messages.failedToSaveKitchen"));
    }
  };

  const handleEdit = (kitchen: any) => {
    setEditingKitchen(kitchen);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t("messages.confirmDeleteKitchen"))) {
      setDeletingId(id);
      try {
        await deleteKitchen(id);
        toast.success(t("messages.kitchenDeleted"));
        loadKitchens();
      } catch {
        toast.error(t("messages.failedToDeleteKitchen"));
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 md:gap-4">
      <PageHeader
        title={t("kitchens.management")}
        subtitle={t("kitchens.managementSubtitle")}
        actions={
          <Button
            onClick={() => {
              setEditingKitchen(null);
              setDialogOpen(true);
            }}
          >
            {t("kitchens.addKitchen")}
          </Button>
        }
      />

      <div>
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
          <KitchensTableSkeleton />
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
