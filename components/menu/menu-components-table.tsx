import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MealType, MealTypeEnum } from "@/types";
import { Pencil, Trash2 } from "lucide-react";

export interface MenuComponent {
  id: string;
  name: string;
  label: string;
  mealType: string;
  sequenceNumber: number;
}

interface Props {
  menuComponents: MenuComponent[];
  onEdit?: (menuComponent: MenuComponent) => void;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

export function MenuComponentsTable({
  menuComponents,
  onEdit,
  onDelete,
  deletingId,
}: Props) {
  const mealTypesObj = {
    [MealTypeEnum.BREAKFAST]: "Breakfast",
    [MealTypeEnum.LUNCH]: "Lunch",
    [MealTypeEnum.DINNER]: "Dinner",
    [MealTypeEnum.SNACK]: "Snack",
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sequence Number</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Label</TableHead>
          <TableHead>Meal Type</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {menuComponents.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground"
            >
              No menu components found.
            </TableCell>
          </TableRow>
        ) : (
          menuComponents.map((mc) => (
            <TableRow key={mc.id}>
              <TableCell>{mc.sequenceNumber}</TableCell>
              <TableCell>{mc.name}</TableCell>
              <TableCell>{mc.label}</TableCell>
              <TableCell>{mealTypesObj[mc.mealType as MealType]}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit?.(mc)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === mc.id}
                  onClick={() => onDelete?.(mc.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
