import { useCallback } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "motion/react";
import type { BulletItem as BulletItemType, BulletItemUpdate, BulletType } from "@/lib/database.types";
import type { DateCategory } from "@/lib/date-utils";
import { getToday, getTomorrow } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
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
}: BulletColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: category });

  const getDateForCategory = useCallback((cat: DateCategory): string => {
    if (cat === "today") return getToday();
    if (cat === "tomorrow") return getTomorrow();
    // For future, use a date 2 days from now as default
    const future = new Date();
    future.setDate(future.getDate() + 2);
    return future.toISOString().split("T")[0];
  }, []);

  const handleCreate = useCallback(
    async (content: string, type: BulletType) => {
      const date = getDateForCategory(category);
      await onCreate(content, type, date);
    },
    [category, getDateForCategory, onCreate]
  );

  // Show date for future items
  const showDate = category === "future";

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
      onClick={() => {
        
        console.log("clicked");
      }}
    >
      {/* Header */}
      <div className="mb-4 rounded-md p-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
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
                showDate={showDate}
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
      <NewBulletInput onCreate={handleCreate} />
    </motion.div>
  );
};

