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
