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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category: string
          created_at: string
          date: string
          description: string
          end_date: string | null
          end_time: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          location: string
          max_participants: number
          price: string | null
          start_date: string | null
          start_time: string | null
          time: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          date: string
          description: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location: string
          max_participants?: number
          price?: string | null
          start_date?: string | null
          start_time?: string | null
          time: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          description?: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string
          max_participants?: number
          price?: string | null
          start_date?: string | null
          start_time?: string | null
          time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_registrations: {
        Row: {
          activity_name: string
          created_at: string
          id: string
          phone_country_code: string
          phone_number: string
          user_id: string
        }
        Insert: {
          activity_name: string
          created_at?: string
          id?: string
          phone_country_code: string
          phone_number: string
          user_id: string
        }
        Update: {
          activity_name?: string
          created_at?: string
          id?: string
          phone_country_code?: string
          phone_number?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      biblical_readings: {
        Row: {
          books: string
          chapters: string
          chapters_count: number
          comment: string | null
          created_at: string | null
          date: string
          day_number: number
          id: string
          month: number
          type: string
          year: number
        }
        Insert: {
          books: string
          chapters: string
          chapters_count: number
          comment?: string | null
          created_at?: string | null
          date: string
          day_number: number
          id?: string
          month: number
          type: string
          year: number
        }
        Update: {
          books?: string
          chapters?: string
          chapters_count?: number
          comment?: string | null
          created_at?: string | null
          date?: string
          day_number?: number
          id?: string
          month?: number
          type?: string
          year?: number
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
          subject: string
          type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
          type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
          type?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          donor_email: string | null
          donor_name: string | null
          id: string
          message: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          message?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          message?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean | null
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          group_name: string | null
          id: string
          image_url: string
          is_published: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          group_name?: string | null
          id?: string
          image_url: string
          is_published?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          group_name?: string | null
          id?: string
          image_url?: string
          is_published?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: Json | null
          id: string
          page_key: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          id?: string
          page_key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          id?: string
          page_key?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prayer_requests: {
        Row: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          prayer_count: number | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          prayer_count?: number | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          prayer_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prayer_responses: {
        Row: {
          content: string
          created_at: string
          id: string
          prayer_request_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          prayer_request_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          prayer_request_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayer_responses_prayer_request_id_fkey"
            columns: ["prayer_request_id"]
            isOneToOne: false
            referencedRelation: "prayer_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone_country_code: string | null
          phone_number: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone_country_code?: string | null
          phone_number?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone_country_code?: string | null
          phone_number?: string | null
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          correct_answer: string | null
          created_at: string
          difficulty: string
          id: string
          options: Json | null
          question: string
          question_type: string
          reading_id: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          difficulty: string
          id?: string
          options?: Json | null
          question: string
          question_type: string
          reading_id?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          options?: Json | null
          question?: string
          question_type?: string
          reading_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "biblical_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_responses: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_correct: boolean | null
          quiz_id: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          quiz_id: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          quiz_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          reading_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          reading_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          reading_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_progress_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "biblical_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_program_progress: {
        Row: {
          created_at: string | null
          id: string
          program_key: string
          date: string
          user_id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          program_key: string
          date: string
          user_id: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          program_key?: string
          date?: string
          user_id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      app_role: "admin_principal" | "admin" | "moderator" | "user"
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
      app_role: ["admin_principal", "admin", "moderator", "user"],
    },
  },
} as const
