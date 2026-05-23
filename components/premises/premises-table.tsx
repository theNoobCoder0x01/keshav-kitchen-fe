import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TablePagination,
  TablePaginationSkeleton,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "@/hooks/use-translations";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { Premise } from "@/types";

interface PremisesTableProps {
  premises: Premise[];
  onEdit: (premise: Premise) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  itemsPerPageOptions?: number[];
}

export function PremisesTable({
  premises,
  onEdit,
  onDelete,
  deletingId,
  itemsPerPageOptions = [10, 20],
}: PremisesTableProps) {
  const { t } = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(
    itemsPerPageOptions[0] || 10,
  );
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Premise;
    direction: "ascending" | "descending" | null;
  }>({
    key: "name",
    direction: "ascending",
  });

  const handleSort = (key: keyof Premise) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const getSortIcon = (key: keyof Premise) => {
    if (sortConfig.key !== key || sortConfig.direction === null) {
      return <ChevronDown className="w-4 h-4 opacity-50" />;
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const sortedPremises = [...premises].sort((a, b) => {
    if (sortConfig.direction === null) return 0;
    const multiplier = sortConfig.direction === "ascending" ? 1 : -1;
    const av = (a[sortConfig.key] ?? "").toString();
    const bv = (b[sortConfig.key] ?? "").toString();
    return av > bv ? multiplier : av < bv ? -multiplier : 0;
  });

  const paginatedPremises = sortedPremises.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="rounded-lg border shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="text-foreground font-semibold py-4 px-6 cursor-pointer"
              onClick={() => handleSort("sequenceNumber")}
            >
              <div className="flex items-center space-x-2">
                <span>{t("premises.sequenceNumber")}</span>
                {getSortIcon("sequenceNumber")}
              </div>
            </TableHead>
            <TableHead
              className="text-foreground font-semibold py-4 px-6 cursor-pointer"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center space-x-2">
                <span>{t("common.name")}</span>
                {getSortIcon("name")}
              </div>
            </TableHead>
            <TableHead
              className="text-foreground font-semibold py-4 px-6 cursor-pointer"
              onClick={() => handleSort("location")}
            >
              <div className="flex items-center space-x-2">
                <span>{t("premises.location")}</span>
                {getSortIcon("location")}
              </div>
            </TableHead>
            <TableHead className="text-foreground font-semibold py-4 px-6">
              {t("common.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedPremises.length > 0 ? (
            paginatedPremises.map((premise: Premise) => (
              <TableRow key={premise.id}>
                <TableCell className="py-4 px-6 text-foreground">
                  {premise.sequenceNumber ?? 0}
                </TableCell>
                <TableCell className="py-4 px-6 font-medium text-foreground">
                  <Link
                    href={`/premises/${premise.id}`}
                    className="text-primary underline hover:text-primary/80"
                  >
                    {premise.name}
                  </Link>
                </TableCell>
                <TableCell className="py-4 px-6 text-foreground">
                  {premise.location || "-"}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-foreground hover:bg-muted"
                      onClick={() => onEdit(premise)}
                      aria-label={t("premises.editPremise")}
                      title={t("premises.editPremise")}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(premise.id)}
                      disabled={deletingId === premise.id}
                      aria-label={t("premises.deletePremise")}
                      title={t("premises.deletePremise")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                {t("premises.noPremisesFound")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        currentPage={currentPage}
        totalItems={sortedPremises.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={itemsPerPageOptions}
      />
    </div>
  );
}

// Skeleton loader for PremisesTable
export function PremisesTableSkeleton({
  rowCount = 10,
}: {
  rowCount?: number;
}) {
  return (
    <div className="rounded-lg border shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-foreground font-semibold py-4 px-6">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-8 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </TableHead>
            <TableHead className="text-foreground font-semibold py-4 px-6">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </TableHead>
            <TableHead className="text-foreground font-semibold py-4 px-6">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </TableHead>
            <TableHead className="text-foreground font-semibold py-4 px-6">
              <Skeleton className="h-4 w-20 rounded" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, idx) => (
            <TableRow key={idx}>
              <TableCell className="py-4 px-6">
                <Skeleton className="h-5 w-8 rounded" />
              </TableCell>
              <TableCell className="py-4 px-6">
                <Skeleton className="h-5 w-32 rounded" />
              </TableCell>
              <TableCell className="py-4 px-6">
                <Skeleton className="h-4 w-24 rounded" />
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePaginationSkeleton />
    </div>
  );
}
