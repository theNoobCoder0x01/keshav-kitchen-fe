"use client";

import type { Kitchen, KitchenPersonType } from "@/types/kitchens";

import {
  AddEditKitchenPersonTypeDialog,
  type KitchenPersonTypeForm,
} from "@/components/dialogs/add-edit-kitchen-person-type-dialog";
import { AddEditMenuComponentDialog } from "@/components/dialogs/add-edit-menu-component-dialog";
import type { MenuComponentForm } from "@/components/dialogs/add-edit-menu-component-dialog";
import { KitchenPersonTypesTable } from "@/components/kitchens/kitchen-person-types-table";
import { KitchensTableSkeleton } from "@/components/kitchens/kitchens-table";
import { MenuComponentsTable } from "@/components/menu/menu-components-table";
import type { MenuComponent } from "@/components/menu/menu-components-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "@/hooks/use-translations";
import api from "@/lib/api/axios";
import {
  createKitchenPersonType,
  deleteKitchenPersonType,
  fetchKitchenPersonTypes,
  updateKitchenPersonType,
} from "@/lib/api/kitchen-person-types";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function KitchenDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslations();
  const [kitchen, setKitchen] = useState<Kitchen | null>(null);
  const [menuComponents, setMenuComponents] = useState<MenuComponent[]>([]);
  const [personTypes, setPersonTypes] = useState<KitchenPersonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuComponentDialogOpen, setMenuComponentDialogOpen] = useState(false);
  const [personTypeDialogOpen, setPersonTypeDialogOpen] = useState(false);
  const [editingMenuComponent, setEditingMenuComponent] =
    useState<MenuComponentForm | null>(null);
  const [editingPersonType, setEditingPersonType] =
    useState<KitchenPersonTypeForm | null>(null);
  const [deletingMenuComponentId, setDeletingMenuComponentId] = useState<
    string | null
  >(null);
  const [deletingPersonTypeId, setDeletingPersonTypeId] = useState<
    string | null
  >(null);

  const loadKitchenDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kitchenRes, menuRes, personTypeData] = await Promise.all([
        api.get(`/kitchens/${id}/`),
        api.get(`/kitchens/${id}/menu-components/`),
        fetchKitchenPersonTypes(id),
      ]);

      const kitchenData = kitchenRes.data as Kitchen;
      setKitchen(kitchenData);
      setMenuComponents(menuRes.data as MenuComponent[]);
      setPersonTypes(personTypeData);
    } catch {
      setError(t("messages.failedToLoadKitchenDetails"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      void loadKitchenDetails();
    }
  }, [id]);

  const handleSaveMenuComponent = async (menuComponent: MenuComponentForm) => {
    try {
      if (menuComponent.id) {
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
      setMenuComponentDialogOpen(false);
      setEditingMenuComponent(null);
      await loadKitchenDetails();
    } catch {
      toast.error(t("messages.failedToSaveMenuComponent"));
    }
  };

  const handleEditMenuComponent = (menuComponent: MenuComponentForm) => {
    setEditingMenuComponent(menuComponent);
    setMenuComponentDialogOpen(true);
  };

  const handleDeleteMenuComponent = async (idToDelete: string) => {
    if (window.confirm(t("messages.confirmDeleteMenuComponent"))) {
      setDeletingMenuComponentId(idToDelete);
      try {
        await api.delete(`/kitchens/${id}/menu-components/${idToDelete}/`);
        toast.success(t("messages.menuComponentDeleted"));
        await loadKitchenDetails();
      } catch {
        toast.error(t("messages.failedToDeleteMenuComponent"));
      } finally {
        setDeletingMenuComponentId(null);
      }
    }
  };

  const handleSavePersonType = async (personType: KitchenPersonTypeForm) => {
    try {
      const payload = {
        name: personType.name,
        description: personType.description || undefined,
        sequenceNumber: Number(personType.sequenceNumber),
      };

      if (personType.id) {
        await updateKitchenPersonType(id, personType.id, payload);
        toast.success(t("messages.personTypeUpdated"));
      } else {
        await createKitchenPersonType(id, payload);
        toast.success(t("messages.personTypeAdded"));
      }

      setPersonTypeDialogOpen(false);
      setEditingPersonType(null);
      await loadKitchenDetails();
      return true;
    } catch {
      toast.error(t("messages.failedToSavePersonType"));
      return false;
    }
  };

  const handleEditPersonType = (personType: KitchenPersonType) => {
    setEditingPersonType({
      id: personType.id,
      name: personType.name,
      description: personType.description || "",
      sequenceNumber: personType.sequenceNumber,
    });
    setPersonTypeDialogOpen(true);
  };

  const handleDeletePersonType = async (personTypeId: string) => {
    if (window.confirm(t("messages.confirmDeletePersonType"))) {
      setDeletingPersonTypeId(personTypeId);
      try {
        await deleteKitchenPersonType(id, personTypeId);
        toast.success(t("messages.personTypeDeleted"));
        await loadKitchenDetails();
      } catch {
        toast.error(t("messages.failedToDeletePersonType"));
      } finally {
        setDeletingPersonTypeId(null);
      }
    }
  };

  if (loading) return <KitchensTableSkeleton />;
  if (error) return <div className="text-destructive">{error}</div>;

  return (
    <div className="w-full flex flex-col gap-2 md:gap-4">
      <div>
        <Link href="/kitchens">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 pl-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("kitchens.backToKitchens")}
          </Button>
        </Link>
      </div>
      <PageHeader
        title={kitchen?.name || t("kitchens.details")}
        subtitle={kitchen?.location}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingPersonType(null);
                setPersonTypeDialogOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("kitchens.addPersonType")}
            </Button>
            <Button
              onClick={() => {
                setEditingMenuComponent(null);
                setMenuComponentDialogOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("kitchens.addMenuComponent")}
            </Button>
          </div>
        }
      />
      <AddEditMenuComponentDialog
        open={menuComponentDialogOpen}
        onOpenChange={(open) => {
          setMenuComponentDialogOpen(open);
          if (!open) setEditingMenuComponent(null);
        }}
        initialMenuComponent={editingMenuComponent}
        personTypes={personTypes}
        onSave={handleSaveMenuComponent}
      />
      <AddEditKitchenPersonTypeDialog
        open={personTypeDialogOpen}
        onOpenChange={(open) => {
          setPersonTypeDialogOpen(open);
          if (!open) setEditingPersonType(null);
        }}
        initialPersonType={editingPersonType}
        onSave={handleSavePersonType}
      />
      <div className="mt-4">
        <h2 className="mb-2 text-lg font-semibold">
          {t("kitchens.personTypes")}
        </h2>
        <KitchenPersonTypesTable
          personTypes={personTypes}
          onEdit={handleEditPersonType}
          onDelete={handleDeletePersonType}
          deletingId={deletingPersonTypeId}
        />
      </div>
      <div className="mt-4">
        <h2 className="mb-2 text-lg font-semibold">
          {t("kitchens.menuComponents")}
        </h2>
        <MenuComponentsTable
          menuComponents={menuComponents}
          onEdit={handleEditMenuComponent}
          onDelete={handleDeleteMenuComponent}
          deletingId={deletingMenuComponentId}
        />
      </div>
    </div>
  );
}
