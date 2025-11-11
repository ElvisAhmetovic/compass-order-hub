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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          points: number | null
          tier: string
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          points?: number | null
          tier: string
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number | null
          tier?: string
        }
        Relationships: []
      }
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
      background_templates: {
        Row: {
          background_image: string
          created_at: string
          global_font_settings: Json
          height: number
          id: string
          name: string
          updated_at: string
          user_id: string
          width: number
        }
        Insert: {
          background_image: string
          created_at?: string
          global_font_settings?: Json
          height?: number
          id?: string
          name: string
          updated_at?: string
          user_id: string
          width?: number
        }
        Update: {
          background_image?: string
          created_at?: string
          global_font_settings?: Json
          height?: number
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          width?: number
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendees: string[] | null
          created_at: string
          created_by: string
          created_by_name: string
          description: string | null
          end_date: string
          id: string
          location: string | null
          order_id: string | null
          start_date: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          attendees?: string[] | null
          created_at?: string
          created_by: string
          created_by_name: string
          description?: string | null
          end_date: string
          id?: string
          location?: string | null
          order_id?: string | null
          start_date: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          attendees?: string[] | null
          created_at?: string
          created_by?: string
          created_by_name?: string
          description?: string | null
          end_date?: string
          id?: string
          location?: string | null
          order_id?: string | null
          start_date?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          order_id: string | null
          participants: string[] | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          order_id?: string | null
          participants?: string[] | null
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          order_id?: string | null
          participants?: string[] | null
          type?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          tax_id: string | null
          updated_at: string
          user_id: string | null
          vat_id: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
          vat_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
          vat_id?: string | null
          zip_code?: string | null
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
          map_link: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          contact_person: string
          created_at?: string
          email: string
          id?: string
          map_link?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          map_link?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      file_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string | null
          task_id: string | null
          uploaded_by: string
          uploaded_by_name: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
          task_id?: string | null
          uploaded_by: string
          uploaded_by_name: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
          task_id?: string | null
          uploaded_by?: string
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          buying_price: string | null
          buying_price_gross: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          internal_note: string | null
          last_booking: string | null
          name: string
          price: string
          price_gross: string | null
          stock: number
          unit: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          buying_price?: string | null
          buying_price_gross?: string | null
          category: string
          created_at?: string
          description?: string | null
          id: string
          internal_note?: string | null
          last_booking?: string | null
          name: string
          price: string
          price_gross?: string | null
          stock?: number
          unit?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          buying_price?: string | null
          buying_price_gross?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          internal_note?: string | null
          last_booking?: string | null
          name?: string
          price?: string
          price_gross?: string | null
          stock?: number
          unit?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          created_at: string
          discount_rate: number
          id: string
          invoice_id: string
          item_description: string
          line_total: number
          quantity: number
          unit: string | null
          unit_price: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          created_at?: string
          discount_rate?: number
          id?: string
          invoice_id: string
          item_description: string
          line_total?: number
          quantity?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          created_at?: string
          discount_rate?: number
          id?: string
          invoice_id?: string
          item_description?: string
          line_total?: number
          quantity?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_sequences: {
        Row: {
          created_at: string
          id: string
          last_sequence: number
          prefix: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_sequence?: number
          prefix?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          last_sequence?: number
          prefix?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          currency: string
          due_date: string
          id: string
          internal_notes: string | null
          invoice_number: string
          issue_date: string
          net_amount: number
          notes: string | null
          payment_terms: string | null
          proposal_id: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          vat_amount: number
        }
        Insert: {
          client_id: string
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          internal_notes?: string | null
          invoice_number: string
          issue_date?: string
          net_amount?: number
          notes?: string | null
          payment_terms?: string | null
          proposal_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
          vat_amount?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          issue_date?: string
          net_amount?: number
          notes?: string | null
          payment_terms?: string | null
          proposal_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          order_id: string | null
          reply_to: string | null
          sender_id: string
          sender_name: string
          sender_role: string
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          order_id?: string | null
          reply_to?: string | null
          sender_id: string
          sender_name: string
          sender_role: string
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          order_id?: string | null
          reply_to?: string | null
          sender_id?: string
          sender_name?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          changed_by_id: string | null
          changed_by_name: string
          created_at: string
          email_error: string | null
          email_sent: boolean
          email_subject: string
          id: string
          new_status: string | null
          old_status: string | null
          order_id: string
          recipient_emails: string[]
          sent_at: string | null
          status_change: string
        }
        Insert: {
          changed_by_id?: string | null
          changed_by_name: string
          created_at?: string
          email_error?: string | null
          email_sent?: boolean
          email_subject: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          order_id: string
          recipient_emails: string[]
          sent_at?: string | null
          status_change: string
        }
        Update: {
          changed_by_id?: string | null
          changed_by_name?: string
          created_at?: string
          email_error?: string | null
          email_sent?: boolean
          email_subject?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          order_id?: string
          recipient_emails?: string[]
          sent_at?: string | null
          status_change?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          notify_on_status_cancelled: boolean
          notify_on_status_complaint: boolean
          notify_on_status_created: boolean
          notify_on_status_deleted: boolean
          notify_on_status_facebook: boolean
          notify_on_status_google_deletion: boolean
          notify_on_status_in_progress: boolean
          notify_on_status_instagram: boolean
          notify_on_status_invoice_paid: boolean
          notify_on_status_invoice_sent: boolean
          notify_on_status_resolved: boolean
          notify_on_status_review: boolean
          notify_on_status_trustpilot: boolean
          notify_on_status_trustpilot_deletion: boolean
          recipient_emails: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          notify_on_status_cancelled?: boolean
          notify_on_status_complaint?: boolean
          notify_on_status_created?: boolean
          notify_on_status_deleted?: boolean
          notify_on_status_facebook?: boolean
          notify_on_status_google_deletion?: boolean
          notify_on_status_in_progress?: boolean
          notify_on_status_instagram?: boolean
          notify_on_status_invoice_paid?: boolean
          notify_on_status_invoice_sent?: boolean
          notify_on_status_resolved?: boolean
          notify_on_status_review?: boolean
          notify_on_status_trustpilot?: boolean
          notify_on_status_trustpilot_deletion?: boolean
          recipient_emails?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          notify_on_status_cancelled?: boolean
          notify_on_status_complaint?: boolean
          notify_on_status_created?: boolean
          notify_on_status_deleted?: boolean
          notify_on_status_facebook?: boolean
          notify_on_status_google_deletion?: boolean
          notify_on_status_in_progress?: boolean
          notify_on_status_instagram?: boolean
          notify_on_status_invoice_paid?: boolean
          notify_on_status_invoice_sent?: boolean
          notify_on_status_resolved?: boolean
          notify_on_status_review?: boolean
          notify_on_status_trustpilot?: boolean
          notify_on_status_trustpilot_deletion?: boolean
          recipient_emails?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          order_id: string | null
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          order_id?: string | null
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          order_id?: string | null
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
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
          assigned_to: string | null
          assigned_to_name: string | null
          company_address: string | null
          company_id: string | null
          company_link: string | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          id: string
          internal_notes: string | null
          inventory_items: string | null
          is_yearly_package: boolean | null
          price: number | null
          priority: string | null
          status: string
          status_cancelled: boolean | null
          status_complaint: boolean | null
          status_created: boolean | null
          status_date: string | null
          status_deleted: boolean | null
          status_facebook: boolean | null
          status_google_deletion: boolean | null
          status_in_progress: boolean | null
          status_instagram: boolean | null
          status_invoice_paid: boolean | null
          status_invoice_sent: boolean | null
          status_resolved: boolean | null
          status_review: boolean | null
          status_trustpilot: boolean | null
          status_trustpilot_deletion: boolean | null
          updated_at: string | null
        }
        Insert: {
          agent_name?: string | null
          amount?: number | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          company_address?: string | null
          company_id?: string | null
          company_link?: string | null
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          inventory_items?: string | null
          is_yearly_package?: boolean | null
          price?: number | null
          priority?: string | null
          status: string
          status_cancelled?: boolean | null
          status_complaint?: boolean | null
          status_created?: boolean | null
          status_date?: string | null
          status_deleted?: boolean | null
          status_facebook?: boolean | null
          status_google_deletion?: boolean | null
          status_in_progress?: boolean | null
          status_instagram?: boolean | null
          status_invoice_paid?: boolean | null
          status_invoice_sent?: boolean | null
          status_resolved?: boolean | null
          status_review?: boolean | null
          status_trustpilot?: boolean | null
          status_trustpilot_deletion?: boolean | null
          updated_at?: string | null
        }
        Update: {
          agent_name?: string | null
          amount?: number | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          company_address?: string | null
          company_id?: string | null
          company_link?: string | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          inventory_items?: string | null
          is_yearly_package?: boolean | null
          price?: number | null
          priority?: string | null
          status?: string
          status_cancelled?: boolean | null
          status_complaint?: boolean | null
          status_created?: boolean | null
          status_date?: string | null
          status_deleted?: boolean | null
          status_facebook?: boolean | null
          status_google_deletion?: boolean | null
          status_in_progress?: boolean | null
          status_instagram?: boolean | null
          status_invoice_paid?: boolean | null
          status_invoice_sent?: boolean | null
          status_resolved?: boolean | null
          status_review?: boolean | null
          status_trustpilot?: boolean | null
          status_trustpilot_deletion?: boolean | null
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
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      reactions: {
        Row: {
          created_at: string | null
          emoji: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      support_inquiries: {
        Row: {
          created_at: string | null
          id: string
          message: string
          status: string
          subject: string
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      support_replies: {
        Row: {
          created_at: string | null
          id: string
          inquiry_id: string
          message: string
          user_id: string
          user_name: string
          user_role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inquiry_id: string
          message: string
          user_id: string
          user_name: string
          user_role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inquiry_id?: string
          message?: string
          user_id?: string
          user_name?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_replies_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "support_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_by_name: string | null
          assigned_to: string | null
          assigned_to_name: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          order_id: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_by_name?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_id?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_by_name?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          data: Json
          id: string
          user_id: string
          user_name: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          data?: Json
          id?: string
          user_id: string
          user_name: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          data?: Json
          id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      tech_support_tickets: {
        Row: {
          action_needed: string
          attachment_name: string | null
          attachment_url: string | null
          company_name: string
          created_at: string
          created_by: string | null
          created_by_name: string
          id: string
          problem_description: string
          status: string
          updated_at: string
        }
        Insert: {
          action_needed: string
          attachment_name?: string | null
          attachment_url?: string | null
          company_name: string
          created_at?: string
          created_by?: string | null
          created_by_name: string
          id?: string
          problem_description: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_needed?: string
          attachment_name?: string | null
          attachment_url?: string | null
          company_name?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string
          id?: string
          problem_description?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_fields: {
        Row: {
          calculation: string | null
          created_at: string
          default_value: string | null
          field_type: string
          font_settings: Json
          height: number
          id: string
          label: string
          required: boolean
          template_id: string
          updated_at: string
          width: number
          x: number
          y: number
        }
        Insert: {
          calculation?: string | null
          created_at?: string
          default_value?: string | null
          field_type: string
          font_settings?: Json
          height: number
          id?: string
          label: string
          required?: boolean
          template_id: string
          updated_at?: string
          width: number
          x: number
          y: number
        }
        Update: {
          calculation?: string | null
          created_at?: string
          default_value?: string | null
          field_type?: string
          font_settings?: Json
          height?: number
          id?: string
          label?: string
          required?: boolean
          template_id?: string
          updated_at?: string
          width?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "background_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          created_at: string
          height: number | null
          id: string
          mime_type: string
          original_name: string
          path: string
          size_bytes: number
          ticket_id: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          mime_type: string
          original_name: string
          path: string
          size_bytes: number
          ticket_id: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string
          original_name?: string
          path?: string
          size_bytes?: number
          ticket_id?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tech_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
        ]
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
          data_encryption_enabled: boolean | null
          email_alerts_enabled: boolean | null
          id: string
          language: string | null
          max_concurrent_sessions: number | null
          notifications_enabled: boolean | null
          session_timeout_minutes: number | null
          theme: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          data_encryption_enabled?: boolean | null
          email_alerts_enabled?: boolean | null
          id: string
          language?: string | null
          max_concurrent_sessions?: number | null
          notifications_enabled?: boolean | null
          session_timeout_minutes?: number | null
          theme?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          data_encryption_enabled?: boolean | null
          email_alerts_enabled?: boolean | null
          id?: string
          language?: string | null
          max_concurrent_sessions?: number | null
          notifications_enabled?: boolean | null
          session_timeout_minutes?: number | null
          theme?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          last_order_date: string | null
          longest_streak: number | null
          streak_freezes_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          last_order_date?: string | null
          longest_streak?: number | null
          streak_freezes_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          last_order_date?: string | null
          longest_streak?: number | null
          streak_freezes_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_line_total: {
        Args: {
          discount_rate_param?: number
          quantity_param: number
          unit_price_param: number
          vat_rate_param?: number
        }
        Returns: number
      }
      generate_invoice_number: {
        Args: { prefix_param?: string }
        Returns: string
      }
      get_auth_user_role: { Args: never; Returns: string }
      get_order_status_history: {
        Args: { order_id_param: string }
        Returns: {
          actor_name: string
          changed_at: string
          details: string
          status: string
        }[]
      }
      get_user_role:
        | { Args: { user_id: string }; Returns: string }
        | { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      recalculate_invoice_totals: {
        Args: { invoice_id_param: string }
        Returns: undefined
      }
      restore_order: { Args: { order_id_param: string }; Returns: undefined }
      soft_delete_order: {
        Args: { order_id_param: string }
        Returns: undefined
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
      user_role: ["user", "admin", "agent"],
    },
  },
} as const
