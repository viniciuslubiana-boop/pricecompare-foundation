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
      api_integration_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          http_status: number | null
          id: string
          integration_id: string
          started_at: string
          status: string
          url_called: string | null
          user_id: string | null
          vehicles_imported: number
          vehicles_received: number
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          http_status?: number | null
          id?: string
          integration_id: string
          started_at?: string
          status: string
          url_called?: string | null
          user_id?: string | null
          vehicles_imported?: number
          vehicles_received?: number
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          http_status?: number | null
          id?: string
          integration_id?: string
          started_at?: string
          status?: string
          url_called?: string | null
          user_id?: string | null
          vehicles_imported?: number
          vehicles_received?: number
        }
        Relationships: [
          {
            foreignKeyName: "api_integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "api_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "api_integrations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integrations: {
        Row: {
          auth_header_name: string | null
          auth_header_value: string | null
          base_company_id: string | null
          body_template: Json | null
          competitor_id: string | null
          created_at: string
          extra_headers: Json
          field_mapping: Json
          frequency: string
          http_method: string
          id: string
          last_run_at: string | null
          name: string
          status: string
          target_type: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          auth_header_name?: string | null
          auth_header_value?: string | null
          base_company_id?: string | null
          body_template?: Json | null
          competitor_id?: string | null
          created_at?: string
          extra_headers?: Json
          field_mapping?: Json
          frequency?: string
          http_method?: string
          id?: string
          last_run_at?: string | null
          name: string
          status?: string
          target_type: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          auth_header_name?: string | null
          auth_header_value?: string | null
          base_company_id?: string | null
          body_template?: Json | null
          competitor_id?: string | null
          created_at?: string
          extra_headers?: Json
          field_mapping?: Json
          frequency?: string
          http_method?: string
          id?: string
          last_run_at?: string | null
          name?: string
          status?: string
          target_type?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_integrations_base_company_id_fkey"
            columns: ["base_company_id"]
            isOneToOne: false
            referencedRelation: "base_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_integrations_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
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
      base_companies: {
        Row: {
          city: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          state: string | null
          status: string
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          state?: string | null
          status?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          state?: string | null
          status?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
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
          city: string | null
          competitor_id: string | null
          competitor_name: string | null
          confidence: Json | null
          created_at: string
          extraction_id: string | null
          id: string
          km: number | null
          model: string
          photo_url: string | null
          price: number | null
          source: string | null
          source_url: string | null
          updated_at: string
          version: string | null
          year_model: string
        }
        Insert: {
          brand: string
          city?: string | null
          competitor_id?: string | null
          competitor_name?: string | null
          confidence?: Json | null
          created_at?: string
          extraction_id?: string | null
          id?: string
          km?: number | null
          model: string
          photo_url?: string | null
          price?: number | null
          source?: string | null
          source_url?: string | null
          updated_at?: string
          version?: string | null
          year_model: string
        }
        Update: {
          brand?: string
          city?: string | null
          competitor_id?: string | null
          competitor_name?: string | null
          confidence?: Json | null
          created_at?: string
          extraction_id?: string | null
          id?: string
          km?: number | null
          model?: string
          photo_url?: string | null
          price?: number | null
          source?: string | null
          source_url?: string | null
          updated_at?: string
          version?: string | null
          year_model?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_vehicles_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
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
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          google_place_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string | null
          source_urls: Json
          state: string | null
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          source_urls?: Json
          state?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          source_urls?: Json
          state?: string | null
          status?: string
          updated_at?: string
          url?: string | null
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
      html_intelligence_runs: {
        Row: {
          actions_used: boolean
          base_url: string
          candidates: Json
          chosen_route: string | null
          chosen_score: number
          created_at: string
          embedded_json_detected: boolean
          error_message: string | null
          executed_by: string | null
          id: string
          load_more_clicks: number
          pagination_detected: boolean
          processing_ms: number
          raw_items_found: number
          scroll_cycles: number
          structured_data_detected: boolean
          technical_preview: Json
          updated_at: string
          vehicles_estimated: number
        }
        Insert: {
          actions_used?: boolean
          base_url: string
          candidates?: Json
          chosen_route?: string | null
          chosen_score?: number
          created_at?: string
          embedded_json_detected?: boolean
          error_message?: string | null
          executed_by?: string | null
          id?: string
          load_more_clicks?: number
          pagination_detected?: boolean
          processing_ms?: number
          raw_items_found?: number
          scroll_cycles?: number
          structured_data_detected?: boolean
          technical_preview?: Json
          updated_at?: string
          vehicles_estimated?: number
        }
        Update: {
          actions_used?: boolean
          base_url?: string
          candidates?: Json
          chosen_route?: string | null
          chosen_score?: number
          created_at?: string
          embedded_json_detected?: boolean
          error_message?: string | null
          executed_by?: string | null
          id?: string
          load_more_clicks?: number
          pagination_detected?: boolean
          processing_ms?: number
          raw_items_found?: number
          scroll_cycles?: number
          structured_data_detected?: boolean
          technical_preview?: Json
          updated_at?: string
          vehicles_estimated?: number
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          base_company_id: string | null
          competitor_id: string | null
          created_at: string
          created_by: string | null
          error_log: Json | null
          file_name: string | null
          file_type: string | null
          id: string
          import_target_type: string
          rows_duplicated: number
          rows_failed: number
          rows_imported: number
          rows_received: number
          status: string | null
        }
        Insert: {
          base_company_id?: string | null
          competitor_id?: string | null
          created_at?: string
          created_by?: string | null
          error_log?: Json | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          import_target_type?: string
          rows_duplicated?: number
          rows_failed?: number
          rows_imported?: number
          rows_received?: number
          status?: string | null
        }
        Update: {
          base_company_id?: string | null
          competitor_id?: string | null
          created_at?: string
          created_by?: string | null
          error_log?: Json | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          import_target_type?: string
          rows_duplicated?: number
          rows_failed?: number
          rows_imported?: number
          rows_received?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_base_company_id_fkey"
            columns: ["base_company_id"]
            isOneToOne: false
            referencedRelation: "base_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_logs_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_acquisition_logs: {
        Row: {
          company_id: string | null
          company_type: Database["public"]["Enums"]["acquisition_company_type"]
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          method: Database["public"]["Enums"]["acquisition_method"]
          started_at: string
          status: Database["public"]["Enums"]["acquisition_status"]
          updated_at: string
          url: string | null
          vehicles_found: number
          vehicles_saved: number
        }
        Insert: {
          company_id?: string | null
          company_type: Database["public"]["Enums"]["acquisition_company_type"]
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          method: Database["public"]["Enums"]["acquisition_method"]
          started_at?: string
          status?: Database["public"]["Enums"]["acquisition_status"]
          updated_at?: string
          url?: string | null
          vehicles_found?: number
          vehicles_saved?: number
        }
        Update: {
          company_id?: string | null
          company_type?: Database["public"]["Enums"]["acquisition_company_type"]
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["acquisition_method"]
          started_at?: string
          status?: Database["public"]["Enums"]["acquisition_status"]
          updated_at?: string
          url?: string | null
          vehicles_found?: number
          vehicles_saved?: number
        }
        Relationships: []
      }
      market_changes: {
        Row: {
          brand: string | null
          change_type: string
          competitor_id: string | null
          competitor_name: string
          current_km: number | null
          current_price: number | null
          detected_at: string
          id: string
          km_diff: number | null
          model: string | null
          previous_km: number | null
          previous_price: number | null
          price_diff: number | null
          price_diff_pct: number | null
          run_id: string | null
          summary: string | null
          vehicle_key: string
          year_model: string | null
        }
        Insert: {
          brand?: string | null
          change_type: string
          competitor_id?: string | null
          competitor_name: string
          current_km?: number | null
          current_price?: number | null
          detected_at?: string
          id?: string
          km_diff?: number | null
          model?: string | null
          previous_km?: number | null
          previous_price?: number | null
          price_diff?: number | null
          price_diff_pct?: number | null
          run_id?: string | null
          summary?: string | null
          vehicle_key: string
          year_model?: string | null
        }
        Update: {
          brand?: string | null
          change_type?: string
          competitor_id?: string | null
          competitor_name?: string
          current_km?: number | null
          current_price?: number | null
          detected_at?: string
          id?: string
          km_diff?: number | null
          model?: string | null
          previous_km?: number | null
          previous_price?: number | null
          price_diff?: number | null
          price_diff_pct?: number | null
          run_id?: string | null
          summary?: string | null
          vehicle_key?: string
          year_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_changes_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "market_update_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      market_source_history: {
        Row: {
          company_id: string | null
          company_type: Database["public"]["Enums"]["acquisition_company_type"]
          confidence: number
          created_at: string
          execution_time_ms: number | null
          fallback_chain: Json | null
          fallback_used: boolean
          id: string
          method_used: Database["public"]["Enums"]["source_method"]
          success: boolean
          url: string
          vehicles_found: number
        }
        Insert: {
          company_id?: string | null
          company_type: Database["public"]["Enums"]["acquisition_company_type"]
          confidence?: number
          created_at?: string
          execution_time_ms?: number | null
          fallback_chain?: Json | null
          fallback_used?: boolean
          id?: string
          method_used: Database["public"]["Enums"]["source_method"]
          success?: boolean
          url: string
          vehicles_found?: number
        }
        Update: {
          company_id?: string | null
          company_type?: Database["public"]["Enums"]["acquisition_company_type"]
          confidence?: number
          created_at?: string
          execution_time_ms?: number | null
          fallback_chain?: Json | null
          fallback_used?: boolean
          id?: string
          method_used?: Database["public"]["Enums"]["source_method"]
          success?: boolean
          url?: string
          vehicles_found?: number
        }
        Relationships: []
      }
      market_source_profiles: {
        Row: {
          active: boolean
          confidence: number
          created_at: string
          id: string
          pagination_strategy: Json | null
          priority: number
          selector_strategy: Json | null
          source_method: Database["public"]["Enums"]["source_method"]
          technology: string
          updated_at: string
          vehicle_card_strategy: Json | null
        }
        Insert: {
          active?: boolean
          confidence?: number
          created_at?: string
          id?: string
          pagination_strategy?: Json | null
          priority?: number
          selector_strategy?: Json | null
          source_method: Database["public"]["Enums"]["source_method"]
          technology: string
          updated_at?: string
          vehicle_card_strategy?: Json | null
        }
        Update: {
          active?: boolean
          confidence?: number
          created_at?: string
          id?: string
          pagination_strategy?: Json | null
          priority?: number
          selector_strategy?: Json | null
          source_method?: Database["public"]["Enums"]["source_method"]
          technology?: string
          updated_at?: string
          vehicle_card_strategy?: Json | null
        }
        Relationships: []
      }
      market_source_scores: {
        Row: {
          actions_used: boolean
          company_id: string | null
          company_type: string
          coverage_score: number
          created_at: string
          executions_success: number
          executions_total: number
          fallback_used: boolean
          html_score: number
          id: string
          last_failure_at: string | null
          last_success_at: string | null
          performance_score: number
          quality_score: number
          raw_items_found: number
          route_url: string | null
          source_method: string
          source_score: number
          stability_score: number
          success_rate: number
          updated_at: string
          url: string
          vehicles_estimated: number
        }
        Insert: {
          actions_used?: boolean
          company_id?: string | null
          company_type: string
          coverage_score?: number
          created_at?: string
          executions_success?: number
          executions_total?: number
          fallback_used?: boolean
          html_score?: number
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          performance_score?: number
          quality_score?: number
          raw_items_found?: number
          route_url?: string | null
          source_method: string
          source_score?: number
          stability_score?: number
          success_rate?: number
          updated_at?: string
          url: string
          vehicles_estimated?: number
        }
        Update: {
          actions_used?: boolean
          company_id?: string | null
          company_type?: string
          coverage_score?: number
          created_at?: string
          executions_success?: number
          executions_total?: number
          fallback_used?: boolean
          html_score?: number
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          performance_score?: number
          quality_score?: number
          raw_items_found?: number
          route_url?: string | null
          source_method?: string
          source_score?: number
          stability_score?: number
          success_rate?: number
          updated_at?: string
          url?: string
          vehicles_estimated?: number
        }
        Relationships: []
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
          base_company_id: string | null
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
          base_company_id?: string | null
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
          base_company_id?: string | null
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
            foreignKeyName: "my_vehicles_base_company_id_fkey"
            columns: ["base_company_id"]
            isOneToOne: false
            referencedRelation: "base_companies"
            referencedColumns: ["id"]
          },
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
      site_discovery: {
        Row: {
          company_id: string | null
          company_type: Database["public"]["Enums"]["acquisition_company_type"]
          confidence: number
          created_at: string
          detected_at: string
          discovery_time_ms: number | null
          framework_signature: Json | null
          html_signature: Json | null
          id: string
          technology: string
          updated_at: string
          url: string
        }
        Insert: {
          company_id?: string | null
          company_type: Database["public"]["Enums"]["acquisition_company_type"]
          confidence?: number
          created_at?: string
          detected_at?: string
          discovery_time_ms?: number | null
          framework_signature?: Json | null
          html_signature?: Json | null
          id?: string
          technology: string
          updated_at?: string
          url: string
        }
        Update: {
          company_id?: string | null
          company_type?: Database["public"]["Enums"]["acquisition_company_type"]
          confidence?: number
          created_at?: string
          detected_at?: string
          discovery_time_ms?: number | null
          framework_signature?: Json | null
          html_signature?: Json | null
          id?: string
          technology?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_dashboard_preferences: {
        Row: {
          base_company_id: string | null
          collapsed: Json
          created_at: string
          favorites: Json
          filters: Json
          hidden: Json
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          base_company_id?: string | null
          collapsed?: Json
          created_at?: string
          favorites?: Json
          filters?: Json
          hidden?: Json
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          base_company_id?: string | null
          collapsed?: Json
          created_at?: string
          favorites?: Json
          filters?: Json
          hidden?: Json
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dashboard_preferences_base_company_id_fkey"
            columns: ["base_company_id"]
            isOneToOne: false
            referencedRelation: "base_companies"
            referencedColumns: ["id"]
          },
        ]
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
      vehicle_master_catalog: {
        Row: {
          active: boolean
          brand: string
          canonical_model: string
          canonical_version: string | null
          created_at: string
          created_by: string | null
          displacement: string | null
          end_year: number | null
          fuel: string | null
          id: string
          notes: string | null
          start_year: number | null
          transmission: string | null
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          active?: boolean
          brand: string
          canonical_model: string
          canonical_version?: string | null
          created_at?: string
          created_by?: string | null
          displacement?: string | null
          end_year?: number | null
          fuel?: string | null
          id?: string
          notes?: string | null
          start_year?: number | null
          transmission?: string | null
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          active?: boolean
          brand?: string
          canonical_model?: string
          canonical_version?: string | null
          created_at?: string
          created_by?: string | null
          displacement?: string | null
          end_year?: number | null
          fuel?: string | null
          id?: string
          notes?: string | null
          start_year?: number | null
          transmission?: string | null
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      vehicle_model_aliases: {
        Row: {
          alias: string
          brand: string
          canonical: string
          created_at: string
          created_by: string | null
          id: string
          master_catalog_id: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          alias: string
          brand: string
          canonical: string
          created_at?: string
          created_by?: string | null
          id?: string
          master_catalog_id?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string
          brand?: string
          canonical?: string
          created_at?: string
          created_by?: string | null
          id?: string
          master_catalog_id?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_model_aliases_master_catalog_id_fkey"
            columns: ["master_catalog_id"]
            isOneToOne: false
            referencedRelation: "vehicle_master_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      api_integrations_public: {
        Row: {
          auth_header_name: string | null
          base_company_id: string | null
          body_template: Json | null
          competitor_id: string | null
          created_at: string | null
          extra_headers: Json | null
          field_mapping: Json | null
          frequency: string | null
          has_auth_header_value: boolean | null
          http_method: string | null
          id: string | null
          last_run_at: string | null
          name: string | null
          status: string | null
          target_type: string | null
          updated_at: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          auth_header_name?: string | null
          base_company_id?: string | null
          body_template?: Json | null
          competitor_id?: string | null
          created_at?: string | null
          extra_headers?: Json | null
          field_mapping?: Json | null
          frequency?: string | null
          has_auth_header_value?: never
          http_method?: string | null
          id?: string | null
          last_run_at?: string | null
          name?: string | null
          status?: string | null
          target_type?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          auth_header_name?: string | null
          base_company_id?: string | null
          body_template?: Json | null
          competitor_id?: string | null
          created_at?: string | null
          extra_headers?: Json | null
          field_mapping?: Json | null
          frequency?: string | null
          has_auth_header_value?: never
          http_method?: string | null
          id?: string | null
          last_run_at?: string | null
          name?: string | null
          status?: string | null
          target_type?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_integrations_base_company_id_fkey"
            columns: ["base_company_id"]
            isOneToOne: false
            referencedRelation: "base_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_integrations_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
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
      acquisition_company_type: "base_company" | "competitor"
      acquisition_method:
        | "API"
        | "JSON"
        | "HTML"
        | "RENDERED_HTML"
        | "FILE_IMPORT"
      acquisition_status:
        | "pending"
        | "running"
        | "success"
        | "partial"
        | "failed"
      app_role: "admin" | "gerente"
      source_method:
        | "PLATFORM_PROFILE"
        | "OFFICIAL_API"
        | "PUBLIC_API"
        | "GRAPHQL"
        | "JSON"
        | "EMBEDDED_JSON"
        | "XML"
        | "SITEMAP"
        | "HTML"
        | "RENDERED_HTML"
        | "FILE_IMPORT"
        | "UNKNOWN"
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
      acquisition_company_type: ["base_company", "competitor"],
      acquisition_method: [
        "API",
        "JSON",
        "HTML",
        "RENDERED_HTML",
        "FILE_IMPORT",
      ],
      acquisition_status: [
        "pending",
        "running",
        "success",
        "partial",
        "failed",
      ],
      app_role: ["admin", "gerente"],
      source_method: [
        "PLATFORM_PROFILE",
        "OFFICIAL_API",
        "PUBLIC_API",
        "GRAPHQL",
        "JSON",
        "EMBEDDED_JSON",
        "XML",
        "SITEMAP",
        "HTML",
        "RENDERED_HTML",
        "FILE_IMPORT",
        "UNKNOWN",
      ],
    },
  },
} as const
