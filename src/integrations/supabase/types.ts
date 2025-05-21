export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author: string
          content: string
          created_at: string | null
          id: string
          order_id: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string | null
          id?: string
          order_id: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string | null
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          contact_person: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: string | null
          id: string
          order_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          order_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_audit_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          changed_at: string
          details: string | null
          id: string
          order_id: string
          status: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          changed_at?: string
          details?: string | null
          id?: string
          order_id: string
          status: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          changed_at?: string
          details?: string | null
          id?: string
          order_id?: string
          status?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          agent_name: string | null
          amount: number | null
          company_address: string | null
          company_id: string | null
          company_link: string | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          price: number | null
          priority: string | null
          status: string
          status_date: string | null
          updated_at: string | null
        }
        Insert: {
          agent_name?: string | null
          amount?: number | null
          company_address?: string | null
          company_id?: string | null
          company_link?: string | null
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          price?: number | null
          priority?: string | null
          status: string
          status_date?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_name?: string | null
          amount?: number | null
          company_address?: string | null
          company_id?: string | null
          company_link?: string | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          price?: number | null
          priority?: string | null
          status?: string
          status_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          disabled: boolean
          first_name: string
          id: string
          last_name: string
          role: string
          updated_at: string
        }
        Insert: {
          disabled?: boolean
          first_name?: string
          id: string
          last_name?: string
          role?: string
          updated_at?: string
        }
        Update: {
          disabled?: boolean
          first_name?: string
          id?: string
          last_name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          amount: string
          created_at: string
          customer: string
          id: string
          number: string
          reference: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: string
          created_at?: string
          customer: string
          id?: string
          number: string
          reference: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: string
          created_at?: string
          customer?: string
          id?: string
          number?: string
          reference?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: string | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          active_orders_modify: boolean
          active_orders_view: boolean
          cancelled_modify: boolean
          cancelled_view: boolean
          companies_modify: boolean
          companies_view: boolean
          complaints_modify: boolean
          complaints_view: boolean
          completed_modify: boolean
          completed_view: boolean
          created_at: string
          dashboard_access: boolean
          deleted_modify: boolean
          deleted_view: boolean
          id: string
          invoice_paid_modify: boolean
          invoice_paid_view: boolean
          invoice_sent_modify: boolean
          invoice_sent_view: boolean
          reviews_modify: boolean
          reviews_view: boolean
          role: string
          updated_at: string
        }
        Insert: {
          active_orders_modify?: boolean
          active_orders_view?: boolean
          cancelled_modify?: boolean
          cancelled_view?: boolean
          companies_modify?: boolean
          companies_view?: boolean
          complaints_modify?: boolean
          complaints_view?: boolean
          completed_modify?: boolean
          completed_view?: boolean
          created_at?: string
          dashboard_access?: boolean
          deleted_modify?: boolean
          deleted_view?: boolean
          id: string
          invoice_paid_modify?: boolean
          invoice_paid_view?: boolean
          invoice_sent_modify?: boolean
          invoice_sent_view?: boolean
          reviews_modify?: boolean
          reviews_view?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          active_orders_modify?: boolean
          active_orders_view?: boolean
          cancelled_modify?: boolean
          cancelled_view?: boolean
          companies_modify?: boolean
          companies_view?: boolean
          complaints_modify?: boolean
          complaints_view?: boolean
          completed_modify?: boolean
          completed_view?: boolean
          created_at?: string
          dashboard_access?: boolean
          deleted_modify?: boolean
          deleted_view?: boolean
          id?: string
          invoice_paid_modify?: boolean
          invoice_paid_view?: boolean
          invoice_sent_modify?: boolean
          invoice_sent_view?: boolean
          reviews_modify?: boolean
          reviews_view?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          api_key: string | null
          created_at: string | null
          email_alerts_enabled: boolean | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          email_alerts_enabled?: boolean | null
          id: string
          language?: string | null
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          email_alerts_enabled?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_order_status_history: {
        Args: { order_id_param: string }
        Returns: {
          status: string
          changed_at: string
          actor_name: string
          details: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "user" | "admin" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["user", "admin", "agent"],
    },
  },
} as const
