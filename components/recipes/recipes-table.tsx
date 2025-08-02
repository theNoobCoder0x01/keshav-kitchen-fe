import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Edit, Printer, Trash2, MoreVertical, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  itemsPerPageOptions = [10, 25, 50],
}: RecipesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageOptions[0] || 10);
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
      <ChevronUp className="w-4 h-4 text-primary" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary" />
    );
  };

  const sortedRecipes = [...recipes].sort((a, b) => {
    if (sortConfig.direction === null) return 0;
    const multiplier = sortConfig.direction === "ascending" ? 1 : -1;
    return a[sortConfig.key] > b[sortConfig.key] ? multiplier : -multiplier;
  });

  const totalPages = Math.ceil(sortedRecipes.length / itemsPerPage);
  const paginatedRecipes = sortedRecipes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead
              className="text-foreground font-semibold py-4 px-6 cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center space-x-2">
                <span>Recipe Name</span>
                {getSortIcon("name")}
              </div>
            </TableHead>
            <TableHead
              className="text-foreground font-semibold py-4 px-6 cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleSort("category")}
            >
              <div className="flex items-center space-x-2">
                <span>Category</span>
                {getSortIcon("category")}
              </div>
            </TableHead>
            <TableHead
              className="text-foreground font-semibold py-4 px-6 cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleSort("subcategory")}
            >
              <div className="flex items-center space-x-2">
                <span>Subcategory</span>
                {getSortIcon("subcategory")}
              </div>
            </TableHead>
            <TableHead className="text-foreground font-semibold py-4 px-6">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRecipes.length > 0 ? (
            paginatedRecipes.map((recipe: Recipe) => (
              <TableRow 
                key={recipe.id} 
                className="border-border/50 hover:bg-muted/30 transition-colors group"
              >
                <TableCell className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Link 
                        href={`/recipes/${recipe.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2 group/link"
                      >
                        {recipe.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </Link>
                      {recipe.ingredients && (
                        <p className="body-small text-muted-foreground mt-1">
                          {recipe.ingredients.length} ingredients
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <Badge variant="secondary" className="font-medium">
                    {recipe.category}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <Badge variant="outline" className="font-medium">
                    {recipe.subcategory}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="animate-scale-in">
                      <DropdownMenuItem
                        onClick={() => onEdit(recipe)}
                        className="cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Recipe
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onPrint(recipe)}
                        className="cursor-pointer"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Recipe
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(recipe.id)}
                        disabled={deletingId === recipe.id}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Recipe
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 bg-muted/50 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">No recipes found</p>
                    <p className="body-small text-muted-foreground">
                      Try adjusting your search or add a new recipe
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 border-t border-border/50">
        <div className="body-small text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, sortedRecipes.length)} of{" "}
          {sortedRecipes.length} recipes
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="body-small text-muted-foreground">Rows per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
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

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn-hover"
            >
              Previous
            </Button>
            
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={index} className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page as number)}
                  className={cn(
                    "w-8 h-8 p-0 btn-hover",
                    page === currentPage && "bg-primary text-primary-foreground"
                  )}
                >
                  {page}
                </Button>
              )
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="btn-hover"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}