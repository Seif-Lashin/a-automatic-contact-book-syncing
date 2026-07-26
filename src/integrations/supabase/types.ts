export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      gift_meals: {
        Row: {
          amount: number
          created_at: string
          id: string
          message: string | null
          recipient_id: string
          sender_id: string
          session_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          message?: string | null
          recipient_id: string
          sender_id: string
          session_id: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          message?: string | null
          recipient_id?: string
          sender_id?: string
          session_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "gift_meals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          created_at: string
          id: string
          points: number
          redeemed_points: number
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          redeemed_points?: number
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          redeemed_points?: number
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          category_id: string | null
          created_at: string
          description: string | null
          dietary_tags: string[] | null
          id: string
          image_url: string | null
          is_available: boolean
          is_best_seller: boolean
          is_hot: boolean
          name: string
          popularity_score: number
          preparation_time_minutes: number
          price: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_best_seller?: boolean
          is_hot?: boolean
          name: string
          popularity_score?: number
          preparation_time_minutes?: number
          price: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_best_seller?: boolean
          is_hot?: boolean
          name?: string
          popularity_score?: number
          preparation_time_minutes?: number
          price?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          claimed_by: string | null
          created_at: string
          id: string
          menu_item_id: string | null
          order_id: string
          paid_by: string | null
          quantity: number
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string
          id?: string
          menu_item_id?: string | null
          order_id: string
          paid_by?: string | null
          quantity: number
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          unit_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          claimed_by?: string | null
          created_at?: string
          id?: string
          menu_item_id?: string | null
          order_id?: string
          paid_by?: string | null
          quantity?: number
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          confirmed_at: string | null
          created_at: string
          id: string
          service_charge_amount: number
          session_id: string
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          service_charge_amount?: number
          session_id: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          service_charge_amount?: number
          session_id?: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_items: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_item_id: string
          payment_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_item_id: string
          payment_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_item_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          charity_roundup: number
          created_at: string
          external_reference: string | null
          id: string
          idempotency_key: string | null
          method: Database["public"]["Enums"]["payment_method"]
          session_id: string
          status: Database["public"]["Enums"]["payment_status"]
          tip_amount: number
          updated_at: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          charity_roundup?: number
          created_at?: string
          external_reference?: string | null
          id?: string
          idempotency_key?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          session_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          tip_amount?: number
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          charity_roundup?: number
          created_at?: string
          external_reference?: string | null
          id?: string
          idempotency_key?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          session_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tip_amount?: number
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: string[] | null
          avatar_url: string | null
          created_at: string
          dietary_preferences: string[] | null
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          avatar_url?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          avatar_url?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          latitude: number
          logo_url: string | null
          longitude: number
          name: string
          proximity_radius_meters: number
          service_charge_rate: number
          settings: Json | null
          tax_rate: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          latitude: number
          logo_url?: string | null
          longitude: number
          name: string
          proximity_radius_meters?: number
          service_charge_rate?: number
          settings?: Json | null
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          latitude?: number
          logo_url?: string | null
          longitude?: number
          name?: string
          proximity_radius_meters?: number
          service_charge_rate?: number
          settings?: Json | null
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean
          menu_item_id: string
          order_id: string | null
          points_awarded: number
          rating: number
          text: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean
          menu_item_id: string
          order_id?: string | null
          points_awarded?: number
          rating: number
          text?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean
          menu_item_id?: string
          order_id?: string | null
          points_awarded?: number
          rating?: number
          text?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "saved_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_groups: {
        Row: {
          created_at: string
          default_split_mode: Database["public"]["Enums"]["split_mode"]
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_split_mode?: Database["public"]["Enums"]["split_mode"]
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_split_mode?: Database["public"]["Enums"]["split_mode"]
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_participants: {
        Row: {
          id: string
          is_host: boolean
          joined_at: string
          left_at: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_host?: boolean
          joined_at?: string
          left_at?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_host?: boolean
          joined_at?: string
          left_at?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_sessions: {
        Row: {
          closed_at: string | null
          created_at: string
          currency: string
          id: string
          restaurant_id: string
          service_charge_rate: number
          split_mode: Database["public"]["Enums"]["split_mode"]
          started_at: string
          status: Database["public"]["Enums"]["session_status"]
          table_id: string
          tax_rate: number
          total_due: number
          total_paid: number
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          restaurant_id: string
          service_charge_rate?: number
          split_mode?: Database["public"]["Enums"]["split_mode"]
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          table_id: string
          tax_rate?: number
          total_due?: number
          total_paid?: number
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          restaurant_id?: string
          service_charge_rate?: number
          split_mode?: Database["public"]["Enums"]["split_mode"]
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          table_id?: string
          tax_rate?: number
          total_due?: number
          total_paid?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          qr_code_payload: string
          restaurant_id: string
          table_number: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          qr_code_payload: string
          restaurant_id: string
          table_number: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          qr_code_payload?: string
          restaurant_id?: string
          table_number?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          payout_settings: Json | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          payout_settings?: Json | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          payout_settings?: Json | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_history: {
        Row: {
          id: string
          restaurant_id: string
          session_id: string | null
          user_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          session_id?: string | null
          user_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          session_id?: string | null
          user_id?: string
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_history_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      waiter_calls: {
        Row: {
          created_at: string
          id: string
          is_resolved: boolean
          reason: string | null
          resolved_at: string | null
          session_id: string
          table_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          reason?: string | null
          resolved_at?: string | null
          session_id: string
          table_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          reason?: string | null
          resolved_at?: string | null
          session_id?: string
          table_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waiter_calls_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiter_calls_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "vendor" | "waiter" | "kds" | "customer"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "served"
        | "cancelled"
        | "paid"
      payment_method:
        | "card"
        | "apple_pay"
        | "instapay"
        | "vodafone_cash"
        | "paymob"
      payment_status: "pending" | "succeeded" | "failed"
      session_status: "active" | "ordering" | "closed" | "paid"
      split_mode: "itemized" | "equal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "owner", "vendor", "waiter", "kds", "customer"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "cancelled",
        "paid",
      ],
      payment_method: [
        "card",
        "apple_pay",
        "instapay",
        "vodafone_cash",
        "paymob",
      ],
      payment_status: ["pending", "succeeded", "failed"],
      session_status: ["active", "ordering", "closed", "paid"],
      split_mode: ["itemized", "equal"],
    },
  },
} as const
