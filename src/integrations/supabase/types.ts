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
      binder_activity: {
        Row: {
          action_type: string
          actor_name: string
          actor_type: string
          binder_id: string | null
          confidence: number | null
          created_at: string
          details: Json
          id: string
          is_confirmed: boolean
          source: string
          summary: string
          target: string
          target_id: string | null
          timestamp: string
          undo_token: string | null
        }
        Insert: {
          action_type: string
          actor_name?: string
          actor_type?: string
          binder_id?: string | null
          confidence?: number | null
          created_at?: string
          details?: Json
          id?: string
          is_confirmed?: boolean
          source?: string
          summary: string
          target?: string
          target_id?: string | null
          timestamp?: string
          undo_token?: string | null
        }
        Update: {
          action_type?: string
          actor_name?: string
          actor_type?: string
          binder_id?: string | null
          confidence?: number | null
          created_at?: string
          details?: Json
          id?: string
          is_confirmed?: boolean
          source?: string
          summary?: string
          target?: string
          target_id?: string | null
          timestamp?: string
          undo_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "binder_activity_binder_id_fkey"
            columns: ["binder_id"]
            isOneToOne: false
            referencedRelation: "binders"
            referencedColumns: ["id"]
          },
        ]
      }
      binder_route_overrides: {
        Row: {
          after: Json
          before: Json
          binder_id: string
          created_at: string
          fields_changed: Json
          id: string
          route_profile_route_id: string
        }
        Insert: {
          after?: Json
          before?: Json
          binder_id: string
          created_at?: string
          fields_changed?: Json
          id?: string
          route_profile_route_id: string
        }
        Update: {
          after?: Json
          before?: Json
          binder_id?: string
          created_at?: string
          fields_changed?: Json
          id?: string
          route_profile_route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "binder_route_overrides_binder_id_fkey"
            columns: ["binder_id"]
            isOneToOne: false
            referencedRelation: "binders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "binder_route_overrides_route_profile_route_id_fkey"
            columns: ["route_profile_route_id"]
            isOneToOne: false
            referencedRelation: "route_profile_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      binder_routes: {
        Row: {
          binder_id: string
          chain: Json
          created_at: string
          id: string
          iso_number: number
          status: string
        }
        Insert: {
          binder_id: string
          chain?: Json
          created_at?: string
          id?: string
          iso_number: number
          status?: string
        }
        Update: {
          binder_id?: string
          chain?: Json
          created_at?: string
          id?: string
          iso_number?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "binder_routes_binder_id_fkey"
            columns: ["binder_id"]
            isOneToOne: false
            referencedRelation: "binders"
            referencedColumns: ["id"]
          },
        ]
      }
      binder_templates: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      binders: {
        Row: {
          config: Json
          container_id: string
          created_at: string
          created_by: string | null
          event_date: string
          id: string
          iso_count: number
          league: string
          open_issues: number
          partner: string
          route_mode: string
          route_profile_id: string | null
          status: string
          title: string
          transport: string
          updated_at: string
          venue: string
        }
        Insert: {
          config?: Json
          container_id?: string
          created_at?: string
          created_by?: string | null
          event_date?: string
          id?: string
          iso_count?: number
          league?: string
          open_issues?: number
          partner?: string
          route_mode?: string
          route_profile_id?: string | null
          status?: string
          title: string
          transport?: string
          updated_at?: string
          venue?: string
        }
        Update: {
          config?: Json
          container_id?: string
          created_at?: string
          created_by?: string | null
          event_date?: string
          id?: string
          iso_count?: number
          league?: string
          open_issues?: number
          partner?: string
          route_mode?: string
          route_profile_id?: string | null
          status?: string
          title?: string
          transport?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "binders_route_profile_id_fkey"
            columns: ["route_profile_id"]
            isOneToOne: false
            referencedRelation: "route_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          organization: string | null
          role_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          organization?: string | null
          role_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          organization?: string | null
          role_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quinn_admin_queue: {
        Row: {
          answer: string | null
          binder_id: string | null
          created_at: string
          id: string
          question: string
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          binder_id?: string | null
          created_at?: string
          id?: string
          question: string
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          binder_id?: string | null
          created_at?: string
          id?: string
          question?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      quinn_documents: {
        Row: {
          binder_id: string | null
          created_at: string
          filename: string
          id: string
          url: string
          user_id: string
        }
        Insert: {
          binder_id?: string | null
          created_at?: string
          filename: string
          id?: string
          url?: string
          user_id: string
        }
        Update: {
          binder_id?: string | null
          created_at?: string
          filename?: string
          id?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      quinn_extractions: {
        Row: {
          binder_id: string | null
          confidence_json: Json
          confirmed_json: Json
          created_at: string
          document_id: string
          extracted_json: Json
          id: string
        }
        Insert: {
          binder_id?: string | null
          confidence_json?: Json
          confirmed_json?: Json
          created_at?: string
          document_id: string
          extracted_json?: Json
          id?: string
        }
        Update: {
          binder_id?: string | null
          confidence_json?: Json
          confirmed_json?: Json
          created_at?: string
          document_id?: string
          extracted_json?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quinn_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "quinn_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      quinn_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          quick_replies: string[] | null
          role: string
          thread_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          quick_replies?: string[] | null
          role?: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          quick_replies?: string[] | null
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quinn_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "quinn_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      quinn_profile: {
        Row: {
          last_binder_id: string | null
          last_control_room: string | null
          last_league: string | null
          last_partner: string | null
          last_route_view: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          last_binder_id?: string | null
          last_control_room?: string | null
          last_league?: string | null
          last_partner?: string | null
          last_route_view?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          last_binder_id?: string | null
          last_control_room?: string | null
          last_league?: string | null
          last_partner?: string | null
          last_route_view?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quinn_threads: {
        Row: {
          created_at: string
          date_key: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_key: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_key?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      route_aliases: {
        Row: {
          alias_type: string
          alias_value: string
          created_at: string
          id: string
          route_profile_route_id: string
        }
        Insert: {
          alias_type: string
          alias_value: string
          created_at?: string
          id?: string
          route_profile_route_id: string
        }
        Update: {
          alias_type?: string
          alias_value?: string
          created_at?: string
          id?: string
          route_profile_route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_aliases_route_profile_route_id_fkey"
            columns: ["route_profile_route_id"]
            isOneToOne: false
            referencedRelation: "route_profile_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_hops: {
        Row: {
          created_at: string
          hop_type: string
          id: string
          label: string
          meta: Json
          position: number
          route_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hop_type?: string
          id?: string
          label?: string
          meta?: Json
          position?: number
          route_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hop_type?: string
          id?: string
          label?: string
          meta?: Json
          position?: number
          route_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_hops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_profile_routes: {
        Row: {
          cloud_endpoint: string
          created_at: string
          encoder_brand: string
          flypack_id: string
          flypack_sdi_n: number
          id: string
          iso_number: number
          lawo_vsm_name: string
          magewell_unit: number | null
          receiver_brand: string
          route_profile_id: string
          status: string
          transport_protocol: string
          truck_sdi_n: number
          tx_label: string
          updated_at: string
          videon_input_label: string
          videon_input_slot: number
          videon_unit: number
        }
        Insert: {
          cloud_endpoint?: string
          created_at?: string
          encoder_brand?: string
          flypack_id?: string
          flypack_sdi_n: number
          id?: string
          iso_number: number
          lawo_vsm_name: string
          magewell_unit?: number | null
          receiver_brand?: string
          route_profile_id: string
          status?: string
          transport_protocol?: string
          truck_sdi_n: number
          tx_label: string
          updated_at?: string
          videon_input_label: string
          videon_input_slot: number
          videon_unit: number
        }
        Update: {
          cloud_endpoint?: string
          created_at?: string
          encoder_brand?: string
          flypack_id?: string
          flypack_sdi_n?: number
          id?: string
          iso_number?: number
          lawo_vsm_name?: string
          magewell_unit?: number | null
          receiver_brand?: string
          route_profile_id?: string
          status?: string
          transport_protocol?: string
          truck_sdi_n?: number
          tx_label?: string
          updated_at?: string
          videon_input_label?: string
          videon_input_slot?: number
          videon_unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_profile_routes_route_profile_id_fkey"
            columns: ["route_profile_id"]
            isOneToOne: false
            referencedRelation: "route_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      route_profiles: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          scope?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      routers: {
        Row: {
          brand: string
          created_at: string
          crosspoints: Json
          id: string
          ip: string
          model: string
          name: string
          updated_at: string
        }
        Insert: {
          brand?: string
          created_at?: string
          crosspoints?: Json
          id?: string
          ip?: string
          model?: string
          name?: string
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          crosspoints?: Json
          id?: string
          ip?: string
          model?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          binder_id: string | null
          created_at: string
          created_by: string | null
          id: string
          iso_number: number
          notes: string
          route_data: Json
          route_name: string
          status: string
          updated_at: string
        }
        Insert: {
          binder_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          iso_number?: number
          notes?: string
          route_data?: Json
          route_name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          binder_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          iso_number?: number
          notes?: string
          route_data?: Json
          route_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_binder_id_fkey"
            columns: ["binder_id"]
            isOneToOne: false
            referencedRelation: "binders"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_contacts: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string
          notes: string
          org: string
          phone: string
          role: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name: string
          notes?: string
          org?: string
          phone?: string
          role?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string
          org?: string
          phone?: string
          role?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          access: string
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          access?: string
          created_at?: string
          id?: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          access?: string
          created_at?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      wiki_articles: {
        Row: {
          article_type: Database["public"]["Enums"]["wiki_article_type"]
          attachments: Json | null
          category: Database["public"]["Enums"]["wiki_category"]
          created_at: string
          created_by: string
          description: string | null
          fts: unknown
          id: string
          related_binder_id: string | null
          related_route_id: string | null
          structured_content: Json
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          article_type?: Database["public"]["Enums"]["wiki_article_type"]
          attachments?: Json | null
          category?: Database["public"]["Enums"]["wiki_category"]
          created_at?: string
          created_by?: string
          description?: string | null
          fts?: unknown
          id?: string
          related_binder_id?: string | null
          related_route_id?: string | null
          structured_content?: Json
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Update: {
          article_type?: Database["public"]["Enums"]["wiki_article_type"]
          attachments?: Json | null
          category?: Database["public"]["Enums"]["wiki_category"]
          created_at?: string
          created_by?: string
          description?: string | null
          fts?: unknown
          id?: string
          related_binder_id?: string | null
          related_route_id?: string | null
          structured_content?: Json
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: []
      }
      wiki_links: {
        Row: {
          article_id: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          link_type: string
        }
        Insert: {
          article_id: string
          created_at?: string
          created_by?: string
          entity_id: string
          entity_type: string
          id?: string
          link_type?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          link_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wiki_links_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "wiki_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_suggestion_feedback: {
        Row: {
          action: string
          article_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          article_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          article_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wiki_suggestion_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "wiki_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_versions: {
        Row: {
          article_id: string
          article_type: Database["public"]["Enums"]["wiki_article_type"]
          category: Database["public"]["Enums"]["wiki_category"]
          change_summary: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          structured_content: Json
          tags: string[] | null
          title: string
          version_number: number
        }
        Insert: {
          article_id: string
          article_type: Database["public"]["Enums"]["wiki_article_type"]
          category: Database["public"]["Enums"]["wiki_category"]
          change_summary?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          structured_content?: Json
          tags?: string[] | null
          title: string
          version_number: number
        }
        Update: {
          article_id?: string
          article_type?: Database["public"]["Enums"]["wiki_article_type"]
          category?: Database["public"]["Enums"]["wiki_category"]
          change_summary?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          structured_content?: Json
          tags?: string[] | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "wiki_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "wiki_articles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      wiki_article_type:
        | "solve"
        | "standard"
        | "workflow"
        | "diagram"
        | "vendor_procedure"
        | "post_mortem"
        | "reference"
      wiki_category:
        | "signal_standards"
        | "encoder_standards"
        | "decoder_topology"
        | "transport_profiles"
        | "comms_standards"
        | "production_protocols"
        | "naming_conventions"
        | "checklist_templates"
        | "field_solves"
        | "drawings_diagrams"
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
      wiki_article_type: [
        "solve",
        "standard",
        "workflow",
        "diagram",
        "vendor_procedure",
        "post_mortem",
        "reference",
      ],
      wiki_category: [
        "signal_standards",
        "encoder_standards",
        "decoder_topology",
        "transport_profiles",
        "comms_standards",
        "production_protocols",
        "naming_conventions",
        "checklist_templates",
        "field_solves",
        "drawings_diagrams",
      ],
    },
  },
} as const
