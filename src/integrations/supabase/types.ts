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
      ai_logs: {
        Row: {
          cost_estimate: number | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          input_summary: string | null
          operation: string
          output_summary: string | null
          status: string | null
          tokens_used: number | null
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_summary?: string | null
          operation: string
          output_summary?: string | null
          status?: string | null
          tokens_used?: number | null
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_summary?: string | null
          operation?: string
          output_summary?: string | null
          status?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          module: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          module: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          module?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          compatibility_score: number | null
          competitor_vehicle_id: string | null
          created_at: string
          id: string
          my_vehicle_id: string | null
          savings: number | null
          winner: string | null
        }
        Insert: {
          compatibility_score?: number | null
          competitor_vehicle_id?: string | null
          created_at?: string
          id?: string
          my_vehicle_id?: string | null
          savings?: number | null
          winner?: string | null
        }
        Update: {
          compatibility_score?: number | null
          competitor_vehicle_id?: string | null
          created_at?: string
          id?: string
          my_vehicle_id?: string | null
          savings?: number | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comparisons_competitor_vehicle_id_fkey"
            columns: ["competitor_vehicle_id"]
            isOneToOne: false
            referencedRelation: "competitor_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_my_vehicle_id_fkey"
            columns: ["my_vehicle_id"]
            isOneToOne: false
            referencedRelation: "my_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_vehicles: {
        Row: {
          brand: string
          competitor_name: string | null
          confidence: Json | null
          created_at: string
          extraction_id: string | null
          id: string
          km: number | null
          model: string
          price: number | null
          source_url: string | null
          updated_at: string
          year_model: string
        }
        Insert: {
          brand: string
          competitor_name?: string | null
          confidence?: Json | null
          created_at?: string
          extraction_id?: string | null
          id?: string
          km?: number | null
          model: string
          price?: number | null
          source_url?: string | null
          updated_at?: string
          year_model: string
        }
        Update: {
          brand?: string
          competitor_name?: string | null
          confidence?: Json | null
          created_at?: string
          extraction_id?: string | null
          id?: string
          km?: number | null
          model?: string
          price?: number | null
          source_url?: string | null
          updated_at?: string
          year_model?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_vehicles_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "extraction_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_logs: {
        Row: {
          checkpoint_page: number
          competitor_id: string | null
          created_at: string
          error_log: Json | null
          finished_at: string | null
          id: string
          pages_processed: number
          started_by: string | null
          status: string
          total_pages: number
          url: string
          vehicles_found: number
        }
        Insert: {
          checkpoint_page?: number
          competitor_id?: string | null
          created_at?: string
          error_log?: Json | null
          finished_at?: string | null
          id?: string
          pages_processed?: number
          started_by?: string | null
          status?: string
          total_pages?: number
          url: string
          vehicles_found?: number
        }
        Update: {
          checkpoint_page?: number
          competitor_id?: string | null
          created_at?: string
          error_log?: Json | null
          finished_at?: string | null
          id?: string
          pages_processed?: number
          started_by?: string | null
          status?: string
          total_pages?: number
          url?: string
          vehicles_found?: number
        }
        Relationships: [
          {
            foreignKeyName: "extraction_logs_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_logs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          created_by: string | null
          error_log: Json | null
          file_name: string | null
          file_type: string | null
          id: string
          rows_failed: number
          rows_imported: number
          rows_received: number
          status: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_log?: Json | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          rows_failed?: number
          rows_imported?: number
          rows_received?: number
          status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_log?: Json | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          rows_failed?: number
          rows_imported?: number
          rows_received?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_update_runs: {
        Row: {
          created_at: string
          details: Json
          duration_ms: number | null
          finished_at: string | null
          id: string
          started_at: string
          status: string
          totals: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          duration_ms?: number | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          totals?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          duration_ms?: number | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          totals?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_update_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      my_vehicles: {
        Row: {
          brand: string
          created_at: string
          created_by: string | null
          id: string
          km: number | null
          model: string
          price: number | null
          source: string
          supplier_name: string | null
          updated_at: string
          year_model: string
        }
        Insert: {
          brand: string
          created_at?: string
          created_by?: string | null
          id?: string
          km?: number | null
          model: string
          price?: number | null
          source?: string
          supplier_name?: string | null
          updated_at?: string
          year_model: string
        }
        Update: {
          brand?: string
          created_at?: string
          created_by?: string | null
          id?: string
          km?: number | null
          model?: string
          price?: number | null
          source?: string
          supplier_name?: string | null
          updated_at?: string
          year_model?: string
        }
        Relationships: [
          {
            foreignKeyName: "my_vehicles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_dashboard_summary: {
        Row: {
          running_extractions: number | null
          total_comparisons: number | null
          total_competitor_vehicles: number | null
          total_competitors: number | null
          total_my_vehicles: number | null
        }
        Relationships: []
      }
      view_price_distribution: {
        Row: {
          avg_price: number | null
          brand: string | null
          max_price: number | null
          min_price: number | null
          model: string | null
          qty: number | null
          year_model: string | null
        }
        Relationships: []
      }
      view_recent_comparisons: {
        Row: {
          compatibility_score: number | null
          competitor_brand: string | null
          competitor_model: string | null
          competitor_name: string | null
          competitor_price: number | null
          created_at: string | null
          id: string | null
          my_brand: string | null
          my_model: string | null
          my_price: number | null
          savings: number | null
          winner: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "gerente"
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
      app_role: ["admin", "gerente"],
    },
  },
} as const
