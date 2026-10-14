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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      books: {
        Row: {
          author: string | null
          book_code: string | null
          category: string | null
          created_at: string
          faculty_id: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          book_code?: string | null
          category?: string | null
          created_at?: string
          faculty_id: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          book_code?: string | null
          category?: string | null
          created_at?: string
          faculty_id?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      library_visits: {
        Row: {
          book_id: string | null
          book_name_manual: string | null
          created_at: string
          duration_minutes: number | null
          entry_at: string
          exit_at: string | null
          faculty_id: string
          feedback: string | null
          id: string
          interest_area: string | null
          rating: number | null
          status: string
          student_id: string
          student_name: string
          updated_at: string
          visit_date: string
          visit_time: string
        }
        Insert: {
          book_id?: string | null
          book_name_manual?: string | null
          created_at?: string
          duration_minutes?: number | null
          entry_at?: string
          exit_at?: string | null
          faculty_id: string
          feedback?: string | null
          id?: string
          interest_area?: string | null
          rating?: number | null
          status?: string
          student_id: string
          student_name: string
          updated_at?: string
          visit_date?: string
          visit_time?: string
        }
        Update: {
          book_id?: string | null
          book_name_manual?: string | null
          created_at?: string
          duration_minutes?: number | null
          entry_at?: string
          exit_at?: string | null
          faculty_id?: string
          feedback?: string | null
          id?: string
          interest_area?: string | null
          rating?: number | null
          status?: string
          student_id?: string
          student_name?: string
          updated_at?: string
          visit_date?: string
          visit_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_visits_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_visits_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          auth_user_id: string | null
          created_at: string
          faculty_id: string
          full_name: string
          gender: string | null
          id: string
          is_active: boolean
          student_id: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          faculty_id: string
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean
          student_id: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          faculty_id?: string
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
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
      visitor_visits: {
        Row: {
          book_id: string | null
          created_at: string
          duration_minutes: number | null
          entry_at: string
          exit_at: string | null
          feedback: string | null
          full_name: string
          id: string
          rating: number | null
          specialty: string
          status: string
          updated_at: string
          visit_date: string
          visitor_account_id: string | null
          visitor_identifier: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          entry_at?: string
          exit_at?: string | null
          feedback?: string | null
          full_name: string
          id?: string
          rating?: number | null
          specialty: string
          status?: string
          updated_at?: string
          visit_date?: string
          visitor_account_id?: string | null
          visitor_identifier?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          entry_at?: string
          exit_at?: string | null
          feedback?: string | null
          full_name?: string
          id?: string
          rating?: number | null
          specialty?: string
          status?: string
          updated_at?: string
          visit_date?: string
          visitor_account_id?: string | null
          visitor_identifier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_visits_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_visits_visitor_account_id_fkey"
            columns: ["visitor_account_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          identifier: string
          purpose: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          identifier: string
          purpose: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          identifier?: string
          purpose?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      lookup_student: {
        Args: { p_student_id: string }
        Returns: {
          faculty_id: string
          full_name: string
        }[]
      }
      mask_student_name: { Args: { p: string }; Returns: string }
      my_student_id: { Args: never; Returns: string }
      my_visitor_check_in: {
        Args: never
        Returns: {
          entry_at: string
          outcome: string
          visit_id: string
        }[]
      }
      my_visitor_check_out: {
        Args: { p_feedback: string; p_rating: number }
        Returns: {
          duration_minutes: number
          outcome: string
        }[]
      }
      student_check_in:
        | {
            Args: {
              p_faculty_id: string
              p_force?: boolean
              p_interest_area: string
              p_student_id: string
              p_student_name: string
            }
            Returns: {
              entry_at: string
              outcome: string
              visit_id: string
            }[]
          }
        | {
            Args: {
              p_faculty_id: string
              p_force?: boolean
              p_gender: string
              p_interest_area: string
              p_student_id: string
              p_student_name: string
            }
            Returns: {
              entry_at: string
              outcome: string
              visit_id: string
            }[]
          }
      student_check_out: {
        Args: {
          p_book_id: string
          p_feedback: string
          p_rating: number
          p_student_id: string
        }
        Returns: {
          duration_minutes: number
          entry_at: string
          exit_at: string
          outcome: string
          visit_id: string
        }[]
      }
      student_scan_status: {
        Args: { p_student_id: string }
        Returns: {
          entry_at: string
          faculty_id: string
          gender: string
          interest_area: string
          last_exit_at: string
          registered: boolean
          state: string
          student_name: string
          visit_id: string
        }[]
      }
      visitor_check_in: {
        Args: {
          p_force?: boolean
          p_full_name: string
          p_identifier: string
          p_specialty: string
        }
        Returns: {
          entry_at: string
          outcome: string
          visit_id: string
        }[]
      }
      visitor_check_out: {
        Args: {
          p_book_id: string
          p_feedback: string
          p_identifier: string
          p_rating: number
        }
        Returns: {
          duration_minutes: number
          entry_at: string
          exit_at: string
          outcome: string
        }[]
      }
      visitor_scan_status: {
        Args: { p_identifier: string }
        Returns: {
          entry_at: string
          full_name: string
          last_exit_at: string
          specialty: string
          state: string
          visit_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
    },
  },
} as const
