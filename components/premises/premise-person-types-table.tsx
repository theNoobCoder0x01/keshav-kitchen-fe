import type { PremisePersonType } from "@/types/premises";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "@/hooks/use-translations";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  personTypes: PremisePersonType[];
  onEdit?: (personType: PremisePersonType) => void;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

export function PremisePersonTypesTable({
  personTypes,
  onEdit,
  onDelete,
  deletingId,
}: Props) {
  const { t } = useTranslations();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("premises.sequenceNumber")}</TableHead>
          <TableHead>{t("common.name")}</TableHead>
          <TableHead>{t("premises.personTypeDescription")}</TableHead>
          <TableHead>{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {personTypes.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground"
            >
              {t("premises.noPersonTypesFound")}
            </TableCell>
          </TableRow>
        ) : (
          personTypes.map((personType) => (
            <TableRow key={personType.id}>
              <TableCell>{personType.sequenceNumber}</TableCell>
              <TableCell>{personType.name}</TableCell>
              <TableCell>{personType.description || "—"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit?.(personType)}
                  aria-label={t("premises.editPersonType")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === personType.id}
                  onClick={() => onDelete?.(personType.id)}
                  aria-label={t("premises.deletePersonType")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
