import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

export interface Kitchen {
  id: string;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    return a[sortConfig.key] > b[sortConfig.key] ? multiplier : -multiplier;
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, sortedKitchens.length)} of{" "}
          {sortedKitchens.length} kitchens
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {Array.from(
            { length: Math.ceil(sortedKitchens.length / itemsPerPage) },
            (_, i) => i + 1,
          ).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={
                page === currentPage ? "bg-primary text-primary-foreground" : ""
              }
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(
                  Math.ceil(sortedKitchens.length / itemsPerPage),
                  prev + 1,
                ),
              )
            }
            disabled={
              currentPage === Math.ceil(sortedKitchens.length / itemsPerPage)
            }
          >
            Next
          </Button>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Items" />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
