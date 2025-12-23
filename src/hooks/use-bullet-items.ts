import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { BulletItem, BulletItemInsert, BulletItemUpdate, BulletType } from "@/lib/database.types";
import { getToday, isPast, getDateCategory, type DateCategory } from "@/lib/date-utils";

type UseBulletItemsReturn = {
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

export const useBulletItems = (): UseBulletItemsReturn => {
  const [items, setItems] = useState<BulletItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabase();

  // Fetch all items
  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("bullet_items")
        .select("*")
        .order("order_index", { ascending: true });

      if (fetchError) throw fetchError;
      setItems(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch items");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Initial fetch and set up realtime subscription
  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("bullet_items_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bullet_items" },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems, supabase]);

  // Create a new item
  const createItem = useCallback(
    async (content: string, type: BulletType, date: string): Promise<BulletItem | null> => {
      try {
        const maxOrder = items
          .filter((i) => getDateCategory(i.date) === getDateCategory(date))
          .reduce((max, i) => Math.max(max, i.order_index), -1);

        const newItem: BulletItemInsert = {
          user_id: "anonymous", // Will be replaced with actual user ID after auth
          type,
          content,
          completed: false,
          date,
          original_date: null,
          migrated: false,
          order_index: maxOrder + 1,
        };

        const { data, error: insertError } = await supabase
          .from("bullet_items")
          .insert(newItem)
          .select()
          .single();

        if (insertError) throw insertError;
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create item");
        return null;
      }
    },
    [items, supabase]
  );

  // Update an item
  const updateItem = useCallback(
    async (id: string, updates: BulletItemUpdate): Promise<void> => {
      try {
        const { error: updateError } = await supabase
          .from("bullet_items")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (updateError) throw updateError;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update item");
      }
    },
    [supabase]
  );

  // Delete an item
  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      try {
        const { error: deleteError } = await supabase
          .from("bullet_items")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete item");
      }
    },
    [supabase]
  );

  // Toggle completion status
  const toggleComplete = useCallback(
    async (id: string): Promise<void> => {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      await updateItem(id, { completed: !item.completed });
    },
    [items, updateItem]
  );

  // Move an item to a new date
  const moveItem = useCallback(
    async (id: string, newDate: string): Promise<void> => {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      const targetCategory = getDateCategory(newDate);
      const maxOrder = items
        .filter((i) => getDateCategory(i.date) === targetCategory && i.id !== id)
        .reduce((max, i) => Math.max(max, i.order_index), -1);

      await updateItem(id, { date: newDate, order_index: maxOrder + 1 });
    },
    [items, updateItem]
  );

  // Reorder items within a category
  const reorderItems = useCallback(
    async (itemIds: string[], _category: DateCategory): Promise<void> => {
      try {
        const updates = itemIds.map((id, index) => ({
          id,
          order_index: index,
        }));

        for (const update of updates) {
          await supabase
            .from("bullet_items")
            .update({ order_index: update.order_index })
            .eq("id", update.id);
        }

        await fetchItems();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reorder items");
      }
    },
    [fetchItems, supabase]
  );

  // Migrate old incomplete tasks to today
  const migrateOldItems = useCallback(async (): Promise<void> => {
    const today = getToday();
    const itemsToMigrate = items.filter(
      (item) =>
        item.type === "task" &&
        !item.completed &&
        isPast(item.date) &&
        item.date !== today
    );

    for (const item of itemsToMigrate) {
      await updateItem(item.id, {
        date: today,
        original_date: item.original_date ?? item.date,
        migrated: true,
      });
    }
  }, [items, updateItem]);

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

