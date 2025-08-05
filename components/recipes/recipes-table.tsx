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
import { ChevronDown, ChevronUp, Edit, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface Recipe {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  cost: number;
  ingredients?: Array<{
    name: string;
    quantity: number | string;
    unit: string;
    costPerUnit?: number | string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface RecipesTableProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onPrint: (recipe: Recipe) => void;
  deletingId: string | null;
  itemsPerPageOptions?: number[];
}

export function RecipesTable({
  recipes,
  onEdit,
  onDelete,
  onPrint,
  deletingId,
  itemsPerPageOptions = [5, 10, 20],
}: RecipesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageOptions[0] || 5);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Recipe;
    direction: "ascending" | "descending" | null;
  }>({
    key: "name",
    direction: "ascending",
  });

  const handleSort = (key: keyof Recipe) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const getSortIcon = (key: keyof Recipe) => {
    if (sortConfig.key !== key || sortConfig.direction === null) {
      return <ChevronDown className="w-4 h-4 opacity-50" />;
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const sortedRecipes = [...recipes].sort((a, b) => {
    if (sortConfig.direction === null) return 0;
    const multiplier = sortConfig.direction === "ascending" ? 1 : -1;
    return a[sortConfig.key] > b[sortConfig.key] ? multiplier : -multiplier;
  });

  const paginatedRecipes = sortedRecipes.slice(
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
              onClick={() => handleSort("category")}
            >
              <div className="flex items-center space-x-2">
                <span>CATEGORY</span>
                {getSortIcon("category")}
              </div>
            </TableHead>
            <TableHead
              className="text-foreground font-semibold py-4 px-6 cursor-pointer"
              onClick={() => handleSort("subcategory")}
            >
              <div className="flex items-center space-x-2">
                <span>SUBCATEGORY</span>
                {getSortIcon("subcategory")}
              </div>
            </TableHead>
            <TableHead className="text-foreground font-semibold py-4 px-6">
              ACTIONS
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRecipes.length > 0 ? (
            paginatedRecipes.map((recipe: Recipe) => (
              <TableRow key={recipe.id}>
                <TableCell className="py-4 px-6 font-medium text-foreground">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="hover:text-primary hover:underline cursor-pointer transition-colors"
                  >
                    {recipe.name}
                  </Link>
                </TableCell>
                <TableCell className="py-4 px-6 text-foreground">
                  {recipe.category}
                </TableCell>
                <TableCell className="py-4 px-6 text-foreground">
                  {recipe.subcategory}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-foreground hover:bg-muted"
                      onClick={() => onEdit(recipe)}
                      aria-label="Edit recipe"
                      title="Edit recipe"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                      onClick={() => onPrint(recipe)}
                      aria-label="Print recipe"
                      title="Print recipe"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(recipe.id)}
                      disabled={deletingId === recipe.id}
                      aria-label="Delete recipe"
                      title="Delete recipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, sortedRecipes.length)} of{" "}
          {sortedRecipes.length} recipes
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
            { length: Math.ceil(sortedRecipes.length / itemsPerPage) },
            (_, i) => i + 1,
          ).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline-solid"}
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
                  Math.ceil(sortedRecipes.length / itemsPerPage),
                  prev + 1,
                ),
              )
            }
            disabled={
              currentPage === Math.ceil(sortedRecipes.length / itemsPerPage)
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
