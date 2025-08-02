"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  weight?: string;
  isAddItem?: boolean;
}

interface MenuCardProps {
  title: string;
  items: MenuItem[];
  onAdd: () => void;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (itemId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function MenuCard({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  showActions = false,
  className,
}: MenuCardProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEditStart = (item: MenuItem) => {
    setEditingItem(item.id);
    setEditValue(item.name);
  };

  const handleEditSave = (item: MenuItem) => {
    if (editValue.trim()) {
      onEdit?.({ ...item, name: editValue.trim() });
    }
    setEditingItem(null);
    setEditValue("");
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditValue("");
  };

  return (
    <Card
      className={cn(
        "glass border-0 shadow-modern card-hover",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="heading-3 mb-1">{title}</h3>
            <p className="body-small text-muted-foreground">
              {items?.length || 0} items planned
            </p>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg btn-hover"
            onClick={onAdd}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items?.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-all duration-200"
              >
                {item.isAddItem ? (
                  <>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center border border-primary/10">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground flex-1 font-medium ml-3">
                      {item.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      {editingItem === item.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-primary rounded-lg focus-ring bg-background"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave(item);
                              if (e.key === "Escape") handleEditCancel();
                            }}
                            autoFocus
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditSave(item)}
                              className="h-8 px-3 text-xs bg-primary hover:bg-primary/90"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleEditCancel}
                              className="h-8 px-3 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-foreground truncate">
                            {item.name}
                          </p>
                          {item.weight && (
                            <p className="body-small text-muted-foreground mt-1">
                              {item.weight}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {showActions && editingItem !== item.id && (
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
                            onClick={() => onEdit?.(item)}
                            className="cursor-pointer"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete?.(item.id)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="body-medium text-muted-foreground mb-2">No items planned</p>
              <p className="body-small text-muted-foreground">
                Click "Add" to plan your first meal
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}