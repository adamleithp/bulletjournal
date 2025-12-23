import { motion } from "motion/react";
import type { DateCategory } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type SingleViewTabsProps = {
  activeTab: DateCategory;
  onTabChange: (tab: DateCategory) => void;
  itemCounts: Record<DateCategory, number>;
};

const tabs: { key: DateCategory; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "future", label: "Future" },
];

export const SingleViewTabs = ({
  activeTab,
  onTabChange,
  itemCounts,
}: SingleViewTabsProps) => {
  return (
    <div className="flex items-center justify-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onTabChange(key)}
          className={cn(
            "relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === key
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={`View ${label}`}
          aria-selected={activeTab === key}
          role="tab"
        >
          {activeTab === key && (
            <motion.div
              layoutId="single-view-tab-bg"
              className="absolute inset-0 rounded-md bg-background shadow-sm"
              transition={{ type: "spring", duration: 0.3 }}
            />
          )}
          <span className="relative z-10">{label}</span>
          {itemCounts[key] > 0 && (
            <span
              className={cn(
                "relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs",
                activeTab === key
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {itemCounts[key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

