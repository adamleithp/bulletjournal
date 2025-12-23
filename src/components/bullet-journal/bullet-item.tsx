import { useState, useRef, useEffect, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import { GripVertical, Trash2, Check, X } from "lucide-react";
import type { BulletItem as BulletItemType, BulletItemUpdate } from "@/lib/database.types";
import { formatDisplayDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BulletIcon } from "./bullet-icon";

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
  const [editContent, setEditContent] = useState(item.content);
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      );
    }
  }, [isEditing]);

  // Track changes
  useEffect(() => {
    setHasChanges(editContent !== item.content);
  }, [editContent, item.content]);

  const handleSave = useCallback(async () => {
    if (editContent.trim() && editContent !== item.content) {
      await onUpdate(item.id, { content: editContent.trim() });
    }
    setIsEditing(false);
    setHasChanges(false);
  }, [editContent, item.content, item.id, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditContent(item.content);
    setIsEditing(false);
    setHasChanges(false);
  }, [item.content]);

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Check if the new focus target is within our container
      const relatedTarget = e.relatedTarget as Node;
      if (containerRef.current?.contains(relatedTarget)) {
        return;
      }

      // If no changes, exit edit mode
      if (!hasChanges) {
        setIsEditing(false);
        return;
      }
      // If there are changes, stay in edit mode (user must explicitly save/cancel)
    },
    [hasChanges]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleClick = useCallback(() => {
    if (!isEditing) {
      setIsEditing(true);
    }
  }, [isEditing]);

  const handleDelete = useCallback(async () => {
    await onDelete(item.id);
  }, [item.id, onDelete]);

  const handleToggleComplete = useCallback(async () => {
    if (item.type === "task" || item.type === "event") {
      await onToggleComplete(item.id);
    }
  }, [item.id, item.type, onToggleComplete]);

  const canComplete = item.type === "task" || item.type === "event";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
      className={cn(
        "group relative flex items-start gap-2 rounded-md border border-transparent px-1 py-1.5 transition-all duration-200",
        isDragging && "z-50 opacity-50",
        isDraggingOver && "border-primary/30 bg-primary/5",
        isEditing && "border-border bg-card shadow-sm",
        !isEditing && "hover:bg-muted/50"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className={cn(
          "mt-0.5 cursor-grab touch-none text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100",
          isDragging && "cursor-grabbing"
        )}
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripVertical className="size-4" />
      </button>

      {/* Bullet Icon */}
      <div className="mt-0.5">
        <BulletIcon
          type={item.type}
          completed={item.completed}
          migrated={item.migrated}
          onClick={canComplete ? handleToggleComplete : undefined}
        />
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex min-w-0 flex-1 flex-col gap-1">
        {isEditing ? (
          <>
            <textarea
              ref={inputRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={cn(
                "min-h-6 w-full resize-none bg-transparent text-sm outline-none",
                "placeholder:text-muted-foreground"
              )}
              placeholder="Enter content..."
              rows={1}
              aria-label="Edit bullet content"
            />
            <AnimatePresence>
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1"
                >
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={handleSave}
                    aria-label="Save changes"
                  >
                    <Check className="size-3" />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={handleCancel}
                    aria-label="Cancel changes"
                  >
                    <X className="size-3" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
            className={cn(
              "min-h-6 w-full cursor-text text-left text-sm",
              item.completed && "text-muted-foreground line-through"
            )}
            aria-label="Click to edit"
          >
            {item.content}
          </button>
        )}

        {/* Date badge for future items */}
        {showDate && !isEditing && (
          <span className="text-xs text-muted-foreground">
            {formatDisplayDate(item.date)}
          </span>
        )}
      </div>

      {/* Delete button (visible on hover) */}
      <button
        type="button"
        onClick={handleDelete}
        className={cn(
          "mt-0.5 text-muted-foreground/40 opacity-0 transition-all hover:text-destructive group-hover:opacity-100",
          isEditing && "opacity-100"
        )}
        aria-label="Delete item"
        tabIndex={0}
      >
        <Trash2 className="size-4" />
      </button>
    </motion.div>
  );
};

