import { Columns3, Square } from "lucide-react";
import { motion } from "motion/react";
import type { LayoutMode } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

type LayoutToggleProps = {
  mode: LayoutMode;
  onModeChange: (mode: LayoutMode) => void;
};

export const LayoutToggle = ({ mode, onModeChange }: LayoutToggleProps) => {
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 p-1">
      <button
        type="button"
        onClick={() => onModeChange("single")}
        className={cn(
          "relative flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors",
          mode === "single" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Single column view"
        aria-pressed={mode === "single"}
      >
        {mode === "single" && (
          <motion.div
            layoutId="layout-toggle-bg"
            className="absolute inset-0 rounded bg-background shadow-sm"
            transition={{ type: "spring", duration: 0.3 }}
          />
        )}
        <Square className="relative z-10 size-4" />
        <span className="relative z-10 hidden sm:inline">Single</span>
      </button>

      <button
        type="button"
        onClick={() => onModeChange("multiple")}
        className={cn(
          "relative flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors",
          mode === "multiple" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Multiple column view"
        aria-pressed={mode === "multiple"}
      >
        {mode === "multiple" && (
          <motion.div
            layoutId="layout-toggle-bg"
            className="absolute inset-0 rounded bg-background shadow-sm"
            transition={{ type: "spring", duration: 0.3 }}
          />
        )}
        <Columns3 className="relative z-10 size-4" />
        <span className="relative z-10 hidden sm:inline">Columns</span>
      </button>
    </div>
  );
};

