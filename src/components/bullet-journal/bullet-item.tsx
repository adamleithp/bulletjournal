import { useState, useEffect, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import { Trash2 } from "lucide-react";
import type { BulletItem as BulletItemType, BulletItemUpdate, BulletType } from "@/lib/database.types";
import { formatDisplayDate, isToday } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { BulletIcon } from "./bullet-icon";
import { BulletItemForm } from "./bullet-item-form";

type BulletItemProps = {
  item: BulletItemType;
  onUpdate: (id: string, updates: BulletItemUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleComplete: (id: string) => Promise<void>;
  showDate?: boolean;
  isDraggingOver?: boolean;
};

export const BulletItem = ({
  item,
  onUpdate,
  onDelete,
  onToggleComplete,
  showDate = false,
  isDraggingOver = false,
}: BulletItemProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Reset editing state when item changes
  useEffect(() => {
    setIsEditing(false);
  }, [item.id]);

  const handleSave = useCallback(
    async (content: string, type: BulletType, date: string) => {
      const updates: BulletItemUpdate = {};
      if (content !== item.content) {
        updates.content = content;
      }
      if (date !== item.date) {
        updates.date = date;
      }
      if (type !== item.type) {
        updates.type = type;
      }
      if (Object.keys(updates).length > 0) {
        await onUpdate(item.id, updates);
      }
      setIsEditing(false);
    },
    [item.content, item.date, item.type, item.id, onUpdate]
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isEditing) {
        setIsEditing(true);
      }
    },
    [isEditing]
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await onDelete(item.id);
    },
    [item.id, onDelete]
  );

  const handleToggleComplete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.type === "task" || item.type === "event") {
        await onToggleComplete(item.id);
      }
    },
    [item.id, item.type, onToggleComplete]
  );

  const canComplete = item.type === "task" || item.type === "event";
  const itemIsNotToday = !isToday(item.date);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
      {...(isEditing ? {} : { ...attributes, ...listeners })}
      className={cn(
        "group relative rounded-md border border-transparent transition-all duration-200",
        isDragging && "z-50 opacity-50",
        isDraggingOver && "border-primary/30 bg-primary/5",
        !isEditing && "flex items-start gap-2 px-2 py-1.5 cursor-grab hover:bg-muted/50",
        !isEditing && isDragging && "cursor-grabbing"
      )}
    >
      <AnimatePresence mode="wait">
        {isEditing ? (
          <BulletItemForm
            key="editing"
            item={item}
            onSave={handleSave}
            onCancel={handleCancel}
            onBlurClose={handleCancel}
          />
        ) : (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-w-0 flex-1 items-start gap-2"
          >
            {/* Bullet Icon */}
            <div
              className="mt-0.5 shrink-0"
              onClick={canComplete ? handleToggleComplete : undefined}
              onKeyDown={
                canComplete
                  ? (e) => e.key === "Enter" && handleToggleComplete(e as unknown as React.MouseEvent)
                  : undefined
              }
              role={canComplete ? "button" : undefined}
              tabIndex={canComplete ? 0 : undefined}
            >
              <BulletIcon
                type={item.type}
                completed={item.completed}
                migrated={item.migrated}
              />
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div
                onClick={handleContentClick}
                onKeyDown={(e) => e.key === "Enter" && handleContentClick(e as unknown as React.MouseEvent)}
                role="button"
                tabIndex={0}
                className={cn(
                  "min-h-6 w-full cursor-text whitespace-pre-wrap text-sm leading-relaxed",
                  item.completed && "text-muted-foreground line-through"
                )}
                aria-label="Click to edit"
              >
                {item.content}
              </div>

              {/* Date badge - show if not today or if showDate prop is true */}
              {(showDate || itemIsNotToday) && (
                <span className="text-xs text-muted-foreground">
                  {formatDisplayDate(item.date)}
                </span>
              )}
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={handleDelete}
              className="mt-0.5 shrink-0 text-muted-foreground/40 opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
              aria-label="Delete item"
              tabIndex={0}
            >
              <Trash2 className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
