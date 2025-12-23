import type { BulletType } from "@/lib/database.types";
import { cn } from "@/lib/utils";

type BulletIconProps = {
  type: BulletType;
  completed?: boolean;
  migrated?: boolean;
  className?: string;
  onClick?: () => void;
};

export const BulletIcon = ({
  type,
  completed = false,
  migrated = false,
  className,
  onClick,
}: BulletIconProps) => {
  const baseClasses = cn(
    "size-4 shrink-0 transition-all duration-200",
    onClick && "cursor-pointer hover:scale-110",
    className
  );

  // Task: Square (hollow when incomplete, filled when complete)
  if (type === "task") {
    return (
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 16 16"
          className={baseClasses}
          onClick={onClick}
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          aria-label={completed ? "Completed task" : "Incomplete task"}
          onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        >
          <rect
            x="2"
            y="2"
            width="12"
            height="12"
            rx="2"
            className={cn(
              "transition-all duration-200",
              completed
                ? "fill-primary stroke-primary"
                : "fill-none stroke-foreground/60"
            )}
            strokeWidth="1.5"
          />
          {completed && (
            <path
              d="M5 8L7 10L11 6"
              className="stroke-primary-foreground"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </svg>
        {migrated && (
          <svg
            viewBox="0 0 16 16"
            className="absolute -left-2.5 size-3 text-muted-foreground"
            aria-label="Migrated from previous day"
          >
            <path
              d="M3 8L8 4V7H13V9H8V12L3 8Z"
              className="fill-current"
            />
          </svg>
        )}
      </div>
    );
  }

  // Note: Dot
  if (type === "note") {
    return (
      <div className="mt-px">
        <svg viewBox="0 0 16 16" className={baseClasses}>
          <circle cx="8" cy="8" r="3" className="fill-foreground/70" />
        </svg>
      </div>
    );
  }

  // Event: Circle (hollow when incomplete, filled when complete)
  if (type === "event") {
    return (
      <svg
        viewBox="0 0 16 16"
        className={baseClasses}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={completed ? "Completed event" : "Incomplete event"}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          className={cn(
            "transition-all duration-200",
            completed
              ? "fill-primary stroke-primary"
              : "fill-none stroke-foreground/60"
          )}
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return null;
};

