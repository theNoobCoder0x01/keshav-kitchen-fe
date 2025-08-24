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
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

import type { Kitchen } from "@/types";

interface KitchensTableProps {
  kitchens: Kitchen[];
  onEdit: (kitchen: Kitchen) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  itemsPerPageOptions?: number[];
}

export function KitchensTable({
  kitchens,
  onEdit,
  onDelete,
  deletingId,
  itemsPerPageOptions = [5, 10, 20],
}: KitchensTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageOptions[0] || 5);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Kitchen;
    direction: "ascending" | "descending" | null;
  }>({
    key: "name",
    direction: "ascending",
  });

  const handleSort = (key: keyof Kitchen) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const getSortIcon = (key: keyof Kitchen) => {
    if (sortConfig.key !== key || sortConfig.direction === null) {
      return <ChevronDown className="w-4 h-4 opacity-50" />;
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const sortedKitchens = [...kitchens].sort((a, b) => {
    if (sortConfig.direction === null) return 0;
    const multiplier = sortConfig.direction === "ascending" ? 1 : -1;
    const av = (a[sortConfig.key] ?? "").toString();
    const bv = (b[sortConfig.key] ?? "").toString();
    return av > bv ? multiplier : av < bv ? -multiplier : 0;
  });

  const paginatedKitchens = sortedKitchens.slice(
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
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center space-x-2">
                <span>NAME</span>
                {getSortIcon("name")}
              </div>
            </TableHead>
            <TableHead
              className="text-foreground font-semibold py-4 px-6 cursor-pointer"
              onClick={() => handleSort("location")}
            >
              <div className="flex items-center space-x-2">
                <span>LOCATION</span>
                {getSortIcon("location")}
              </div>
            </TableHead>
            <TableHead className="text-foreground font-semibold py-4 px-6">
              ACTIONS
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedKitchens.length > 0 ? (
            paginatedKitchens.map((kitchen: Kitchen) => (
              <TableRow key={kitchen.id}>
                <TableCell className="py-4 px-6 font-medium text-foreground">
                  {kitchen.name}
                </TableCell>
                <TableCell className="py-4 px-6 text-foreground">
                  {kitchen.location || "-"}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-foreground hover:bg-muted"
                      onClick={() => onEdit(kitchen)}
                      aria-label="Edit kitchen"
                      title="Edit kitchen"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(kitchen.id)}
                      disabled={deletingId === kitchen.id}
                      aria-label="Delete kitchen"
                      title="Delete kitchen"
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
                No kitchens found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        currentPage={currentPage}
        totalItems={sortedKitchens.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={itemsPerPageOptions}
      />
    </div>
  );
}

// Skeleton loader for KitchensTable
export function KitchensTableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="rounded-lg border shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
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
