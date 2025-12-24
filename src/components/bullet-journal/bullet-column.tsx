import { useState, useCallback, useRef, useEffect } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Filter, Plus } from "lucide-react";
import type { BulletItem as BulletItemType, BulletItemUpdate, BulletType } from "@/lib/database.types";
import type { DateCategory } from "@/lib/date-utils";
import { getToday, getTomorrow } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BulletItem } from "./bullet-item";
import { Tooltip } from "@base-ui/react";
import { tooltipHandle } from "@/routes/__root";

type BulletColumnProps = {
  title: string;
  category: DateCategory;
  items: BulletItemType[];
  onUpdate: (id: string, updates: BulletItemUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleComplete: (id: string) => Promise<void>;
  onCreate: (content: string, type: BulletType, date: string) => Promise<BulletItemType | null>;
  isActive?: boolean;
  isSingleView?: boolean;
  showOnlyTargetDate?: boolean;
  onToggleFilter?: () => void;
};

export const BulletColumn = ({
  title,
  category,
  items,
  onUpdate,
  onDelete,
  onToggleComplete,
  onCreate,
  isActive = false,
  isSingleView = false,
  showOnlyTargetDate = false,
  onToggleFilter,
}: BulletColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: category });
  const [editingNewItemId, setEditingNewItemId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const getDateForCategory = useCallback((cat: DateCategory): string => {
    if (cat === "today") return getToday();
    if (cat === "tomorrow") return getTomorrow();
    const future = new Date();
    future.setDate(future.getDate() + 2);
    return future.toISOString().split("T")[0];
  }, []);

  // Scroll to bottom when new item is created
  useEffect(() => {
    if (editingNewItemId && listRef.current) {
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "instant",
        });
      });
    }
  }, [editingNewItemId]);

  const handleAddNewItem = useCallback(async () => {
    const defaultDate = getDateForCategory(category);
    // Create an empty item that starts in edit mode
    const newItem = await onCreate("", "task", defaultDate);
    if (newItem) {
      setEditingNewItemId(newItem.id);
    }
  }, [category, getDateForCategory, onCreate]);

  const handleEditEnd = useCallback(() => {
    setEditingNewItemId(null);
  }, []);

  // When saving a new item, create another one for continuous creation
  const handleSaveAndContinue = useCallback(async () => {
    setEditingNewItemId(null);
    // Small delay to allow the current item to finish saving
    requestAnimationFrame(() => {
      handleAddNewItem();
    });
  }, [handleAddNewItem]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col p-2 hover:bg-muted/10 overflow-hidden",
        isSingleView ? "w-full max-w-xl mx-auto grow" : "flex-1 min-w-[280px]",
        isOver && "ring-2 ring-primary/30",
        isActive && "ring-2 ring-primary"
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between rounded-md p-2 shrink-0">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* Filter toggle - only show for "today" column */}
        {category === "today" && onToggleFilter && (
          <Tooltip.Trigger payload={{ text: 'Show only today\'s items' }} handle={tooltipHandle}>

          <Button
            size="icon-xs"
            variant={showOnlyTargetDate ? "default" : "ghost"}
            onClick={onToggleFilter}
            aria-label={showOnlyTargetDate ? "Show all items created today" : "Show only today's items"}
            title={showOnlyTargetDate ? "Showing only today's items" : "Showing all items created today"}
            >
            <Filter className="size-3.5" />
          </Button>
            </Tooltip.Trigger>
        )}
      </div>

      {/* Items list - scrollable */}
      <div ref={listRef} className="flex-1 min-h-0">
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-0.5">
            {items.map((item) => {
              const isNewItem = item.id === editingNewItemId;
              return (
                <BulletItem
                  key={item.id}
                  item={item}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onToggleComplete={onToggleComplete}
                  isDraggingOver={isOver}
                  startEditing={isNewItem}
                  isNewItem={isNewItem}
                  onEditEnd={isNewItem ? handleEditEnd : undefined}
                  onSaveAndContinue={isNewItem ? handleSaveAndContinue : undefined}
                />
              );
            })}
          </div>
        </SortableContext>

        {items.length === 0 && (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground/50">
            No items yet
          </div>
        )}
      </div>

      {/* Add new item button */}
      <div className="mt-2 shrink-0">
        <button
          type="button"
          onClick={handleAddNewItem}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          aria-label="Add new item"
        >
          <Plus className="size-4" />
          <span>Add new item...</span>
        </button>
      </div>
    </div>
  );
};


function InfoContent() {
  return <span>Delete this item</span>;
}