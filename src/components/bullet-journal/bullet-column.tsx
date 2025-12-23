import { useCallback } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "motion/react";
import { Filter } from "lucide-react";
import type { BulletItem as BulletItemType, BulletItemUpdate, BulletType } from "@/lib/database.types";
import type { DateCategory } from "@/lib/date-utils";
import { getToday, getTomorrow } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BulletItem } from "./bullet-item";
import { NewBulletInput } from "./new-bullet-input";

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

  const getDateForCategory = useCallback((cat: DateCategory): string => {
    if (cat === "today") return getToday();
    if (cat === "tomorrow") return getTomorrow();
    const future = new Date();
    future.setDate(future.getDate() + 2);
    return future.toISOString().split("T")[0];
  }, []);

  const handleCreate = useCallback(
    async (content: string, type: BulletType, date: string) => {
      await onCreate(content, type, date);
    },
    [onCreate]
  );

  const defaultDate = getDateForCategory(category);

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: category === "today" ? 0 : category === "tomorrow" ? 0.1 : 0.2 }}
      className={cn(
        "flex grow flex-col p-2 hover:bg-muted/10",
        isSingleView ? "w-full max-w-xl mx-auto" : "flex-1 min-w-[280px]",
        isOver && "ring-2 ring-primary/30",
        isActive && "ring-2 ring-primary"
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between rounded-md p-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* Filter toggle - only show for "today" column */}
        {category === "today" && onToggleFilter && (
          <Button
            size="icon-xs"
            variant={showOnlyTargetDate ? "default" : "ghost"}
            onClick={onToggleFilter}
            aria-label={showOnlyTargetDate ? "Show all items created today" : "Show only today's items"}
            title={showOnlyTargetDate ? "Showing only today's items" : "Showing all items created today"}
          >
            <Filter className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1">
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <BulletItem
                key={item.id}
                item={item}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onToggleComplete={onToggleComplete}
                isDraggingOver={isOver}
              />
            ))}
          </div>
        </SortableContext>

        {items.length === 0 && (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground/50">
            No items yet
          </div>
        )}
      </div>

      {/* New item input */}
      <NewBulletInput onCreate={handleCreate} defaultDate={defaultDate} />
    </motion.div>
  );
};
