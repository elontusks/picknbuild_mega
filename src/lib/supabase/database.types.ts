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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      authz_denials: {
        Row: {
          capability: string
          created_at: string
          id: number
          principal_id: string | null
          reason: string
          request_path: string | null
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          capability: string
          created_at?: string
          id?: number
          principal_id?: string | null
          reason: string
          request_path?: string | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          capability?: string
          created_at?: string
          id?: number
          principal_id?: string | null
          reason?: string
          request_path?: string | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authz_denials_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_pages: {
        Row: {
          claimed: boolean
          created_at: string
          id: string
          name: string | null
          owner_id: string | null
          subscription_active: boolean
          updated_at: string
        }
        Insert: {
          claimed?: boolean
          created_at?: string
          id?: string
          name?: string | null
          owner_id?: string | null
          subscription_active?: boolean
          updated_at?: string
        }
        Update: {
          claimed?: boolean
          created_at?: string
          id?: string
          name?: string | null
          owner_id?: string | null
          subscription_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_pages_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_action_events: {
        Row: {
          action: Database["public"]["Enums"]["garage_action_kind"]
          created_at: string
          id: number
          item_id: number
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["garage_action_kind"]
          created_at?: string
          id?: number
          item_id: number
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["garage_action_kind"]
          created_at?: string
          id?: number
          item_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_action_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "garage_items"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_groups: {
        Row: {
          best_fit_item_id: number | null
          best_total_item_id: number | null
          created_at: string
          description: string | null
          fastest_item_id: number | null
          id: number
          inputs_hash: string | null
          is_default: boolean
          last_computed_at: string | null
          lowest_monthly_item_id: number | null
          lowest_risk_item_id: number | null
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_fit_item_id?: number | null
          best_total_item_id?: number | null
          created_at?: string
          description?: string | null
          fastest_item_id?: number | null
          id?: number
          inputs_hash?: string | null
          is_default?: boolean
          last_computed_at?: string | null
          lowest_monthly_item_id?: number | null
          lowest_risk_item_id?: number | null
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_fit_item_id?: number | null
          best_total_item_id?: number | null
          created_at?: string
          description?: string | null
          fastest_item_id?: number | null
          id?: number
          inputs_hash?: string | null
          is_default?: boolean
          last_computed_at?: string | null
          lowest_monthly_item_id?: number | null
          lowest_risk_item_id?: number | null
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_groups_best_fit_fk"
            columns: ["best_fit_item_id"]
            isOneToOne: false
            referencedRelation: "garage_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garage_groups_best_total_fk"
            columns: ["best_total_item_id"]
            isOneToOne: false
            referencedRelation: "garage_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garage_groups_fastest_fk"
            columns: ["fastest_item_id"]
            isOneToOne: false
            referencedRelation: "garage_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garage_groups_lowest_monthly_fk"
            columns: ["lowest_monthly_item_id"]
            isOneToOne: false
            referencedRelation: "garage_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garage_groups_lowest_risk_fk"
            columns: ["lowest_risk_item_id"]
            isOneToOne: false
            referencedRelation: "garage_items"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_items: {
        Row: {
          archived_at: string | null
          garage_group_id: number | null
          id: number
          last_viewed_at: string | null
          note: string | null
          saved_at: string
          saved_path: Database["public"]["Enums"]["vehicle_source_type"]
          user_id: string
          vehicle_id: number
        }
        Insert: {
          archived_at?: string | null
          garage_group_id?: number | null
          id?: number
          last_viewed_at?: string | null
          note?: string | null
          saved_at?: string
          saved_path: Database["public"]["Enums"]["vehicle_source_type"]
          user_id: string
          vehicle_id: number
        }
        Update: {
          archived_at?: string | null
          garage_group_id?: number | null
          id?: number
          last_viewed_at?: string | null
          note?: string | null
          saved_at?: string
          saved_path?: Database["public"]["Enums"]["vehicle_source_type"]
          user_id?: string
          vehicle_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "garage_items_garage_group_id_fkey"
            columns: ["garage_group_id"]
            isOneToOne: false
            referencedRelation: "garage_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garage_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_user_preferences: {
        Row: {
          available_cash: number | null
          buyer_zip: string | null
          created_at: string
          credit_score: number | null
          no_credit: boolean
          priorities: Json
          title_preference: Database["public"]["Enums"]["garage_title_preference"]
          updated_at: string
          user_id: string
        }
        Insert: {
          available_cash?: number | null
          buyer_zip?: string | null
          created_at?: string
          credit_score?: number | null
          no_credit?: boolean
          priorities?: Json
          title_preference?: Database["public"]["Enums"]["garage_title_preference"]
          updated_at?: string
          user_id: string
        }
        Update: {
          available_cash?: number | null
          buyer_zip?: string | null
          created_at?: string
          credit_score?: number | null
          no_credit?: boolean
          priorities?: Json
          title_preference?: Database["public"]["Enums"]["garage_title_preference"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          bin_price: number | null
          created_at: string
          current_bid: number | null
          estimated_market_value: number | null
          fees: number | null
          id: string
          last_refreshed_at: string
          location_zip: string | null
          make: string
          mileage: number | null
          model: string
          owner_user_id: string | null
          photos: string[]
          price: number | null
          source: string
          source_external_id: string | null
          source_updated_at: string
          source_url: string
          status: string
          title_status: string
          trim: string | null
          updated_at: string
          vin: string | null
          year: number
        }
        Insert: {
          bin_price?: number | null
          created_at?: string
          current_bid?: number | null
          estimated_market_value?: number | null
          fees?: number | null
          id?: string
          last_refreshed_at?: string
          location_zip?: string | null
          make: string
          mileage?: number | null
          model: string
          owner_user_id?: string | null
          photos?: string[]
          price?: number | null
          source: string
          source_external_id?: string | null
          source_updated_at?: string
          source_url: string
          status?: string
          title_status?: string
          trim?: string | null
          updated_at?: string
          vin?: string | null
          year: number
        }
        Update: {
          bin_price?: number | null
          created_at?: string
          current_bid?: number | null
          estimated_market_value?: number | null
          fees?: number | null
          id?: string
          last_refreshed_at?: string
          location_zip?: string | null
          make?: string
          mileage?: number | null
          model?: string
          owner_user_id?: string | null
          photos?: string[]
          price?: number | null
          source?: string
          source_external_id?: string | null
          source_updated_at?: string
          source_url?: string
          status?: string
          title_status?: string
          trim?: string | null
          updated_at?: string
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          budget: number | null
          created_at: string
          credit_score: number | null
          display_name: string | null
          email: string
          full_name: string | null
          id: string
          no_credit: boolean
          onboarded_at: string | null
          phone: string | null
          phone_verified_at: string | null
          preferences: Json
          roles: string[]
          updated_at: string
          zip: string | null
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          budget?: number | null
          created_at?: string
          credit_score?: number | null
          display_name?: string | null
          email: string
          full_name?: string | null
          id: string
          no_credit?: boolean
          onboarded_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          preferences?: Json
          roles?: string[]
          updated_at?: string
          zip?: string | null
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          budget?: number | null
          created_at?: string
          credit_score?: number | null
          display_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          no_credit?: boolean
          onboarded_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          preferences?: Json
          roles?: string[]
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      secure_records: {
        Row: {
          bucket: string
          created_at: string
          id: string
          updated_at: string
          value: Json
        }
        Insert: {
          bucket: string
          created_at?: string
          id: string
          updated_at?: string
          value: Json
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sponsor_blocks: {
        Row: {
          active: boolean
          body_html: string
          created_at: string
          cta_href: string | null
          cta_label: string | null
          id: string
          path: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body_html?: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id: string
          path: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body_html?: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          path?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          auction_end_time: string | null
          city: string
          created_at: string
          current_bid: number | null
          effort_level: Database["public"]["Enums"]["vehicle_effort_level"]
          id: number
          images: Json
          latitude: number | null
          longitude: number | null
          make: string
          mileage: number
          model: string
          price: number
          risk_level: Database["public"]["Enums"]["vehicle_risk_level"]
          source_type: Database["public"]["Enums"]["vehicle_source_type"]
          state: string
          status: Database["public"]["Enums"]["vehicle_status"]
          title_status: Database["public"]["Enums"]["vehicle_title_status"]
          trim: string | null
          updated_at: string
          year: number
          zip_code: string
        }
        Insert: {
          auction_end_time?: string | null
          city: string
          created_at?: string
          current_bid?: number | null
          effort_level?: Database["public"]["Enums"]["vehicle_effort_level"]
          id?: number
          images?: Json
          latitude?: number | null
          longitude?: number | null
          make: string
          mileage: number
          model: string
          price: number
          risk_level?: Database["public"]["Enums"]["vehicle_risk_level"]
          source_type: Database["public"]["Enums"]["vehicle_source_type"]
          state: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          title_status?: Database["public"]["Enums"]["vehicle_title_status"]
          trim?: string | null
          updated_at?: string
          year: number
          zip_code: string
        }
        Update: {
          auction_end_time?: string | null
          city?: string
          created_at?: string
          current_bid?: number | null
          effort_level?: Database["public"]["Enums"]["vehicle_effort_level"]
          id?: number
          images?: Json
          latitude?: number | null
          longitude?: number | null
          make?: string
          mileage?: number
          model?: string
          price?: number
          risk_level?: Database["public"]["Enums"]["vehicle_risk_level"]
          source_type?: Database["public"]["Enums"]["vehicle_source_type"]
          state?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          title_status?: Database["public"]["Enums"]["vehicle_title_status"]
          trim?: string | null
          updated_at?: string
          year?: number
          zip_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      garage_action_kind:
        | "start_picknbuild"
        | "talk_to_someone"
        | "contact_dealer"
        | "message_seller"
        | "compare_all_paths"
      garage_title_preference: "any" | "clean_only" | "clean_or_rebuilt"
      vehicle_effort_level: "low" | "medium" | "high"
      vehicle_risk_level: "low" | "medium" | "high"
      vehicle_source_type: "dealer" | "auction" | "picknbuild" | "individual"
      vehicle_status: "active" | "sold" | "inactive"
      vehicle_title_status: "clean" | "rebuilt" | "salvage"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      garage_action_kind: [
        "start_picknbuild",
        "talk_to_someone",
        "contact_dealer",
        "message_seller",
        "compare_all_paths",
      ],
      garage_title_preference: ["any", "clean_only", "clean_or_rebuilt"],
      vehicle_effort_level: ["low", "medium", "high"],
      vehicle_risk_level: ["low", "medium", "high"],
      vehicle_source_type: ["dealer", "auction", "picknbuild", "individual"],
      vehicle_status: ["active", "sold", "inactive"],
      vehicle_title_status: ["clean", "rebuilt", "salvage"],
    },
  },
} as const
