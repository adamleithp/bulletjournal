import { Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getDateOptions, formatDisplayDate, isToday } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type DatePickerDropdownProps = {
  value: string;
  onChange: (date: string) => void;
  size?: "xs" | "icon-xs";
};

export const DatePickerDropdown = ({
  value,
  onChange,
  size = "xs",
}: DatePickerDropdownProps) => {
  const dateOptions = getDateOptions();
  const isNotToday = !isToday(value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          size === "xs" && "h-7 px-2 py-1",
          size === "icon-xs" && "size-6",
          isNotToday
            ? "border border-primary/50 bg-background text-primary hover:bg-accent hover:text-accent-foreground"
            : "hover:bg-accent hover:text-accent-foreground"
        )}
        aria-label="Select date"
      >
        <Calendar className={cn(size === "xs" ? "size-3.5" : "size-3")} />
        {size === "xs" && (
          <span className="ml-1">{formatDisplayDate(value)}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-48 overflow-auto">
        {dateOptions.map(({ value: dateValue, label }) => (
          <DropdownMenuItem
            key={dateValue}
            onClick={() => onChange(dateValue)}
            className={cn(value === dateValue && "bg-primary/10 text-primary")}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

