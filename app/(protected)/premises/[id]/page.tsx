"use client";

import type { Premise, PremisePersonType } from "@/types/premises";

import {
  AddEditPremisePersonTypeDialog,
  type PremisePersonTypeForm,
} from "@/components/dialogs/add-edit-premise-person-type-dialog";
import { AddEditMenuComponentDialog } from "@/components/dialogs/add-edit-menu-component-dialog";
import type { MenuComponentForm } from "@/components/dialogs/add-edit-menu-component-dialog";
import { PremisePersonTypesTable } from "@/components/premises/premise-person-types-table";
import { PremisesTableSkeleton } from "@/components/premises/premises-table";
import { MenuComponentsTable } from "@/components/menu/menu-components-table";
import type { MenuComponent } from "@/components/menu/menu-components-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "@/hooks/use-translations";
import api from "@/lib/api/axios";
import {
  createPremisePersonType,
  deletePremisePersonType,
  fetchPremisePersonTypes,
  updatePremisePersonType,
} from "@/lib/api/premise-person-types";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PremiseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslations();
  const [premise, setPremise] = useState<Premise | null>(null);
  const [menuComponents, setMenuComponents] = useState<MenuComponent[]>([]);
  const [personTypes, setPersonTypes] = useState<PremisePersonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuComponentDialogOpen, setMenuComponentDialogOpen] = useState(false);
  const [personTypeDialogOpen, setPersonTypeDialogOpen] = useState(false);
  const [editingMenuComponent, setEditingMenuComponent] =
    useState<MenuComponentForm | null>(null);
  const [editingPersonType, setEditingPersonType] =
    useState<PremisePersonTypeForm | null>(null);
  const [deletingMenuComponentId, setDeletingMenuComponentId] = useState<
    string | null
  >(null);
  const [deletingPersonTypeId, setDeletingPersonTypeId] = useState<
    string | null
  >(null);

  const loadPremiseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [premiseRes, menuRes, personTypeData] = await Promise.all([
        api.get(`/premises/${id}/`),
        api.get(`/premises/${id}/menu-components/`),
        fetchPremisePersonTypes(id),
      ]);

      const premiseData = premiseRes.data as Premise;
      setPremise(premiseData);
      setMenuComponents(menuRes.data as MenuComponent[]);
      setPersonTypes(personTypeData);
    } catch {
      setError(t("messages.failedToLoadPremiseDetails"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      void loadPremiseDetails();
    }
  }, [id]);

  const handleSaveMenuComponent = async (menuComponent: MenuComponentForm) => {
    try {
      if (menuComponent.id) {
        await api.put(
          `/premises/${id}/menu-components/${menuComponent.id}/`,
          menuComponent,
        );
        toast.success(t("messages.menuComponentUpdated"));
      } else {
        // Add
        await api.post(`/premises/${id}/menu-components/`, menuComponent);
        toast.success(t("messages.menuComponentAdded"));
      }
      setMenuComponentDialogOpen(false);
      setEditingMenuComponent(null);
      await loadPremiseDetails();
      return true;
    } catch {
      toast.error(t("messages.failedToSaveMenuComponent"));
      return false;
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
        await api.delete(`/premises/${id}/menu-components/${idToDelete}/`);
        toast.success(t("messages.menuComponentDeleted"));
        await loadPremiseDetails();
      } catch {
        toast.error(t("messages.failedToDeleteMenuComponent"));
      } finally {
        setDeletingMenuComponentId(null);
      }
    }
  };

  const handleSavePersonType = async (personType: PremisePersonTypeForm) => {
    try {
      const payload = {
        name: personType.name,
        description: personType.description || undefined,
        sequenceNumber: Number(personType.sequenceNumber),
      };

      if (personType.id) {
        await updatePremisePersonType(id, personType.id, payload);
        toast.success(t("messages.personTypeUpdated"));
      } else {
        await createPremisePersonType(id, payload);
        toast.success(t("messages.personTypeAdded"));
      }

      setPersonTypeDialogOpen(false);
      setEditingPersonType(null);
      await loadPremiseDetails();
      return true;
    } catch {
      toast.error(t("messages.failedToSavePersonType"));
      return false;
    }
  };

  const handleEditPersonType = (personType: PremisePersonType) => {
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
        await deletePremisePersonType(id, personTypeId);
        toast.success(t("messages.personTypeDeleted"));
        await loadPremiseDetails();
      } catch {
        toast.error(t("messages.failedToDeletePersonType"));
      } finally {
        setDeletingPersonTypeId(null);
      }
    }
  };

  if (loading) return <PremisesTableSkeleton />;
  if (error) return <div className="text-destructive">{error}</div>;

  return (
    <div className="w-full flex flex-col gap-2 md:gap-4">
      <div>
        <Link href="/premises">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 pl-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("premises.backToPremises")}
          </Button>
        </Link>
      </div>
      <PageHeader
        title={premise?.name || t("premises.details")}
        subtitle={premise?.location}
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
              {t("premises.addPersonType")}
            </Button>
            <Button
              onClick={() => {
                setEditingMenuComponent(null);
                setMenuComponentDialogOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("premises.addMenuComponent")}
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
      <AddEditPremisePersonTypeDialog
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
          {t("premises.personTypes")}
        </h2>
        <PremisePersonTypesTable
          personTypes={personTypes}
          onEdit={handleEditPersonType}
          onDelete={handleDeletePersonType}
          deletingId={deletingPersonTypeId}
        />
      </div>
      <div className="mt-4">
        <h2 className="mb-2 text-lg font-semibold">
          {t("premises.menuComponents")}
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
