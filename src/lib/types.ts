import type { Database } from "@/integrations/supabase/types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type MenuItemWithVendor = Tables<"menu_items"> & {
  vendor: Tables<"vendors"> | null;
  category: Tables<"menu_categories"> | null;
};

export type OrderWithItems = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
  vendor: Tables<"vendors"> | null;
};

export type SessionWithRestaurant = Tables<"table_sessions"> & {
  restaurant: Tables<"restaurants">;
  table: Tables<"tables">;
  participants: {
    user_id: string;
    is_host: boolean;
    joined_at: string;
    profile: Tables<"profiles"> | null;
  }[];
};

export type SplitMode = "itemized" | "equal";

export type CartItem = {
  menu_item_id: string;
  vendor_id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions: string;
};
