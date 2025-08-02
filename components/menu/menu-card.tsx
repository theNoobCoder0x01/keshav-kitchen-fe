"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, MoreVertical, Clock, ChefHat } from "lucide-react";
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
  recipe?: {
    name: string;
    id: string;
  };
  servings?: number;
  ghanFactor?: number;
}

interface MenuCardProps {
  title: string;
  items: MenuItem[];
  onAdd: () => void;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (itemId: string) => void;
  showActions?: boolean;
  className?: string;
  mealType?: string;
  timeRange?: string;
  description?: string;
  color?: "primary" | "success" | "warning" | "error" | "secondary";
  loading?: boolean;
}

export function MenuCard({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  showActions = false,
  className,
  mealType,
  timeRange,
  description,
  color = "primary",
  loading = false,
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

  const getColorClasses = () => {
    switch (color) {
      case "success":
        return {
          border: "border-success/20",
          background: "bg-success/5",
          icon: "text-success",
          iconBg: "bg-success/10",
        };
      case "warning":
        return {
          border: "border-yellow-500/20",
          background: "bg-yellow-50",
          icon: "text-yellow-600",
          iconBg: "bg-yellow-100",
        };
      case "error":
        return {
          border: "border-error/20",
          background: "bg-error/5",
          icon: "text-error",
          iconBg: "bg-error/10",
        };
      case "secondary":
        return {
          border: "border-secondary/20",
          background: "bg-secondary/5",
          icon: "text-secondary",
          iconBg: "bg-secondary/10",
        };
      default:
        return {
          border: "border-primary/20",
          background: "bg-primary/5",
          icon: "text-primary",
          iconBg: "bg-primary/10",
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-modern-lg group relative overflow-hidden",
        colorClasses.border,
        className,
      )}
      variant="default"
    >
      {/* Subtle gradient background */}
      <div className={cn("absolute inset-0 opacity-50", colorClasses.background)} />
      
      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "p-2 rounded-lg transition-all duration-300 group-hover:scale-110",
                colorClasses.iconBg
              )}>
                <ChefHat className={cn("w-5 h-5", colorClasses.icon)} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground truncate">{title}</h3>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {timeRange && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{timeRange}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span>{items?.length || 0} items planned</span>
              </div>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="gradient"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onAdd}
            disabled={loading}
            className="shadow-modern hover:shadow-modern-lg flex-shrink-0 ml-3"
          >
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative pt-0">
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
          {items?.length > 0 ? (
            items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "group/item flex items-center justify-between p-3 rounded-lg transition-all duration-200 animate-fade-in",
                  "hover:bg-background/80 hover:shadow-modern border border-transparent hover:border-border/50"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {item.isAddItem ? (
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border",
                      colorClasses.iconBg,
                      colorClasses.border
                    )}>
                      <Plus className={cn("w-4 h-4", colorClasses.icon)} />
                    </div>
                    <span className="text-foreground font-medium">
                      {item.name}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      {editingItem === item.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave(item);
                              if (e.key === "Escape") handleEditCancel();
                            }}
                            autoFocus
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditSave(item)}
                              disabled={loading}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleEditCancel}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">
                              {item.name}
                            </p>
                            {item.recipe && (
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                Recipe
                              </Badge>
                            )}
                          </div>
                          {item.weight && (
                            <p className="text-xs text-muted-foreground">
                              {item.weight}
                            </p>
                          )}
                          {(item.servings || item.ghanFactor) && (
                            <div className="flex gap-2 text-xs">
                              {item.servings && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  {item.servings} servings
                                </Badge>
                              )}
                              {item.ghanFactor && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  {item.ghanFactor}x ghan
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {showActions && editingItem !== item.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 group-hover/item:opacity-100 transition-all duration-200 hover:bg-muted"
                            disabled={loading}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="animate-scale-in">
                          <DropdownMenuItem
                            onClick={() => onEdit?.(item)}
                            className="cursor-pointer group"
                          >
                            <Edit className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete?.(item.id)}
                            className="cursor-pointer text-error focus:text-error group"
                          >
                            <Trash2 className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
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
            <div className="text-center py-8 animate-fade-in">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:scale-105",
                colorClasses.iconBg
              )}>
                <Plus className={cn("w-8 h-8", colorClasses.icon)} />
              </div>
              <h4 className="font-medium text-foreground mb-1">No items planned</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first meal item
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onAdd}
                disabled={loading}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add First Item
              </Button>
            </div>
          )}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Updating...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}