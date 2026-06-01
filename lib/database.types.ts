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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          free_limit: number | null
          icon: string | null
          id: string
          label: string
          listing_price: number | null
          monetization_plan_id: string | null
          package_price: number | null
          package_size: number | null
        }
        Insert: {
          free_limit?: number | null
          icon?: string | null
          id: string
          label: string
          listing_price?: number | null
          monetization_plan_id?: string | null
          package_price?: number | null
          package_size?: number | null
        }
        Update: {
          free_limit?: number | null
          icon?: string | null
          id?: string
          label?: string
          listing_price?: number | null
          monetization_plan_id?: string | null
          package_price?: number | null
          package_size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_monetization_plan_id_fkey"
            columns: ["monetization_plan_id"]
            isOneToOne: false
            referencedRelation: "monetization_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          listing_id: string | null
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          listing_id?: string | null
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          listing_id?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          content: string
          id: string
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          id?: string
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_types: {
        Row: {
          id: number
          label: string
          sub_category_id: number
        }
        Insert: {
          id?: number
          label: string
          sub_category_id: number
        }
        Update: {
          id?: number
          label?: string
          sub_category_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_types_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          ad_type: string | null
          address: string | null
          attributes: Json | null
          boost_expires_at: string | null
          boost_plan: string | null
          category_id: string | null
          chats_count: number | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          for_sale_by: string | null
          hide_phone_on_ad: boolean | null
          id: string
          images: string[] | null
          impressions_count: number | null
          item_condition: string | null
          latitude: number | null
          listing_type_id: number | null
          longitude: number | null
          postal_code: string | null
          price: number | null
          price_type: string | null
          province_code: string | null
          status: string | null
          sub_category_id: number | null
          sub_category_label: string | null
          sub_item_label: string | null
          tags: string[] | null
          title: string
          user_id: string | null
          views_count: number | null
          website_url: string | null
          youtube_video_url: string | null
          slug: string | null
        }
        Insert: {
          ad_type?: string | null
          address?: string | null
          attributes?: Json | null
          boost_expires_at?: string | null
          boost_plan?: string | null
          category_id?: string | null
          chats_count?: number | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          for_sale_by?: string | null
          hide_phone_on_ad?: boolean | null
          id?: string
          images?: string[] | null
          impressions_count?: number | null
          item_condition?: string | null
          latitude?: number | null
          listing_type_id?: number | null
          longitude?: number | null
          postal_code?: string | null
          price?: number | null
          price_type?: string | null
          province_code?: string | null
          status?: string | null
          sub_category_id?: number | null
          sub_category_label?: string | null
          sub_item_label?: string | null
          tags?: string[] | null
          title: string
          user_id?: string | null
          views_count?: number | null
          website_url?: string | null
          youtube_video_url?: string | null
          slug?: string | null
        }
        Update: {
          ad_type?: string | null
          address?: string | null
          attributes?: Json | null
          boost_expires_at?: string | null
          boost_plan?: string | null
          category_id?: string | null
          chats_count?: number | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          for_sale_by?: string | null
          hide_phone_on_ad?: boolean | null
          id?: string
          images?: string[] | null
          impressions_count?: number | null
          item_condition?: string | null
          latitude?: number | null
          listing_type_id?: number | null
          longitude?: number | null
          postal_code?: string | null
          price?: number | null
          price_type?: string | null
          province_code?: string | null
          status?: string | null
          sub_category_id?: number | null
          sub_category_label?: string | null
          sub_item_label?: string | null
          tags?: string[] | null
          title?: string
          user_id?: string | null
          views_count?: number | null
          website_url?: string | null
          youtube_video_url?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_listings_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_listing_type_id_fkey"
            columns: ["listing_type_id"]
            isOneToOne: false
            referencedRelation: "listing_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          type: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          type?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      monetization_plans: {
        Row: {
          created_at: string | null
          free_image_limit: number | null
          free_limit: number | null
          id: string
          listing_price: number | null
          name: string
          package_price: number | null
          package_size: number | null
          paid_image_limit: number | null
        }
        Insert: {
          created_at?: string | null
          free_image_limit?: number | null
          free_limit?: number | null
          id?: string
          listing_price?: number | null
          name: string
          package_price?: number | null
          package_size?: number | null
          paid_image_limit?: number | null
        }
        Update: {
          created_at?: string | null
          free_image_limit?: number | null
          free_limit?: number | null
          id?: string
          listing_price?: number | null
          name?: string
          package_price?: number | null
          package_size?: number | null
          paid_image_limit?: number | null
        }
        Relationships: []
      }
      listing_ledger: {
        Row: {
          amount_paid: number | null
          category_id: string | null
          consumption_type: string
          created_at: string | null
          credits_used: number | null
          description: string | null
          id: string
          listing_id: string | null
          sub_category_id: number | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          category_id?: string | null
          consumption_type: string
          created_at?: string | null
          credits_used?: number | null
          description?: string | null
          id?: string
          listing_id?: string | null
          sub_category_id?: number | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          category_id?: string | null
          consumption_type?: string
          created_at?: string | null
          credits_used?: number | null
          description?: string | null
          id?: string
          listing_id?: string | null
          sub_category_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_ledger_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_ledger_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_ledger_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          category_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          remaining_credits: number
          sub_category_id: number | null
          total_purchased: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          remaining_credits?: number
          sub_category_id?: number | null
          total_purchased?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          remaining_credits?: number
          sub_category_id?: number | null
          total_purchased?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_credits_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          listing_id: string | null
          payment_method: string | null
          plan_type: string | null
          status: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          listing_id?: string | null
          payment_method?: string | null
          plan_type?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          listing_id?: string | null
          payment_method?: string | null
          plan_type?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_plans: {
        Row: {
          created_at: string | null
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          is_recommended: boolean | null
          label: string
          price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_days: number
          id: string
          is_active?: boolean | null
          is_recommended?: boolean | null
          label: string
          price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          is_recommended?: boolean | null
          label?: string
          price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          is_blocked: boolean | null
          block_features: Json | null
          is_verified: boolean | null
          last_login_at: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          block_features?: Json | null
          is_verified?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          block_features?: Json | null
          is_verified?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_us: string | null
          contact_email: string | null
          contact_phone: string | null
          hero_description: string | null
          home_banner_url: string | null
          id: number
          is_pricing_enabled: boolean | null
          is_hst_enabled: boolean | null
          social_links: Json | null
          updated_at: string | null
          website_fee: number | null
          global_free_limit: number | null
          global_free_image_limit: number | null
        }
        Insert: {
          about_us?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          hero_description?: string | null
          home_banner_url?: string | null
          id: number
          is_pricing_enabled?: boolean | null
          is_hst_enabled?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
          website_fee?: number | null
          global_free_limit?: number | null
          global_free_image_limit?: number | null
        }
        Update: {
          about_us?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          hero_description?: string | null
          home_banner_url?: string | null
          id?: number
          is_pricing_enabled?: boolean | null
          is_hst_enabled?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
          website_fee?: number | null
          global_free_limit?: number | null
          global_free_image_limit?: number | null
        }
        Relationships: []
      }
      site_stats: {
        Row: {
          id: number
          total_listings: number | null
          total_revenue: number | null
          total_transactions: number | null
          total_users: number | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          total_listings?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          total_listings?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sub_categories: {
        Row: {
          category_id: string
          free_limit: number | null
          id: number
          label: string
          listing_price: number | null
          monetization_plan_id: string | null
          package_price: number | null
          package_size: number | null
        }
        Insert: {
          category_id: string
          free_limit?: number | null
          id?: number
          label: string
          listing_price?: number | null
          monetization_plan_id?: string | null
          package_price?: number | null
          package_size?: number | null
        }
        Update: {
          category_id?: string
          free_limit?: number | null
          id?: number
          label?: string
          listing_price?: number | null
          monetization_plan_id?: string | null
          package_price?: number | null
          package_size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_categories_monetization_plan_id_fkey"
            columns: ["monetization_plan_id"]
            isOneToOne: false
            referencedRelation: "monetization_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          permissions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_consume_listing_slot: {
        Args: {
          p_user_id: string
          p_category_id: string
          p_sub_category_id: number | null
          p_listing_id: string
        }
        Returns: Json
      }
      increment_chats: { Args: { listing_id: string }; Returns: undefined }
      increment_impressions: {
        Args: { listing_ids: string[] }
        Returns: undefined
      }
      increment_views: { Args: { listing_id: string }; Returns: undefined }
      search_users: {
        Args: {
          filter_status?: string
          filter_type?: string
          items_per_page?: number
          page_number?: number
          search_term?: string
        }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          block_features: Json | null
          is_paid: boolean
          last_sign_in_at: string
          phone: string
          auth_provider: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
