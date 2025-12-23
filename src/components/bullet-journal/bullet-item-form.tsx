import { useState, useRef, useEffect, useCallback } from "react";
import { Square, Circle, Minus } from "lucide-react";
import { motion } from "motion/react";
import type { BulletItem, BulletType } from "@/lib/database.types";
import { getToday } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePickerDropdown } from "./date-picker-dropdown";

const bulletTypes: { type: BulletType; icon: React.ReactNode; label: string }[] = [
  { type: "task", icon: <Square className="size-3.5" />, label: "Task" },
  { type: "note", icon: <Minus className="size-3.5" />, label: "Note" },
  { type: "event", icon: <Circle className="size-3.5" />, label: "Event" },
];

type BulletItemFormProps = {
  /** Existing item for edit mode. If undefined, form is in create mode. */
  item?: BulletItem;
  /** Default date for new items */
  defaultDate?: string;
  /** Called when creating a new item */
  onCreate?: (content: string, type: BulletType, date: string) => Promise<void>;
  /** Called when updating an existing item */
  onSave?: (content: string, type: BulletType, date: string) => Promise<void>;
  /** Called when cancelling */
  onCancel: () => void;
  /** Called when form loses focus without changes (edit mode only) */
  onBlurClose?: () => void;
};

export const BulletItemForm = ({
  item,
  defaultDate,
  onCreate,
  onSave,
  onCancel,
  onBlurClose,
}: BulletItemFormProps) => {
  const isEditMode = !!item;
  
  const [content, setContent] = useState(item?.content ?? "");
  const [selectedType, setSelectedType] = useState<BulletType>(item?.type ?? "task");
  const [selectedDate, setSelectedDate] = useState(item?.date ?? defaultDate ?? getToday());
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (isEditMode) {
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        );
      }
    }
  }, [isEditMode]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [content]);

  const hasChanges = isEditMode
    ? content.trim() !== item.content || selectedDate !== item.date || selectedType !== item.type
    : false;

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) return;

    if (isEditMode && onSave) {
      await onSave(content.trim(), selectedType, selectedDate);
    } else if (onCreate) {
      await onCreate(content.trim(), selectedType, selectedDate);
      // Reset form for next entry in create mode
      setContent("");
      inputRef.current?.focus();
    }
  }, [content, selectedType, selectedDate, isEditMode, onCreate, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      const currentTarget = e.currentTarget;
      requestAnimationFrame(() => {
        const activeElement = document.activeElement;
        // Check if focus moved to a dropdown menu portal
        const isInDropdownPortal = activeElement?.closest('[data-slot="dropdown-menu-content"]');
        
        if (currentTarget.contains(activeElement) || isInDropdownPortal) {
          return;
        }

        // In create mode, close if no content
        if (!isEditMode && !content.trim()) {
          onCancel();
          return;
        }

        // In edit mode, close if no changes
        if (isEditMode && !hasChanges && onBlurClose) {
          onBlurClose();
        }
      });
    },
    [content, isEditMode, hasChanges, onCancel, onBlurClose]
  );

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-2 rounded-md border border-border bg-card p-2 shadow-sm"
      onBlur={handleBlur}
    >
      

      {/* Content input */}
      <div className="flex items-center gap-2">
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isEditMode ? "Enter content..." : "What's on your mind?"}
          className={cn(
            "min-h-6 flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none",
            "placeholder:text-muted-foreground"
          )}
          rows={1}
          aria-label={isEditMode ? "Edit bullet content" : "New item content"}
        />
        <Button
          size="xs"
          variant="ghost"
          onClick={onCancel}
          aria-label="Cancel"
        >
          Cancel
        </Button>
        <Button
          size="xs"
          onClick={handleSubmit}
          disabled={!content.trim()}
          aria-label={isEditMode ? "Save" : "Add"}
        >
          {isEditMode ? "Save" : "Add"}
        </Button>
      </div>
      
      {/* Type selector row */}
      <div className="flex flex-wrap items-center gap-1">
        {bulletTypes.map(({ type, icon, label }) => (
          <Button
            key={type}
            size="xs"
            variant={selectedType === type ? "default" : "ghost"}
            onClick={() => setSelectedType(type)}
            aria-label={`Select ${label}`}
            aria-pressed={selectedType === type}
          >
            {icon}
            <span className="ml-1">{label}</span>
          </Button>
        ))}

        {/* Date selector */}
        <div className="ml-auto">
          <DatePickerDropdown
            value={selectedDate}
            onChange={setSelectedDate}
            size="xs"
          />
        </div>
      </div>
    </motion.div>
  );
};

