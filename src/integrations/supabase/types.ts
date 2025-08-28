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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      analysis_history: {
        Row: {
          action: string
          analysis_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          analysis_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          analysis_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_history_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "user_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          expires_at: string
          id: string
          last_rotation: string | null
          next_rotation: string | null
          rotation_count: number
          service_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          expires_at: string
          id?: string
          last_rotation?: string | null
          next_rotation?: string | null
          rotation_count?: number
          service_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          expires_at?: string
          id?: string
          last_rotation?: string | null
          next_rotation?: string | null
          rotation_count?: number
          service_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_user_plan_changes: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          new_tier: string
          old_tier: string | null
          reason: string | null
          source: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          new_tier: string
          old_tier?: string | null
          reason?: string | null
          source: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          new_tier?: string
          old_tier?: string | null
          reason?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      cache_entries: {
        Row: {
          access_count: number
          created_at: string
          expires_at: string
          id: string
          key: string
          last_accessed: string
          size_bytes: number
          value: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          expires_at: string
          id?: string
          key: string
          last_accessed?: string
          size_bytes: number
          value: string
        }
        Update: {
          access_count?: number
          created_at?: string
          expires_at?: string
          id?: string
          key?: string
          last_accessed?: string
          size_bytes?: number
          value?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          specialty: string | null
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          specialty?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          specialty?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number
          chunk_size: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          knowledge_base_id: string
          metadata: Json | null
        }
        Insert: {
          chunk_index: number
          chunk_size: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          knowledge_base_id: string
          metadata?: Json | null
        }
        Update: {
          chunk_index?: number
          chunk_size?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          knowledge_base_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_public: boolean | null
          name: string
          template_content: Json
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          template_content: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          template_content?: Json
          updated_at?: string
        }
        Relationships: []
      }
      job_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          max_attempts: number
          payload: Json
          priority: number
          scheduled_at: string
          started_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number
          payload: Json
          priority?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number
          payload?: Json
          priority?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      kb_processing_logs: {
        Row: {
          created_at: string
          file_id: string
          id: string
          message: string | null
          metadata: Json | null
          score: number | null
          stage: string
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: string
          message?: string | null
          metadata?: Json | null
          score?: number | null
          stage: string
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          score?: number | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_processing_logs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          extraction_method: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          markdown_content: string | null
          mime_type: string | null
          ocr_used: boolean | null
          original_name: string
          processed_at: string | null
          processing_logs: Json | null
          quality_score: number | null
          similarity_score: number | null
          status: string
          updated_at: string
          validation_errors: string[] | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          extraction_method?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          markdown_content?: string | null
          mime_type?: string | null
          ocr_used?: boolean | null
          original_name: string
          processed_at?: string | null
          processing_logs?: Json | null
          quality_score?: number | null
          similarity_score?: number | null
          status?: string
          updated_at?: string
          validation_errors?: string[] | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          extraction_method?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          markdown_content?: string | null
          mime_type?: string | null
          ocr_used?: boolean | null
          original_name?: string
          processed_at?: string | null
          processing_logs?: Json | null
          quality_score?: number | null
          similarity_score?: number | null
          status?: string
          updated_at?: string
          validation_errors?: string[] | null
        }
        Relationships: []
      }
      llm_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      metrics_snapshots: {
        Row: {
          created_at: string
          id: string
          labels: Json | null
          metric_name: string
          metric_value: number
          timestamp: string
        }
        Insert: {
          created_at?: string
          id?: string
          labels?: Json | null
          metric_name: string
          metric_value: number
          timestamp?: string
        }
        Update: {
          created_at?: string
          id?: string
          labels?: Json | null
          metric_name?: string
          metric_value?: number
          timestamp?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_save_analyses: boolean | null
          avatar_url: string | null
          created_at: string
          default_model: string | null
          email: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          language: string | null
          notification_frequency: string | null
          push_notifications: boolean | null
          report_detail_level: string | null
          sound_notifications: boolean | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          auto_save_analyses?: boolean | null
          avatar_url?: string | null
          created_at?: string
          default_model?: string | null
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          language?: string | null
          notification_frequency?: string | null
          push_notifications?: boolean | null
          report_detail_level?: string | null
          sound_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          auto_save_analyses?: boolean | null
          avatar_url?: string | null
          created_at?: string
          default_model?: string | null
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          language?: string | null
          notification_frequency?: string | null
          push_notifications?: boolean | null
          report_detail_level?: string | null
          sound_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          requests_count: number | null
          tier_limit: number
          tier_window: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          requests_count?: number | null
          tier_limit: number
          tier_window?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          requests_count?: number | null
          tier_limit?: number
          tier_window?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_comp: boolean | null
          session_version: number
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_comp?: boolean | null
          session_version?: number
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_comp?: boolean | null
          session_version?: number
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscribers_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trace_spans: {
        Row: {
          created_at: string
          duration_ms: number | null
          end_time: string | null
          id: string
          metadata: Json | null
          operation_name: string
          parent_span_id: string | null
          span_id: string
          start_time: string
          status: string
          trace_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          end_time?: string | null
          id?: string
          metadata?: Json | null
          operation_name: string
          parent_span_id?: string | null
          span_id: string
          start_time: string
          status?: string
          trace_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          end_time?: string | null
          id?: string
          metadata?: Json | null
          operation_name?: string
          parent_span_id?: string | null
          span_id?: string
          start_time?: string
          status?: string
          trace_id?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          counter_key: string
          counter_value: number
          period: string
          updated_at: string | null
          user_id: string
          window_start: string
        }
        Insert: {
          counter_key: string
          counter_value?: number
          period: string
          updated_at?: string | null
          user_id: string
          window_start?: string
        }
        Update: {
          counter_key?: string
          counter_value?: number
          period?: string
          updated_at?: string | null
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      user_analyses: {
        Row: {
          analysis_result: Json | null
          created_at: string
          id: string
          improvements: string[] | null
          original_text: string
          score: number | null
          status: string | null
          suggestions: string[] | null
          title: string
          updated_at: string
          user_id: string
          user_id_ref: string | null
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string
          id?: string
          improvements?: string[] | null
          original_text: string
          score?: number | null
          status?: string | null
          suggestions?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          user_id_ref?: string | null
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string
          id?: string
          improvements?: string[] | null
          original_text?: string
          score?: number | null
          status?: string | null
          suggestions?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          user_id_ref?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          active: boolean | null
          created_at: string
          created_by: string
          events: string[]
          id: string
          last_triggered: string | null
          name: string
          secret_key: string | null
          total_triggers: number | null
          url: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          created_by: string
          events: string[]
          id?: string
          last_triggered?: string | null
          name: string
          secret_key?: string | null
          total_triggers?: number | null
          url: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          created_by?: string
          events?: string[]
          id?: string
          last_triggered?: string | null
          name?: string
          secret_key?: string | null
          total_triggers?: number | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_plan_v1: {
        Row: {
          email: string | null
          is_comp: boolean | null
          plan: string | null
          plan_level: number | null
          subscribed: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_user_plan: {
        Args: { p_new_plan: string; p_reason?: string; p_user_id: string }
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_traces: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      get_user_plan: {
        Args: { target_user_id?: string }
        Returns: {
          email: string
          is_comp: boolean
          plan: string
          plan_level: number
          subscribed: boolean
          updated_at: string
          user_id: string
        }[]
      }
      get_user_plan_secure: {
        Args: { target_user_id?: string }
        Returns: {
          email: string
          is_comp: boolean
          plan: string
          plan_level: number
          subscribed: boolean
          updated_at: string
          user_id: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      increment_and_check_usage: {
        Args: {
          p_counter_key: string
          p_increment?: number
          p_limit?: number
          p_period: string
          p_user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      search_similar_chunks: {
        Args: {
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          similarity: number
          source: string
        }[]
      }
      set_user_plan: {
        Args:
          | {
              p_admin_id?: string
              p_new_plan: string
              p_reason?: string
              p_source: string
              p_user_id: string
            }
          | { p_new_plan: string; p_source: string; p_user_id: string }
        Returns: Json
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      app_role: ["admin", "user"],
    },
  },
} as const
