import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { BulletItem, BulletItemUpdate, BulletType } from "@/lib/database.types";
import { getToday, isPast, getDateCategory, type DateCategory } from "@/lib/date-utils";

const STORAGE_KEY = "bullet-journal-items";

const getStoredItems = (): BulletItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveItems = (items: BulletItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

type UseLocalBulletItemsReturn = {
  items: BulletItem[];
  isLoading: boolean;
  error: string | null;
  createItem: (content: string, type: BulletType, date: string) => Promise<BulletItem | null>;
  updateItem: (id: string, updates: BulletItemUpdate) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  moveItem: (id: string, newDate: string) => Promise<void>;
  reorderItems: (itemIds: string[], category: DateCategory) => Promise<void>;
  migrateOldItems: () => Promise<void>;
  getItemsByCategory: (category: DateCategory) => BulletItem[];
};

export const useLocalBulletItems = (): UseLocalBulletItemsReturn => {
  const [items, setItems] = useState<BulletItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = getStoredItems();
    setItems(stored);
    setIsLoading(false);
  }, []);

  // Save items whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveItems(items);
    }
  }, [items, isLoading]);

  // Create a new item
  const createItem = useCallback(
    async (content: string, type: BulletType, date: string): Promise<BulletItem | null> => {
      const maxOrder = items
        .filter((i) => getDateCategory(i.date) === getDateCategory(date))
        .reduce((max, i) => Math.max(max, i.order_index), -1);

      const newItem: BulletItem = {
        id: uuidv4(),
        user_id: "local",
        type,
        content,
        completed: false,
        date,
        original_date: null,
        migrated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_index: maxOrder + 1,
      };

      setItems((prev) => [...prev, newItem]);
      return newItem;
    },
    [items]
  );

  // Update an item
  const updateItem = useCallback(
    async (id: string, updates: BulletItemUpdate): Promise<void> => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...updates, updated_at: new Date().toISOString() }
            : item
        )
      );
    },
    []
  );

  // Delete an item
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Toggle completion status
  const toggleComplete = useCallback(
    async (id: string): Promise<void> => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, completed: !item.completed, updated_at: new Date().toISOString() }
            : item
        )
      );
    },
    []
  );

  // Move an item to a new date
  const moveItem = useCallback(
    async (id: string, newDate: string): Promise<void> => {
      const targetCategory = getDateCategory(newDate);
      const maxOrder = items
        .filter((i) => getDateCategory(i.date) === targetCategory && i.id !== id)
        .reduce((max, i) => Math.max(max, i.order_index), -1);

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                date: newDate,
                order_index: maxOrder + 1,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
    },
    [items]
  );

  // Reorder items within a category
  const reorderItems = useCallback(
    async (itemIds: string[], _category: DateCategory): Promise<void> => {
      setItems((prev) => {
        const updated = [...prev];
        itemIds.forEach((id, index) => {
          const itemIndex = updated.findIndex((i) => i.id === id);
          if (itemIndex !== -1) {
            updated[itemIndex] = { ...updated[itemIndex], order_index: index };
          }
        });
        return updated;
      });
    },
    []
  );

  // Migrate old incomplete tasks to today
  const migrateOldItems = useCallback(async (): Promise<void> => {
    const today = getToday();
    setItems((prev) =>
      prev.map((item) => {
        if (item.type === "task" && !item.completed && isPast(item.date) && item.date !== today) {
          return {
            ...item,
            date: today,
            original_date: item.original_date ?? item.date,
            migrated: true,
            updated_at: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  // Get items by category
  const getItemsByCategory = useCallback(
    (category: DateCategory): BulletItem[] => {
      return items
        .filter((item) => getDateCategory(item.date) === category)
        .sort((a, b) => a.order_index - b.order_index);
    },
    [items]
  );

  return {
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
  };
};

