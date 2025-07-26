import { ReportCard } from "./report-card";
import { useState, useEffect } from "react";
import { AddEditReportDialog } from "@/components/dialogs/add-edit-report-dialog";
import { toast } from "sonner";

interface ReportItem {
  id?: string;
  name: string;
  weight: string;
  quantity: string;
  type: string;
}

interface ReportsGridProps {
  onDownload: (type: string, format: string) => void;
}

export function ReportsGrid({ onDownload }: ReportsGridProps) {
  const [reportData, setReportData] = useState<any>({ breakfast: [], lunch: [], dinner: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialog, setAddDialog] = useState<{ open: boolean; type: string | null }>({ open: false, type: null });
  const [editDialog, setEditDialog] = useState<{ open: boolean; report: ReportItem | null }>({ open: false, report: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; report: ReportItem | null }>({ open: false, report: null });

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const { fetchReports } = await import('@/lib/api/reports');
      const data = await fetchReports();
      setReportData(data);
    } catch (err: any) {
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleAdd = async (report: { name: string; weight: string; quantity: string; type: string }) => {
    try {
      const { createReport } = await import('@/lib/api/reports');
      await createReport(report);
      toast.success('Report item added');
      setAddDialog({ open: false, type: null });
      loadReports();
    } catch {
      toast.error('Failed to add report item');
    }
  };

  return (
    <>
      {/* Add dialog */}
      <AddEditReportDialog
        open={addDialog.open}
        onOpenChange={open => setAddDialog({ open, type: open ? addDialog.type : null })}
        initialReport={addDialog.type ? { name: '', weight: '', quantity: '', type: addDialog.type } : undefined}
        onSave={handleAdd}
      />
      {/* Edit dialog */}
      <AddEditReportDialog
        open={editDialog.open}
        onOpenChange={open => setEditDialog({ open, report: open ? editDialog.report : null })}
        initialReport={editDialog.report || undefined}
        onSave={async (report) => {
          try {
            const { updateReport } = await import('@/lib/api/reports');
            await updateReport(report.id!, report);
            toast.success('Report item updated');
            setEditDialog({ open: false, report: null });
            loadReports();
          } catch {
            toast.error('Failed to update report item');
          }
        }}
      />
      {/* Delete confirmation */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Delete Report Item</h2>
            <p className="mb-6">Are you sure you want to delete this report item? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setDeleteConfirm({ open: false, report: null })}>Cancel</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={async () => {
                try {
                  const { deleteReport } = await import('@/lib/api/reports');
                  await deleteReport(deleteConfirm.report!.id!);
                  toast.success('Report item deleted');
                  setDeleteConfirm({ open: false, report: null });
                  loadReports();
                } catch {
                  toast.error('Failed to delete report item');
                }
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-6">
        <ReportCard
          title="Breakfast"
          items={reportData.breakfast}
          onDownload={(format) => onDownload("breakfast", format)}
          onAdd={() => setAddDialog({ open: true, type: "breakfast" })}
          onEdit={item => setEditDialog({ open: true, report: { ...item, type: 'breakfast' } })}
          onDelete={item => setDeleteConfirm({ open: true, report: { ...item, type: 'breakfast' } })}
        />
        <ReportCard
          title="Lunch"
          items={reportData.lunch}
          onDownload={(format) => onDownload("lunch", format)}
          onAdd={() => setAddDialog({ open: true, type: "lunch" })}
          onEdit={item => setEditDialog({ open: true, report: { ...item, type: 'lunch' } })}
          onDelete={item => setDeleteConfirm({ open: true, report: { ...item, type: 'lunch' } })}
        />
        <ReportCard
          title="Dinner"
          items={reportData.dinner}
          onDownload={(format) => onDownload("dinner", format)}
          onAdd={() => setAddDialog({ open: true, type: "dinner" })}
          onEdit={item => setEditDialog({ open: true, report: { ...item, type: 'dinner' } })}
          onDelete={item => setDeleteConfirm({ open: true, report: { ...item, type: 'dinner' } })}
        />
      </div>
    </>
  );
}
