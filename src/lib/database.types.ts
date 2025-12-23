export type BulletType = "task" | "note" | "event";

export type BulletItem = {
  id: string;
  user_id: string;
  type: BulletType;
  content: string;
  completed: boolean;
  date: string; // ISO date string (YYYY-MM-DD)
  original_date: string | null; // Original date if migrated
  migrated: boolean; // Whether this item was migrated from a previous day
  created_at: string;
  updated_at: string;
  order_index: number;
};

export type BulletItemInsert = Omit<
  BulletItem,
  "id" | "created_at" | "updated_at"
>;
export type BulletItemUpdate = Partial<
  Omit<BulletItem, "id" | "user_id" | "created_at">
>;

export type Database = {
  public: {
    Tables: {
      bullet_items: {
        Row: BulletItem;
        Insert: BulletItemInsert & { id?: string };
        Update: BulletItemUpdate;
      };
    };
  };
};

