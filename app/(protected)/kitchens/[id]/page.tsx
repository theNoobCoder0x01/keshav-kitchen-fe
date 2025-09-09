"use client";

import { AddEditMenuComponentDialog } from "@/components/dialogs/add-edit-menu-component-dialog";
import { KitchensTableSkeleton } from "@/components/kitchens/kitchens-table";
import { MenuComponentsTable } from "@/components/menu/menu-components-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "@/hooks/use-translations";
import api from "@/lib/api/axios";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// TODO: Import MenuComponentsTable and AddEditMenuComponentDialog when created
export default function KitchenDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslations();
  const [kitchen, setKitchen] = useState<any>(null);
  const [menuComponents, setMenuComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenuComponent, setEditingMenuComponent] = useState<any | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMenuComponents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch kitchen details
      const kitchenRes = await api.get(`/kitchens/${id}/`);
      const kitchenData = await kitchenRes.data;
      setKitchen(kitchenData);
      // Fetch menu components
      const menuRes = await api.get(`/kitchens/${id}/menu-components/`);
      const menuData = await menuRes.data;
      setMenuComponents(menuData);
    } catch (e) {
      setError(t("messages.failedToLoadKitchenDetails"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadMenuComponents();
  }, [id]);

  const handleSave = async (menuComponent: any) => {
    try {
      if (menuComponent.id) {
        // Edit
        await api.put(
          `/kitchens/${id}/menu-components/${menuComponent.id}/`,
          menuComponent,
        );
        toast.success(t("messages.menuComponentUpdated"));
      } else {
        // Add
        await api.post(`/kitchens/${id}/menu-components/`, menuComponent);
        toast.success(t("messages.menuComponentAdded"));
      }
      setDialogOpen(false);
      setEditingMenuComponent(null);
      loadMenuComponents();
    } catch (e) {
      toast.error(t("messages.failedToSaveMenuComponent"));
    }
  };

  const handleEdit = (menuComponent: any) => {
    setEditingMenuComponent(menuComponent);
    setDialogOpen(true);
  };

  const handleDelete = async (idToDelete: string) => {
    if (window.confirm(t("messages.confirmDeleteMenuComponent"))) {
      setDeletingId(idToDelete);
      try {
        await api.delete(`/kitchens/${id}/menu-components/${idToDelete}/`);
        toast.success(t("messages.menuComponentDeleted"));
        loadMenuComponents();
      } catch {
        toast.error(t("messages.failedToDeleteMenuComponent"));
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) return <KitchensTableSkeleton />;
  if (error) return <div className="text-destructive">{error}</div>;

  return (
    <div className="w-full flex flex-col gap-2 md:gap-4">
      <PageHeader
        title={kitchen?.name || t("kitchens.details")}
        subtitle={kitchen?.location}
        actions={
          <Button
            onClick={() => {
              setEditingMenuComponent(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Menu Component
          </Button>
        }
      />
      <AddEditMenuComponentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingMenuComponent(null);
        }}
        initialMenuComponent={editingMenuComponent}
        onSave={handleSave}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Menu Components</h2>
        <MenuComponentsTable
          menuComponents={menuComponents}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      </div>
    </div>
  );
}
