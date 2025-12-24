import type { BulletItem as BulletItemType, BulletItemUpdate, BulletType } from "@/lib/database.types";
import { formatDisplayDate, isToday } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { tooltipHandle } from "@/routes/__root";
import { Tooltip } from "@base-ui/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BulletIconForm } from "./bullet-icon-form";
import { BulletItemForm } from "./bullet-item-form";


type BulletItemProps = {
  item: BulletItemType;
  onUpdate: (id: string, updates: BulletItemUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleComplete: (id: string) => Promise<void>;
  showDate?: boolean;
  isDraggingOver?: boolean;
  /** If true, start in edit mode (for newly created items) */
  startEditing?: boolean;
  /** If true, this is a newly created item (enables continuous creation) */
  isNewItem?: boolean;
  /** Callback when editing ends (cancel or blur) */
  onEditEnd?: () => void;
  /** Callback when saving a new item - triggers continuous creation */
  onSaveAndContinue?: () => void;
};

export const BulletItem = ({
  item,
  onUpdate,
  onDelete,
  onToggleComplete,
  showDate = false,
  isDraggingOver = false,
  startEditing = false,
  isNewItem = false,
  onEditEnd,
  onSaveAndContinue,
}: BulletItemProps) => {
  const [isEditing, setIsEditing] = useState(startEditing);
  const itemRef = useRef<HTMLDivElement>(null);

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

  // Scroll into view when starting to edit
  useEffect(() => {
    if (isEditing && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: "instant", block: "nearest" });
    }
  }, [isEditing]);

  // Start editing when startEditing prop changes to true
  useEffect(() => {
    if (startEditing) {
      setIsEditing(true);
    }
  }, [startEditing]);

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
      
      // If this is a new item, trigger continuous creation
      if (isNewItem && onSaveAndContinue) {
        onSaveAndContinue();
      } else {
        onEditEnd?.();
      }
    },
    [item.content, item.date, item.type, item.id, onUpdate, onEditEnd, onSaveAndContinue, isNewItem]
  );

  const handleCancel = useCallback(async () => {
    // If this is an empty item, delete it
    if (!item.content.trim()) {
      await onDelete(item.id);
    }
    setIsEditing(false);
    onEditEnd?.();
  }, [item.content, item.id, onDelete, onEditEnd]);

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



  const itemIsNotToday = !isToday(item.date);

  return (
   
      <div
        ref={(node) => {
          setNodeRef(node);
          (itemRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        style={style}
        {...(isEditing ? {} : { ...attributes, ...listeners })}
        className={cn(
          "group relative rounded-md border border-transparent",
          isDragging && "z-50 opacity-50",
          isDraggingOver && "border-primary/30 bg-primary/5",
        )}
      >
        {isEditing ? (
          <BulletItemForm
            key="editing"
            item={item}
            onSave={handleSave}
            onCancel={handleCancel}
            onBlurClose={handleCancel}
            className="flex flex-col gap-2 rounded-md bg-card shadow-sm p-2 border border-transparent focus-within:border-primary/30"
            />
        ) : (
          <div className={cn("bullet-item-content flex min-w-0 flex-1 rounded-md items-start gap-2 cursor-grab hover:bg-muted/50 p-2", isDragging && "cursor-grabbing")}>
            {/* Bullet Icon */}
            
            <BulletIconForm
              item={item}
              onToggleComplete={onToggleComplete}
            />
            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div
                onClick={handleContentClick}
                onKeyDown={(e) => e.key === "Enter" && handleContentClick(e as unknown as React.MouseEvent)}
                role="button"
                tabIndex={0}
                className={cn(
                  "min-h-6 w-full cursor-text whitespace-pre-wrap text-sm leading-relaxed hover:bg-muted/50 rounded-sm",
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
            <Tooltip.Trigger payload={{ text: 'Delete this item' }} handle={tooltipHandle}>
              <button
                type="button"
                onClick={handleDelete}
                className="mt-0.5 shrink-0 text-muted-foreground/40 opacity-0 hover:text-destructive group-hover:opacity-100"
                aria-label="Delete item"
                tabIndex={0}
                >
                <Trash2 className="size-4" />
              </button>
              </Tooltip.Trigger>
          </div>
        )}

      </div>

  );
};

