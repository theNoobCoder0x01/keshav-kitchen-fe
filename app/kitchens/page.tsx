"use client";

import { AddEditKitchenDialog } from "@/components/dialogs/add-edit-kitchen-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id?: string;
  } | null>(null);
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <DashboardLayout activeMenuItem="kitchens">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
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
      </div>

      <div className="max-w-3xl mx-auto">
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
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">Location</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {kitchens.map((kitchen) => (
              <tr key={kitchen.id} className="border-t">
                <td className="py-2 px-4 border">{kitchen.name}</td>
                <td className="py-2 px-4 border">{kitchen.location ?? "-"}</td>
                <td className="py-2 px-4 border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      setEditingKitchen(kitchen);
                      setDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setDeleteConfirm({ open: true, id: kitchen.id })
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
            <h2 className="text-lg font-semibold mb-4">Delete Kitchen</h2>
            <p className="mb-6">
              Are you sure you want to delete this kitchen? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await deleteKitchen(deleteConfirm.id!);
                    toast.success("Kitchen deleted");
                    setDeleteConfirm(null);
                    loadKitchens();
                  } catch {
                    toast.error("Failed to delete kitchen");
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
    </DashboardLayout>
  );
}
