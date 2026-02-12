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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          error_message: string | null
          hotel_id: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          hotel_id: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          hotel_id?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_connections: {
        Row: {
          channel_id: string
          channel_name: string
          created_at: string | null
          credentials: Json | null
          hotel_id: string
          id: string
          last_sync_at: string | null
          settings: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          channel_name: string
          created_at?: string | null
          credentials?: Json | null
          hotel_id: string
          id?: string
          last_sync_at?: string | null
          settings?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          channel_name?: string
          created_at?: string | null
          credentials?: Json | null
          hotel_id?: string
          id?: string
          last_sync_at?: string | null
          settings?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_connections_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_checklists: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          hotel_id: string
          id: string
          items: Json
          notes: string | null
          room_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          hotel_id: string
          id?: string
          items?: Json
          notes?: string | null
          room_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          hotel_id?: string
          id?: string
          items?: Json
          notes?: string | null
          room_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      competitor_rates: {
        Row: {
          competitor_name: string
          competitor_url: string | null
          created_at: string | null
          currency: string | null
          date: string
          hotel_id: string
          id: string
          notes: string | null
          price_cents: number
          room_category: string
          source: string | null
          updated_at: string | null
        }
        Insert: {
          competitor_name: string
          competitor_url?: string | null
          created_at?: string | null
          currency?: string | null
          date: string
          hotel_id: string
          id?: string
          notes?: string | null
          price_cents: number
          room_category: string
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          competitor_name?: string
          competitor_url?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          price_cents?: number
          room_category?: string
          source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_rates_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_logs: {
        Row: {
          accessed_fields: string[] | null
          created_at: string
          data_type: string
          hotel_id: string
          id: string
          ip_address: unknown
          legal_basis: string
          purpose: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          accessed_fields?: string[] | null
          created_at?: string
          data_type: string
          hotel_id: string
          id?: string
          ip_address?: unknown
          legal_basis: string
          purpose: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          accessed_fields?: string[] | null
          created_at?: string
          data_type?: string
          hotel_id?: string
          id?: string
          ip_address?: unknown
          legal_basis?: string
          purpose?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_access_logs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      data_requests: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          data_export: Json | null
          guest_id: string | null
          hotel_id: string
          id: string
          notes: string | null
          rejection_reason: string | null
          request_type: string
          requested_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          data_export?: Json | null
          guest_id?: string | null
          hotel_id: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          request_type: string
          requested_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          data_export?: Json | null
          guest_id?: string | null
          hotel_id?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          request_type?: string
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_requests_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_requests_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          auto_delete: boolean
          created_at: string
          data_type: string
          hotel_id: string
          id: string
          legal_basis: string
          retention_period_days: number
          updated_at: string
        }
        Insert: {
          auto_delete?: boolean
          created_at?: string
          data_type: string
          hotel_id: string
          id?: string
          legal_basis: string
          retention_period_days: number
          updated_at?: string
        }
        Update: {
          auto_delete?: boolean
          created_at?: string
          data_type?: string
          hotel_id?: string
          id?: string
          legal_basis?: string
          retention_period_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_policies_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      folio_charges: {
        Row: {
          amount_cents: number
          charge_category: string | null
          charge_date: string | null
          created_at: string | null
          description: string
          folio_id: string
          id: string
          quantity: number | null
        }
        Insert: {
          amount_cents: number
          charge_category?: string | null
          charge_date?: string | null
          created_at?: string | null
          description: string
          folio_id: string
          id?: string
          quantity?: number | null
        }
        Update: {
          amount_cents?: number
          charge_category?: string | null
          charge_date?: string | null
          created_at?: string | null
          description?: string
          folio_id?: string
          id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "folio_charges_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
        ]
      }
      folios: {
        Row: {
          balance_cents: number | null
          created_at: string | null
          currency: string
          hotel_id: string
          id: string
          reservation_id: string | null
        }
        Insert: {
          balance_cents?: number | null
          created_at?: string | null
          currency: string
          hotel_id: string
          id?: string
          reservation_id?: string | null
        }
        Update: {
          balance_cents?: number | null
          created_at?: string | null
          currency?: string
          hotel_id?: string
          id?: string
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folios_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_notes: {
        Row: {
          created_at: string | null
          guest_id: string
          hotel_id: string
          id: string
          note: string
          note_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_id: string
          hotel_id: string
          id?: string
          note: string
          note_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_id?: string
          hotel_id?: string
          id?: string
          note?: string
          note_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_notes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_notes_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          document_number: string | null
          document_type: string | null
          email: string | null
          hotel_id: string
          id: string
          last_stay_date: string | null
          name: string
          notes: string | null
          phone: string | null
          preferences: Json | null
          total_spent_cents: number | null
          total_stays: number | null
          updated_at: string | null
          vip_status: boolean | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          hotel_id: string
          id?: string
          last_stay_date?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          total_spent_cents?: number | null
          total_stays?: number | null
          updated_at?: string | null
          vip_status?: boolean | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          hotel_id?: string
          id?: string
          last_stay_date?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          total_spent_cents?: number | null
          total_stays?: number | null
          updated_at?: string | null
          vip_status?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          id: string
          name: string
          slug: string
          tax_rate: number | null
          timezone: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          name: string
          slug: string
          tax_rate?: number | null
          timezone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          name?: string
          slug?: string
          tax_rate?: number | null
          timezone?: string | null
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string | null
          hotel_id: string
          key: string
          response: Json
        }
        Insert: {
          created_at?: string | null
          hotel_id: string
          key: string
          response: Json
        }
        Update: {
          created_at?: string | null
          hotel_id?: string
          key?: string
          response?: Json
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_assignment_rules: {
        Row: {
          assigned_role: string
          category: string
          created_at: string | null
          hotel_id: string
          id: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_role: string
          category: string
          created_at?: string | null
          hotel_id: string
          id?: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_role?: string
          category?: string
          created_at?: string | null
          hotel_id?: string
          id?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_assignment_rules_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_history: {
        Row: {
          action: string
          comment: string | null
          created_at: string
          hotel_id: string
          id: string
          incident_id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string
        }
        Insert: {
          action: string
          comment?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          incident_id: string
          new_value?: Json | null
          old_value?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          comment?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          incident_id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_history_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_history_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          description: string
          hotel_id: string
          id: string
          priority: string
          reported_by: string
          resolved_at: string | null
          room_id: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description: string
          hotel_id: string
          id?: string
          priority?: string
          reported_by: string
          resolved_at?: string | null
          room_id?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description?: string
          hotel_id?: string
          id?: string
          priority?: string
          reported_by?: string
          resolved_at?: string | null
          room_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_by_day: {
        Row: {
          created_at: string | null
          day: string
          holds: number
          hotel_id: string
          reserved: number
          room_type_id: string
          total: number
        }
        Insert: {
          created_at?: string | null
          day: string
          holds?: number
          hotel_id: string
          reserved?: number
          room_type_id: string
          total?: number
        }
        Update: {
          created_at?: string | null
          day?: string
          holds?: number
          hotel_id?: string
          reserved?: number
          room_type_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_by_day_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_by_day_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string | null
          current_stock: number
          hotel_id: string
          id: string
          min_stock: number
          name: string
          notes: string | null
          supplier: string | null
          unit: string
          unit_cost_cents: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          current_stock?: number
          hotel_id: string
          id?: string
          min_stock?: number
          name: string
          notes?: string | null
          supplier?: string | null
          unit: string
          unit_cost_cents?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          current_stock?: number
          hotel_id?: string
          id?: string
          min_stock?: number
          name?: string
          notes?: string | null
          supplier?: string | null
          unit?: string
          unit_cost_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          hotel_id: string
          id: string
          item_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          hotel_id: string
          id?: string
          item_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          hotel_id?: string
          id?: string
          item_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          created_at: string | null
          hotel_id: string
          id: string
          min_quantity: number
          name: string
          quantity: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          hotel_id: string
          id?: string
          min_quantity?: number
          name: string
          quantity?: number
          unit?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          hotel_id?: string
          id?: string
          min_quantity?: number
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      monthly_usage: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          month: number
          reservations_count: number
          rooms_count: number
          updated_at: string
          users_count: number
          year: number
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          month: number
          reservations_count?: number
          rooms_count?: number
          updated_at?: string
          users_count?: number
          year: number
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          month?: number
          reservations_count?: number
          rooms_count?: number
          updated_at?: string
          users_count?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_usage_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          message: string
          read: boolean
          related_entity_id: string | null
          related_entity_type: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          message: string
          read?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          message?: string
          read?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          module: string
          resource: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
          resource?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
          resource?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          hotel_id: string
          id: string
          is_active: boolean
          max_uses: number | null
          min_nights: number | null
          times_used: number
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          hotel_id: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_nights?: number | null
          times_used?: number
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          hotel_id?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_nights?: number | null
          times_used?: number
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total_cost_cents: number
          unit_cost_cents: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          total_cost_cents: number
          unit_cost_cents: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total_cost_cents?: number
          unit_cost_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string | null
          created_by: string | null
          expected_delivery_date: string | null
          hotel_id: string
          id: string
          notes: string | null
          order_number: string
          status: string
          supplier: string
          total_amount_cents: number
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          hotel_id: string
          id?: string
          notes?: string | null
          order_number: string
          status?: string
          supplier: string
          total_amount_cents?: number
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          hotel_id?: string
          id?: string
          notes?: string | null
          order_number?: string
          status?: string
          supplier?: string
          total_amount_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_history: {
        Row: {
          created_at: string | null
          date: string
          hotel_id: string
          id: string
          notes: string | null
          occupancy_percent: number | null
          price_cents: number
          rate_plan_id: string | null
          room_type_id: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          hotel_id: string
          id?: string
          notes?: string | null
          occupancy_percent?: number | null
          price_cents: number
          rate_plan_id?: string | null
          room_type_id: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          occupancy_percent?: number | null
          price_cents?: number
          rate_plan_id?: string | null
          room_type_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_history_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_history_rate_plan_id_fkey"
            columns: ["rate_plan_id"]
            isOneToOne: false
            referencedRelation: "rate_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_history_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_plans: {
        Row: {
          created_at: string | null
          description: string | null
          hotel_id: string
          id: string
          is_active: boolean | null
          max_nights: number | null
          min_nights: number | null
          modifier_type: string | null
          modifier_value: number | null
          name: string
          room_type_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean | null
          max_nights?: number | null
          min_nights?: number | null
          modifier_type?: string | null
          modifier_value?: number | null
          name: string
          room_type_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          max_nights?: number | null
          min_nights?: number | null
          modifier_type?: string | null
          modifier_value?: number | null
          name?: string
          room_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_plans_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_plans_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          check_in: string
          check_out: string
          created_at: string | null
          currency: string
          customer: Json
          folio_id: string
          guests: number
          hold_expires_at: string | null
          hotel_id: string
          id: string
          metadata: Json | null
          payment_intent_id: string | null
          rate_plan_id: string | null
          room_id: string | null
          room_type_id: string
          status: Database["public"]["Enums"]["reservation_status"] | null
          total_amount_cents: number
          updated_at: string | null
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string | null
          currency: string
          customer: Json
          folio_id: string
          guests: number
          hold_expires_at?: string | null
          hotel_id: string
          id?: string
          metadata?: Json | null
          payment_intent_id?: string | null
          rate_plan_id?: string | null
          room_id?: string | null
          room_type_id: string
          status?: Database["public"]["Enums"]["reservation_status"] | null
          total_amount_cents: number
          updated_at?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string | null
          currency?: string
          customer?: Json
          folio_id?: string
          guests?: number
          hold_expires_at?: string | null
          hotel_id?: string
          id?: string
          metadata?: Json | null
          payment_intent_id?: string | null
          rate_plan_id?: string | null
          room_id?: string | null
          room_type_id?: string
          status?: Database["public"]["Enums"]["reservation_status"] | null
          total_amount_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_rate_plan_id_fkey"
            columns: ["rate_plan_id"]
            isOneToOne: false
            referencedRelation: "rate_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_settings: {
        Row: {
          competitor_weight: number | null
          created_at: string | null
          enable_dynamic_pricing: boolean | null
          hotel_id: string
          max_price_threshold_percent: number | null
          min_price_threshold_percent: number | null
          occupancy_weight: number | null
          track_competitors: Json | null
          updated_at: string | null
        }
        Insert: {
          competitor_weight?: number | null
          created_at?: string | null
          enable_dynamic_pricing?: boolean | null
          hotel_id: string
          max_price_threshold_percent?: number | null
          min_price_threshold_percent?: number | null
          occupancy_weight?: number | null
          track_competitors?: Json | null
          updated_at?: string | null
        }
        Update: {
          competitor_weight?: number | null
          created_at?: string | null
          enable_dynamic_pricing?: boolean | null
          hotel_id?: string
          max_price_threshold_percent?: number | null
          min_price_threshold_percent?: number | null
          occupancy_weight?: number | null
          track_competitors?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_settings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: true
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      room_locks: {
        Row: {
          created_at: string | null
          day: string
          hotel_id: string
          reservation_id: string
          room_id: string
        }
        Insert: {
          created_at?: string | null
          day: string
          hotel_id: string
          reservation_id: string
          room_id: string
        }
        Update: {
          created_at?: string | null
          day?: string
          hotel_id?: string
          reservation_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_locks_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_locks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          base_occupancy: number | null
          base_price_cents: number
          created_at: string | null
          description: string | null
          hotel_id: string
          id: string
          max_occupancy: number | null
          name: string
        }
        Insert: {
          base_occupancy?: number | null
          base_price_cents: number
          created_at?: string | null
          description?: string | null
          hotel_id: string
          id?: string
          max_occupancy?: number | null
          name: string
        }
        Update: {
          base_occupancy?: number | null
          base_price_cents?: number
          created_at?: string | null
          description?: string | null
          hotel_id?: string
          id?: string
          max_occupancy?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string | null
          floor: number | null
          hotel_id: string
          id: string
          room_number: string
          room_type_id: string
          status: Database["public"]["Enums"]["room_status"] | null
        }
        Insert: {
          created_at?: string | null
          floor?: number | null
          hotel_id: string
          id?: string
          room_number: string
          room_type_id: string
          status?: Database["public"]["Enums"]["room_status"] | null
        }
        Update: {
          created_at?: string | null
          floor?: number | null
          hotel_id?: string
          id?: string
          room_number?: string
          room_type_id?: string
          status?: Database["public"]["Enums"]["room_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          full_name: string
          hotel_id: string
          id: string
          invitation_token: string | null
          invited_by: string
          phone: string | null
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          full_name: string
          hotel_id: string
          id?: string
          invitation_token?: string | null
          invited_by: string
          phone?: string | null
          role: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          full_name?: string
          hotel_id?: string
          id?: string
          invitation_token?: string | null
          invited_by?: string
          phone?: string | null
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          failure_code: string | null
          failure_message: string | null
          folio_id: string
          hotel_id: string
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          payment_method_type: string | null
          receipt_email: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          failure_code?: string | null
          failure_message?: string | null
          folio_id: string
          hotel_id: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          payment_method_type?: string | null
          receipt_email?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          failure_code?: string | null
          failure_message?: string | null
          folio_id?: string
          hotel_id?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          payment_method_type?: string | null
          receipt_email?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_payments_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_payments_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_refunds: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          failure_reason: string | null
          folio_id: string
          hotel_id: string
          id: string
          metadata: Json | null
          notes: string | null
          payment_id: string
          processed_by: string | null
          reason: Database["public"]["Enums"]["refund_reason"]
          receipt_number: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["refund_status"]
          stripe_charge_id: string | null
          stripe_payment_intent_id: string
          stripe_refund_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          failure_reason?: string | null
          folio_id: string
          hotel_id: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_id: string
          processed_by?: string | null
          reason?: Database["public"]["Enums"]["refund_reason"]
          receipt_number?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent_id: string
          stripe_refund_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          failure_reason?: string | null
          folio_id?: string
          hotel_id?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_id?: string
          processed_by?: string | null
          reason?: Database["public"]["Enums"]["refund_reason"]
          receipt_number?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string
          stripe_refund_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_refunds_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_refunds_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "stripe_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          changed_by: string | null
          created_at: string
          hotel_id: string
          id: string
          metadata: Json | null
          new_plan: Database["public"]["Enums"]["plan_type"]
          new_status: Database["public"]["Enums"]["subscription_status"]
          old_plan: Database["public"]["Enums"]["plan_type"] | null
          old_status: Database["public"]["Enums"]["subscription_status"] | null
          reason: string | null
          subscription_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          metadata?: Json | null
          new_plan: Database["public"]["Enums"]["plan_type"]
          new_status: Database["public"]["Enums"]["subscription_status"]
          old_plan?: Database["public"]["Enums"]["plan_type"] | null
          old_status?: Database["public"]["Enums"]["subscription_status"] | null
          reason?: string | null
          subscription_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          metadata?: Json | null
          new_plan?: Database["public"]["Enums"]["plan_type"]
          new_status?: Database["public"]["Enums"]["subscription_status"]
          old_plan?: Database["public"]["Enums"]["plan_type"] | null
          old_status?: Database["public"]["Enums"]["subscription_status"] | null
          reason?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          hotel_id: string
          id: string
          plan: Database["public"]["Enums"]["plan_type"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          trial_used: boolean
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end: string
          current_period_start?: string
          hotel_id: string
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_used?: boolean
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          hotel_id?: string
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_used?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: true
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          hotel_id: string
          id: string
          notes: string | null
          priority: string
          room_id: string | null
          status: string
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          hotel_id: string
          id?: string
          notes?: string | null
          priority?: string
          room_id?: string | null
          status?: string
          task_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          hotel_id?: string
          id?: string
          notes?: string | null
          priority?: string
          room_id?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_text: string
          consent_type: string
          expires_at: string | null
          granted: boolean
          granted_at: string
          guest_id: string | null
          hotel_id: string
          id: string
          ip_address: unknown
          revoked_at: string | null
          user_id: string | null
          version: string
        }
        Insert: {
          consent_text: string
          consent_type: string
          expires_at?: string | null
          granted: boolean
          granted_at?: string
          guest_id?: string | null
          hotel_id: string
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          user_id?: string | null
          version?: string
        }
        Update: {
          consent_text?: string
          consent_type?: string
          expires_at?: string | null
          granted?: boolean
          granted_at?: string
          guest_id?: string | null
          hotel_id?: string
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          user_id?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          expires_at: string | null
          granted: boolean
          granted_at: string
          granted_by: string | null
          hotel_id: string
          id: string
          permission_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted?: boolean
          granted_at?: string
          granted_by?: string | null
          hotel_id: string
          id?: string
          permission_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted?: boolean
          granted_at?: string
          granted_by?: string | null
          hotel_id?: string
          id?: string
          permission_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          hotel_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hotel_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          hotel_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_roles_with_profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          hotel_id: string | null
          id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_optimal_rate: {
        Args: { p_date?: string; p_hotel_id: string; p_room_type_id: string }
        Returns: Json
      }
      check_no_shows: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_hotel_id: string
          p_message: string
          p_role?: Database["public"]["Enums"]["app_role"]
          p_title: string
          p_type?: string
          p_user_id?: string
        }
        Returns: string
      }
      get_occupancy_stats: { Args: { hotel_id_param: string }; Returns: Json }
      get_user_role: {
        Args: { _hotel_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_hotel_access: {
        Args: { _hotel_id: string; _user_id: string }
        Returns: boolean
      }
      has_hotel_role: {
        Args: {
          _hotel_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: {
          _action: string
          _hotel_id: string
          _module: string
          _resource?: string
          _user_id: string
        }
        Returns: boolean
      }
      increment_inventory_holds: {
        Args: {
          p_day: string
          p_delta: number
          p_hotel_id: string
          p_room_type_id: string
        }
        Returns: undefined
      }
      increment_inventory_reserved: {
        Args: {
          p_day: string
          p_delta: number
          p_hotel_id: string
          p_room_type_id: string
        }
        Returns: undefined
      }
      log_data_access: {
        Args: {
          _accessed_fields: string[]
          _data_type: string
          _hotel_id: string
          _legal_basis?: string
          _purpose: string
          _subject_id: string
        }
        Returns: undefined
      }
      notify_upcoming_arrivals: { Args: never; Returns: undefined }
      notify_upcoming_departures: { Args: never; Returns: undefined }
      update_folio_balance: {
        Args: { p_amount_cents: number; p_folio_id: string }
        Returns: undefined
      }
      update_monthly_usage: {
        Args: { p_hotel_id: string; p_increment?: number; p_resource: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "SUPER_ADMIN"
        | "HOTEL_OWNER"
        | "MANAGER"
        | "RECEPTION"
        | "HOUSEKEEPING"
        | "SALES"
      payment_status:
        | "PENDING"
        | "PROCESSING"
        | "SUCCEEDED"
        | "FAILED"
        | "CANCELED"
        | "REQUIRES_ACTION"
      plan_type: "FREE" | "BASIC" | "PRO" | "ENTERPRISE"
      refund_reason:
        | "DUPLICATE"
        | "FRAUDULENT"
        | "REQUESTED_BY_CUSTOMER"
        | "CANCELED_RESERVATION"
        | "OTHER"
      refund_status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED"
      reservation_status:
        | "PENDING_PAYMENT"
        | "CONFIRMED"
        | "CANCELLED"
        | "EXPIRED"
        | "CHECKED_IN"
        | "CHECKED_OUT"
      room_status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "BLOCKED"
      subscription_status:
        | "TRIAL"
        | "ACTIVE"
        | "PAST_DUE"
        | "CANCELED"
        | "INCOMPLETE"
        | "INCOMPLETE_EXPIRED"
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
      app_role: [
        "SUPER_ADMIN",
        "HOTEL_OWNER",
        "MANAGER",
        "RECEPTION",
        "HOUSEKEEPING",
        "SALES",
      ],
      payment_status: [
        "PENDING",
        "PROCESSING",
        "SUCCEEDED",
        "FAILED",
        "CANCELED",
        "REQUIRES_ACTION",
      ],
      plan_type: ["FREE", "BASIC", "PRO", "ENTERPRISE"],
      refund_reason: [
        "DUPLICATE",
        "FRAUDULENT",
        "REQUESTED_BY_CUSTOMER",
        "CANCELED_RESERVATION",
        "OTHER",
      ],
      refund_status: ["PENDING", "SUCCEEDED", "FAILED", "CANCELED"],
      reservation_status: [
        "PENDING_PAYMENT",
        "CONFIRMED",
        "CANCELLED",
        "EXPIRED",
        "CHECKED_IN",
        "CHECKED_OUT",
      ],
      room_status: ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "BLOCKED"],
      subscription_status: [
        "TRIAL",
        "ACTIVE",
        "PAST_DUE",
        "CANCELED",
        "INCOMPLETE",
        "INCOMPLETE_EXPIRED",
      ],
    },
  },
} as const
