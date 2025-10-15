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
      folio_charges: {
        Row: {
          amount_cents: number
          charge_date: string | null
          created_at: string | null
          description: string
          folio_id: string
          id: string
        }
        Insert: {
          amount_cents: number
          charge_date?: string | null
          created_at?: string | null
          description: string
          folio_id: string
          id?: string
        }
        Update: {
          amount_cents?: number
          charge_date?: string | null
          created_at?: string | null
          description?: string
          folio_id?: string
          id?: string
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
            foreignKeyName: "reservations_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
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
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      app_role:
        | "SUPER_ADMIN"
        | "HOTEL_OWNER"
        | "MANAGER"
        | "RECEPTION"
        | "HOUSEKEEPING"
      reservation_status:
        | "PENDING_PAYMENT"
        | "CONFIRMED"
        | "CANCELLED"
        | "EXPIRED"
        | "CHECKED_IN"
        | "CHECKED_OUT"
      room_status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "BLOCKED"
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
      ],
      reservation_status: [
        "PENDING_PAYMENT",
        "CONFIRMED",
        "CANCELLED",
        "EXPIRED",
        "CHECKED_IN",
        "CHECKED_OUT",
      ],
      room_status: ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "BLOCKED"],
    },
  },
} as const
