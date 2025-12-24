import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "motion/react";
import { useLocalBulletItems } from "@/hooks/use-local-bullet-items";
import { useLayoutMode, useLocalStorage, type LayoutMode } from "@/hooks/use-local-storage";
import { getDateCategory, type DateCategory, getToday, getTomorrow, wasCreatedToday, isToday } from "@/lib/date-utils";
import type { BulletItem as BulletItemType } from "@/lib/database.types";
import { BulletColumn } from "./bullet-column";
import { BulletItem } from "./bullet-item";
import { LayoutToggle } from "./layout-toggle";
import { SingleViewTabs } from "./single-view-tabs";

export const BulletJournalView = () => {
  const [layoutMode, setLayoutMode] = useLayoutMode();
  const [activeTab, setActiveTab] = useState<DateCategory>("today");
  const [activeItem, setActiveItem] = useState<BulletItemType | null>(null);
  const [showOnlyTodayItems, setShowOnlyTodayItems] = useLocalStorage("bullet-journal-today-filter", false);

  // Using local storage for now. Switch to useBulletItems when Supabase is configured:
  // import { useBulletItems } from "@/hooks/use-bullet-items";
  const {
    items,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    toggleComplete,
    moveItem,
    reorderItems,
    migrateOldItems,
    getItemsByCategory,
  } = useLocalBulletItems();

  // Migrate old items on mount
  useEffect(() => {
    if (!isLoading && items.length > 0) {
      migrateOldItems();
    }
  }, [isLoading, items.length, migrateOldItems]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get items for each category with special filtering for "today"
  const todayItems = useMemo(() => {
    if (showOnlyTodayItems) {
      // Only show items where date is actually today
      return items
        .filter((item) => isToday(item.date))
        .sort((a, b) => a.order_index - b.order_index);
    }
    // Show items where date is today OR created today (even if target date is future)
    return items
      .filter((item) => isToday(item.date) || wasCreatedToday(item.created_at))
      .sort((a, b) => a.order_index - b.order_index);
  }, [items, showOnlyTodayItems]);

  const tomorrowItems = getItemsByCategory("tomorrow");
  const futureItems = getItemsByCategory("future");

  const itemCounts: Record<DateCategory, number> = {
    today: todayItems.length,
    tomorrow: tomorrowItems.length,
    future: futureItems.length,
  };

  // Get date for a category
  const getDateForCategory = useCallback((category: DateCategory): string => {
    if (category === "today") return getToday();
    if (category === "tomorrow") return getTomorrow();
    const future = new Date();
    future.setDate(future.getDate() + 2);
    return future.toISOString().split("T")[0];
  }, []);

  // DnD handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const item = items.find((i) => i.id === active.id);
      setActiveItem(item ?? null);
    },
    [items]
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback is handled by the droppable component
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Check if dropped on a category (column)
      if (overId === "today" || overId === "tomorrow" || overId === "future") {
        const item = items.find((i) => i.id === activeId);
        if (item && getDateCategory(item.date) !== overId) {
          const newDate = getDateForCategory(overId as DateCategory);
          await moveItem(activeId, newDate);
        }
        return;
      }

      // Check if reordering within same category
      const activeItemData = items.find((i) => i.id === activeId);
      const overItem = items.find((i) => i.id === overId);

      if (!activeItemData || !overItem) return;

      const activeCategory = getDateCategory(activeItemData.date);
      const overCategory = getDateCategory(overItem.date);

      if (activeCategory === overCategory) {
        // Reorder within same category
        const categoryItems = getItemsByCategory(activeCategory);
        const activeIndex = categoryItems.findIndex((i) => i.id === activeId);
        const overIndex = categoryItems.findIndex((i) => i.id === overId);

        if (activeIndex !== overIndex) {
          const newOrder = [...categoryItems];
          const [removed] = newOrder.splice(activeIndex, 1);
          newOrder.splice(overIndex, 0, removed);
          await reorderItems(newOrder.map((i) => i.id), activeCategory);
        }
      } else {
        // Move to different category
        const newDate = getDateForCategory(overCategory);
        await moveItem(activeId, newDate);
      }
    },
    [items, getDateForCategory, moveItem, getItemsByCategory, reorderItems]
  );

  const handleLayoutModeChange = useCallback(
    (mode: LayoutMode) => {
      setLayoutMode(mode);
    },
    [setLayoutMode]
  );

  const handleToggleTodayFilter = useCallback(() => {
    setShowOnlyTodayItems((prev) => !prev);
  }, [setShowOnlyTodayItems]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="size-8 rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-2">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold tracking-tight"
        >
          Bullet Journal
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <LayoutToggle mode={layoutMode} onModeChange={handleLayoutModeChange} />
        </motion.div>
      </header>

      {/* Single view tabs */}
      {layoutMode === "single" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <SingleViewTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            itemCounts={itemCounts}
          />
        </motion.div>
      )}

      {/* Content */}
      <div className="flex grow overflow-hidden">
        <AnimatePresence mode="wait">
          {layoutMode === "single" ? (
            <motion.div
              key={`single-${activeTab}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <BulletColumn
                title={activeTab === "today" ? "Today" : activeTab === "tomorrow" ? "Tomorrow" : "Future"}
                category={activeTab}
                items={
                  activeTab === "today"
                    ? todayItems
                    : activeTab === "tomorrow"
                      ? tomorrowItems
                      : futureItems
                }
                onUpdate={updateItem}
                onDelete={deleteItem}
                onToggleComplete={toggleComplete}
                onCreate={createItem}
                isActive
                isSingleView
                showOnlyTargetDate={showOnlyTodayItems}
                onToggleFilter={activeTab === "today" ? handleToggleTodayFilter : undefined}
              />
            </motion.div>
          ) : (
            <motion.div
              key="multiple"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex grow gap-4 overflow-x-auto"
            >
              <BulletColumn
                title="Today"
                category="today"
                items={todayItems}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onToggleComplete={toggleComplete}
                onCreate={createItem}
                showOnlyTargetDate={showOnlyTodayItems}
                onToggleFilter={handleToggleTodayFilter}
              />
              <BulletColumn
                title="Tomorrow"
                category="tomorrow"
                items={tomorrowItems}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onToggleComplete={toggleComplete}
                onCreate={createItem}
              />
              <BulletColumn
                title="Future"
                category="future"
                items={futureItems}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onToggleComplete={toggleComplete}
                onCreate={createItem}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem && (
          <div className="bg-card shadow-lg rounded-lg">
            <BulletItem
              item={activeItem}
              onUpdate={updateItem}
              onDelete={deleteItem}
              onToggleComplete={toggleComplete}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
