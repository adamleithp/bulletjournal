import { BulletItem } from "@/lib/database.types"
import { BulletIcon } from "./bullet-icon"
import { useCallback } from "react"

export const BulletIconForm = ({
    item,
    onToggleComplete,
}: {
    item: Pick<BulletItem, "type" | "completed" | "migrated" | "id">
    onToggleComplete: (id: string) => Promise<void>
}) => {
    const canComplete = item.type === "task" || item.type === "event";

    const handleToggleComplete = useCallback(
        async (e: React.MouseEvent) => {
          e.stopPropagation();
          if (item.type === "task" || item.type === "event") {
            await onToggleComplete(item.id);
          }
        },
        [item.id, item.type, onToggleComplete]
      );
      
  return (
    <button
        className="bullet-icon-form mt-1 shrink-0 rounded"
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
      </button>
  )
}