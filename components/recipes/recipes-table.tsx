import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, Mail, Eye, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Recipe {
  id: string;
  name: string;
  type: string;
  issuedDate: string;
}

interface RecipesTableProps {
  recipes: Recipe[];
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
  deletingId?: string | null;
}

export function RecipesTable({ recipes, onEdit, onDelete, deletingId }: RecipesTableProps) {
  return (
    <Card className="bg-white border-[#dbdade]">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-[#dbdade]">
              <TableHead className="text-[#4b465c] font-semibold py-4 px-6">
                <div className="flex items-center space-x-2">
                  <span>NAME</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead className="text-[#4b465c] font-semibold py-4 px-6">
                <div className="flex items-center space-x-2">
                  <span>TYPE</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead className="text-[#4b465c] font-semibold py-4 px-6">
                <div className="flex items-center space-x-2">
                  <span>ISSUED DATE</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead className="text-[#4b465c] font-semibold py-4 px-6">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.map((recipe, index) => (
              <TableRow
                key={index}
                className="border-[#dbdade] hover:bg-[#f8f7fa]"
              >
                <TableCell className="py-4 px-6 text-[#4b465c]">
                  {recipe.name}
                </TableCell>
                <TableCell className="py-4 px-6 text-[#4b465c]">
                  {recipe.type}
                </TableCell>
                <TableCell className="py-4 px-6 text-[#4b465c]">
                  {recipe.issuedDate}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-[#4b465c] hover:bg-[#f8f7fa]"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-[#4b465c] hover:bg-[#f8f7fa]"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-[#4b465c] hover:bg-[#f8f7fa]"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-[#4b465c] hover:bg-[#f8f7fa]"
                      onClick={() => onEdit && onEdit(recipe)}
                      aria-label="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-[#4b465c] hover:bg-[#f8f7fa]"
                      onClick={() => onDelete && onDelete(recipe)}
                      aria-label="Delete"
                      disabled={deletingId === recipe.id}
                    >
                      {deletingId === recipe.id ? (
                        <span className="w-4 h-4 animate-spin border-2 border-[#674af5] border-t-transparent rounded-full inline-block" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#dbdade]">
          <p className="text-sm text-[#4b465c]/70">
            Showing 1 to 10 of 100 entries
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent"
            >
              Previous
            </Button>
            <Button
              size="sm"
              className="bg-[#674af5] hover:bg-[#674af5]/90 text-white w-8 h-8 p-0"
            >
              1
            </Button>
            {[2, 3, 4, 5].map((page) => (
              <Button
                key={page}
                variant="outline"
                size="sm"
                className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
