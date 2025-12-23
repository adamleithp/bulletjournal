import { useState, useRef, useCallback } from "react";
import { Plus, Square, Circle, Minus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { BulletType } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NewBulletInputProps = {
  onCreate: (content: string, type: BulletType) => Promise<void>;
  placeholder?: string;
};

const bulletTypes: { type: BulletType; icon: React.ReactNode; label: string }[] = [
  { type: "task", icon: <Square className="size-3.5" />, label: "Task" },
  { type: "note", icon: <Minus className="size-3.5" />, label: "Note" },
  { type: "event", icon: <Circle className="size-3.5" />, label: "Event" },
];

export const NewBulletInput = ({
  onCreate,
  placeholder = "Add new item...",
}: NewBulletInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] = useState<BulletType>("task");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setContent("");
    setSelectedType("task");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (content.trim()) {
      await onCreate(content.trim(), selectedType);
      setContent("");
      inputRef.current?.focus();
    }
  }, [content, selectedType, onCreate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        handleClose();
      }
    },
    [handleSubmit, handleClose]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Check if focus moved to another element within the component
      const currentTarget = e.currentTarget;
      requestAnimationFrame(() => {
        if (!currentTarget.contains(document.activeElement) && !content.trim()) {
          handleClose();
        }
      });
    },
    [content, handleClose]
  );

  return (
    <div className="mt-2" onBlur={handleBlur}>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={handleOpen}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label="Add new item"
          >
            <Plus className="size-4" />
            <span>{placeholder}</span>
          </motion.button>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-2 rounded-md border border-border bg-card p-2 shadow-sm"
          >
            {/* Type selector */}
            <div className="flex items-center gap-1">
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
            </div>

            {/* Input */}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind?"
                className={cn(
                  "flex-1 bg-transparent text-sm outline-none",
                  "placeholder:text-muted-foreground"
                )}
                aria-label="New item content"
              />
              <Button
                size="xs"
                variant="ghost"
                onClick={handleClose}
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                size="xs"
                onClick={handleSubmit}
                disabled={!content.trim()}
                aria-label="Add item"
              >
                Add
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

