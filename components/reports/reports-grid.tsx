import { ReportCard } from "./report-card";
import { useState, useEffect } from "react";
import { AddEditReportDialog } from "@/components/dialogs/add-edit-report-dialog";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

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

  useEffect(() => {
    loadReports();
  }, []);

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

  const handleAddReport = async (type: string, data: any) => {
    try {
      const { createReport } = await import('@/lib/api/reports');
      const newReport = await createReport({ ...data, type });
      setReportData((prev: any) => ({
        ...prev,
        [type.toLowerCase()]: [...prev[type.toLowerCase()], newReport],
      }));
      toast.success('Report added successfully');
      setAddDialog({ open: false, type: null });
    } catch (err: any) {
      toast.error('Failed to add report');
    }
  };

  const handleEditReport = async (report: ReportItem) => {
    if (!report || !report.type || !report.id) return;
    try {
      const { updateReport } = await import('@/lib/api/reports');
      const updatedReport = await updateReport(report.id, report);
      setReportData((prev: any) => {
        const typeKey = report.type?.toLowerCase() || '';
        return {
          ...prev,
          [typeKey]: prev[typeKey].map((item: any) =>
            item.id === report.id ? updatedReport : item
          ),
        };
      });
      toast.success('Report updated successfully');
      setEditDialog({ open: false, report: null });
    } catch (err: any) {
      toast.error('Failed to update report');
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteConfirm.report || !deleteConfirm.report.type || !deleteConfirm.report.id) return;
    try {
      const { deleteReport } = await import('@/lib/api/reports');
      await deleteReport(deleteConfirm.report.id);
      setReportData((prev: any) => {
        const typeKey = deleteConfirm.report?.type?.toLowerCase() || '';
        return {
          ...prev,
          [typeKey]: prev[typeKey].filter(
            (item: any) => item.id !== deleteConfirm.report?.id
          ),
        };
      });
      toast.success('Report deleted successfully');
      setDeleteConfirm({ open: false, report: null });
    } catch (err: any) {
      toast.error('Failed to delete report');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading report data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {error} <button onClick={loadReports}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <ReportCard
        title="Breakfast"
        items={reportData.breakfast}
        onDownload={(format) => onDownload("breakfast", format)}
        onAdd={() => setAddDialog({ open: true, type: "breakfast" })}
        onEdit={(item) => setEditDialog({ open: true, report: { ...item, type: 'breakfast' } })}
        onDelete={(item) => setDeleteConfirm({ open: true, report: { ...item, type: 'breakfast' } })}
      />
      <ReportCard
        title="Lunch"
        items={reportData.lunch}
        onDownload={(format) => onDownload("lunch", format)}
        onAdd={() => setAddDialog({ open: true, type: "lunch" })}
        onEdit={(item) => setEditDialog({ open: true, report: { ...item, type: 'lunch' } })}
        onDelete={(item) => setDeleteConfirm({ open: true, report: { ...item, type: 'lunch' } })}
      />
      <ReportCard
        title="Dinner"
        items={reportData.dinner}
        onDownload={(format) => onDownload("dinner", format)}
        onAdd={() => setAddDialog({ open: true, type: "dinner" })}
        onEdit={(item) => setEditDialog({ open: true, report: { ...item, type: 'dinner' } })}
        onDelete={(item) => setDeleteConfirm({ open: true, report: { ...item, type: 'dinner' } })}
      />
      <AddEditReportDialog
        open={addDialog.open}
        onOpenChange={() => setAddDialog({ open: false, type: null })}
        onSave={(report) => {
          if (addDialog.type) {
            handleAddReport(addDialog.type, report);
          }
        }}
      />
      <AddEditReportDialog
        open={editDialog.open}
        onOpenChange={() => setEditDialog({ open: false, report: null })}
        initialReport={editDialog.report ? { ...editDialog.report, type: editDialog.report.type || '' } : undefined}
        onSave={(report) => {
          if (editDialog.report && editDialog.report.type) {
            handleEditReport({ ...report, type: editDialog.report.type, id: editDialog.report.id });
          }
        }}
      />
      <AlertDialog open={deleteConfirm.open} onOpenChange={() => setDeleteConfirm({ open: false, report: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
