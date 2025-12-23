import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { BulletType } from "@/lib/database.types";
import { BulletItemForm } from "./bullet-item-form";

type NewBulletInputProps = {
  onCreate: (content: string, type: BulletType, date: string) => Promise<void>;
  placeholder?: string;
  defaultDate?: string;
};

export const NewBulletInput = ({
  onCreate,
  placeholder = "Add new item...",
  defaultDate,
}: NewBulletInputProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleCreate = useCallback(
    async (content: string, type: BulletType, date: string) => {
      await onCreate(content, type, date);
      // Form stays open for adding more items
    },
    [onCreate]
  );

  return (
    <div className="mt-2">
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
          <BulletItemForm
            key="form"
            defaultDate={defaultDate}
            onCreate={handleCreate}
            onCancel={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
