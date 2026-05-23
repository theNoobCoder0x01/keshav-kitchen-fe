"use client";

import { AddEditPremiseDialog } from "@/components/dialogs/add-edit-premise-dialog";
import {
  PremisesTable,
  PremisesTableSkeleton,
} from "@/components/premises/premises-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "@/hooks/use-translations";
import {
  createPremise,
  deletePremise,
  fetchPremises,
  updatePremise,
} from "@/lib/api/premises";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PremisesPage() {
  const { t } = useTranslations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPremise, setEditingPremise] = useState<any | null>(null);
  const [premises, setPremises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPremises = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPremises();
      setPremises(data);
    } catch (e: any) {
      setError(t("messages.failedToLoadPremises"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPremises();
  }, []);

  const handleSave = async (premise: {
    name: string;
    location: string;
    sequenceNumber?: number;
    id?: string;
  }) => {
    try {
      if (premise.id) {
        const { id, ...data } = premise;
        await updatePremise(id, data);
        toast.success(t("messages.premiseUpdated"));
      } else {
        const { id, ...data } = premise;
        await createPremise(data);
        toast.success(t("messages.premiseAdded"));
      }
      setDialogOpen(false);
      setEditingPremise(null);
      loadPremises();
    } catch (e) {
      toast.error(t("messages.failedToSavePremise"));
    }
  };

  const handleEdit = (premise: any) => {
    setEditingPremise(premise);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t("messages.confirmDeletePremise"))) {
      setDeletingId(id);
      try {
        await deletePremise(id);
        toast.success(t("messages.premiseDeleted"));
        loadPremises();
      } catch {
        toast.error(t("messages.failedToDeletePremise"));
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 md:gap-4">
      <PageHeader
        title={t("premises.management")}
        subtitle={t("premises.managementSubtitle")}
        actions={
          <Button
            onClick={() => {
              setEditingPremise(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t("premises.addPremise")}
          </Button>
        }
      />

      <div>
        <AddEditPremiseDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingPremise(null);
          }}
          initialPremise={editingPremise}
          onSave={handleSave}
        />

        {loading ? (
          <PremisesTableSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">{error}</div>
          </div>
        ) : (
          <PremisesTable
            premises={premises}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </div>
    </div>
  );
}
