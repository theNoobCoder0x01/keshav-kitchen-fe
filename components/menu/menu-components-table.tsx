import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDecimal } from "@/lib/utils";
import { MealType, MealTypeEnum, MenuComponentApiItem } from "@/types";
import { Pencil, Trash2 } from "lucide-react";

export interface MenuComponent extends MenuComponentApiItem {}

interface Props {
  menuComponents: MenuComponent[];
  onEdit?: (menuComponent: MenuComponent) => void;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

function formatAverageSummary(menuComponent: MenuComponent) {
  return menuComponent.averages.map((average) => {
    const baseSummary = `${average.personType.name}: ${formatDecimal(average.quantity)} ${average.unit}`;

    if (average.unit === "pcs" && average.weightPerPiece != null) {
      return `${baseSummary} @ ${formatDecimal(average.weightPerPiece)} ${average.weightPerPieceUnit} each`;
    }

    return baseSummary;
  });
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
          <TableHead>Averages</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {menuComponents.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
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
              <TableCell className="max-w-md">
                {mc.averages.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    No averages configured.
                  </span>
                ) : (
                  <div className="space-y-1 text-sm">
                    {formatAverageSummary(mc).map((summary, index) => (
                      <div key={`${mc.id}-average-${index}`}>{summary}</div>
                    ))}
                  </div>
                )}
              </TableCell>
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
