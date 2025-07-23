"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
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
        "bg-white/80 backdrop-blur-sm border-[#dbdade]/50 hover:shadow-lg transition-all duration-300",
        className,
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#4b465c] mb-1">
              {title}
            </h3>
            <p className="text-sm text-[#4b465c]/60">{items.length} items</p>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#674af5] to-[#856ef7] hover:from-[#674af5]/90 hover:to-[#856ef7]/90 text-white shadow-md hover:shadow-lg transition-all duration-200"
            onClick={onAdd}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>

        <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex items-center p-3 hover:bg-[#f8f7fa] rounded-xl transition-all duration-200",
                showActions ? "justify-between" : "space-x-3",
              )}
            >
              {item.isAddItem ? (
                <>
                  <div className="w-10 h-10 bg-gradient-to-br from-[#674af5]/10 to-[#856ef7]/5 rounded-xl flex items-center justify-center border border-[#674af5]/10">
                    <Plus className="w-5 h-5 text-[#674af5]" />
                  </div>
                  <span className="text-[#4b465c] flex-1 font-medium">
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
                          className="w-full px-3 py-2 text-sm border border-[#674af5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#674af5]/20 bg-white"
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
                            className="h-7 px-3 text-xs bg-[#674af5] hover:bg-[#674af5]/90"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            className="h-7 px-3 text-xs bg-transparent"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[#4b465c] font-medium truncate">
                          {item.name}
                        </p>
                        {item.weight && (
                          <p className="text-sm text-[#4b465c]/60 mt-1">
                            {item.weight}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {showActions && editingItem !== item.id && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-[#674af5] hover:bg-[#674af5]/10"
                        onClick={() => handleEditStart(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-[#ea5455] hover:bg-[#ea5455]/10"
                        onClick={() => onDelete?.(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
