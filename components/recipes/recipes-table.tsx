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
import type { RecipeListItem as Recipe } from "@/types";
import { Edit, Printer, Trash2 } from "lucide-react";
import Link from "next/link";

interface RecipesTableProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onPrint: (recipe: Recipe) => void;
  deletingId: string | null;
  itemsPerPageOptions?: number[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  listQuery?: string;
}

export function RecipesTable({
  recipes,
  onEdit,
  onDelete,
  onPrint,
  deletingId,
  itemsPerPageOptions = [10, 20, 50],
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onItemsPerPageChange,
  listQuery,
}: RecipesTableProps) {
  // Use server-side pagination - no local slicing needed
  const displayRecipes = recipes;

  return (
    <div className="bg-card rounded-lg border shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-foreground font-semibold py-4 px-6 cursor-pointer">
              <div className="flex items-center space-x-2">
                <span>NAME</span>
              </div>
            </TableHead>
            <TableHead className="text-foreground font-semibold py-4 px-6 cursor-pointer">
              <div className="flex items-center space-x-2">
                <span>CATEGORY</span>
              </div>
            </TableHead>
            <TableHead className="text-foreground font-semibold py-4 px-6 cursor-pointer">
              <div className="flex items-center space-x-2">
                <span>SUBCATEGORY</span>
              </div>
            </TableHead>
            <TableHead className="text-foreground font-semibold py-4 px-6">
              ACTIONS
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayRecipes.length > 0 ? (
            displayRecipes.map((recipe: Recipe) => (
              <TableRow key={recipe.id}>
                <TableCell className="py-4 px-6 font-medium text-foreground">
                  <Link
                    href={`/recipes/${recipe.id}${listQuery ? `?${listQuery}` : ""}`}
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
                No recipes found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        currentPage={currentPage}
        totalItems={
          totalPages *
          (recipes.length > 0 ? recipes.length : itemsPerPageOptions[0] || 10)
        } // Approximate for display
        itemsPerPage={itemsPerPageOptions[0] || 10}
        onPageChange={onPageChange || (() => {})}
        onItemsPerPageChange={onItemsPerPageChange || (() => {})}
        itemsPerPageOptions={itemsPerPageOptions}
      />
    </div>
  );
}

// Skeleton loader for RecipesTable
export function RecipesTableSkeleton({ rowCount = 10 }: { rowCount?: number }) {
  return (
    <div className="bg-card rounded-lg border shadow-xs">
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
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-24 rounded" />
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
                <Skeleton className="h-4 w-20 rounded" />
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8 rounded" />
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
