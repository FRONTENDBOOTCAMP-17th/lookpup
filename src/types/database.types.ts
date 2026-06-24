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
      applications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          proposed_price: number | null
          request_id: string
          sitter_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          proposed_price?: number | null
          request_id: string
          sitter_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          proposed_price?: number | null
          request_id?: string
          sitter_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      care_records: {
        Row: {
          content: string
          created_at: string
          fields: Json
          id: string
          image_urls: string[]
          reservation_id: string
          service_type: string | null
          sitter_id: string
          status_text: string
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          fields?: Json
          id?: string
          image_urls?: string[]
          reservation_id: string
          service_type?: string | null
          sitter_id: string
          status_text: string
          title: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string
          fields?: Json
          id?: string
          image_urls?: string[]
          reservation_id?: string
          service_type?: string | null
          sitter_id?: string
          status_text?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_records_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_records_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          application_id: string | null
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          owner_id: string
          owner_left: boolean
          request_id: string | null
          reservation_id: string | null
          room_type: string
          sitter_id: string
          sitter_left: boolean
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          owner_id: string
          owner_left?: boolean
          request_id?: string | null
          reservation_id?: string | null
          room_type?: string
          sitter_id: string
          sitter_left?: boolean
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          owner_id?: string
          owner_left?: boolean
          request_id?: string | null
          reservation_id?: string | null
          room_type?: string
          sitter_id?: string
          sitter_left?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_charges: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          owner_id: string
          payment_id: string | null
          reason: string
          requested_at: string | null
          reservation_id: string
          responded_at: string | null
          sitter_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          owner_id: string
          payment_id?: string | null
          reason: string
          requested_at?: string | null
          reservation_id: string
          responded_at?: string | null
          sitter_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          owner_id?: string
          payment_id?: string | null
          reason?: string
          requested_at?: string | null
          reservation_id?: string
          responded_at?: string | null
          sitter_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_extra_charges_owner"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_extra_charges_payment"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_extra_charges_reservation"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_extra_charges_sitter"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean
          room_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean
          room_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean
          room_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean
          link_url: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean
          link_url?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean
          link_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          auto_confirm_at: string | null
          canceled_amount: number
          canceled_at: string | null
          created_at: string | null
          fee_rate: number
          id: string
          owner_id: string
          paid_at: string | null
          pay_method: string
          platform_fee: number
          receipt_url: string | null
          reservation_id: string
          settle_amount: number
          settled_at: string | null
          sitter_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          auto_confirm_at?: string | null
          canceled_amount?: number
          canceled_at?: string | null
          created_at?: string | null
          fee_rate?: number
          id: string
          owner_id: string
          paid_at?: string | null
          pay_method: string
          platform_fee?: number
          receipt_url?: string | null
          reservation_id: string
          settle_amount?: number
          settled_at?: string | null
          sitter_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          auto_confirm_at?: string | null
          canceled_amount?: number
          canceled_at?: string | null
          created_at?: string | null
          fee_rate?: number
          id?: string
          owner_id?: string
          paid_at?: string | null
          pay_method?: string
          platform_fee?: number
          receipt_url?: string | null
          reservation_id?: string
          settle_amount?: number
          settled_at?: string | null
          sitter_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age: number | null
          animal_type: string
          breed: string | null
          caution: string | null
          created_at: string | null
          deleted_at: string | null
          gender: string
          id: string
          image_url: string | null
          name: string
          owner_id: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          animal_type: string
          breed?: string | null
          caution?: string | null
          created_at?: string | null
          deleted_at?: string | null
          gender: string
          id?: string
          image_url?: string | null
          name: string
          owner_id: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          animal_type?: string
          breed?: string | null
          caution?: string | null
          created_at?: string | null
          deleted_at?: string | null
          gender?: string
          id?: string
          image_url?: string | null
          name?: string
          owner_id?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_memo: string | null
          content: string | null
          created_at: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          image_urls: string[] | null
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          admin_memo?: string | null
          content?: string | null
          created_at?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          image_urls?: string[] | null
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          admin_memo?: string | null
          content?: string | null
          created_at?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          image_urls?: string[] | null
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          budget: number | null
          content: string | null
          created_at: string | null
          end_datetime: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          owner_id: string
          pet_id: string | null
          request_type: string | null
          sitter_conditions: string[]
          start_datetime: string | null
          status: string
          title: string
          updated_at: string | null
          view_count: number
        }
        Insert: {
          budget?: number | null
          content?: string | null
          created_at?: string | null
          end_datetime?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          owner_id: string
          pet_id?: string | null
          request_type?: string | null
          sitter_conditions?: string[]
          start_datetime?: string | null
          status?: string
          title: string
          updated_at?: string | null
          view_count?: number
        }
        Update: {
          budget?: number | null
          content?: string | null
          created_at?: string | null
          end_datetime?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          owner_id?: string
          pet_id?: string | null
          request_type?: string | null
          sitter_conditions?: string[]
          start_datetime?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_items: {
        Row: {
          id: string
          pet_id: string
          reservation_id: string
        }
        Insert: {
          id?: string
          pet_id: string
          reservation_id: string
        }
        Update: {
          id?: string
          pet_id?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_items_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_items_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          accepted_at: string | null
          application_id: string | null
          cancel_reason: string | null
          canceled_at: string | null
          completed_at: string | null
          created_at: string | null
          end_datetime: string | null
          id: string
          memo: string | null
          owner_id: string
          paid_at: string | null
          request_id: string | null
          service_id: string | null
          sitter_id: string
          start_datetime: string | null
          started_at: string | null
          status: string
          total_price: number
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          application_id?: string | null
          cancel_reason?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          end_datetime?: string | null
          id?: string
          memo?: string | null
          owner_id: string
          paid_at?: string | null
          request_id?: string | null
          service_id?: string | null
          sitter_id: string
          start_datetime?: string | null
          started_at?: string | null
          status?: string
          total_price: number
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          application_id?: string | null
          cancel_reason?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          end_datetime?: string | null
          id?: string
          memo?: string | null
          owner_id?: string
          paid_at?: string | null
          request_id?: string | null
          service_id?: string | null
          sitter_id?: string
          start_datetime?: string | null
          started_at?: string | null
          status?: string
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          owner_id: string
          rating: number
          reservation_id: string
          sitter_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          owner_id: string
          rating: number
          reservation_id: string
          sitter_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          owner_id?: string
          rating?: number
          reservation_id?: string
          sitter_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          animal_type: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          price: number
          service_type: string
          sitter_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          animal_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          price?: number
          service_type: string
          sitter_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          animal_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          price?: number
          service_type?: string
          sitter_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      sitters: {
        Row: {
          activity_photo_urls: string[]
          available_animals: string[]
          available_area: string | null
          base_price: number | null
          career: string | null
          certificate_urls: string[]
          created_at: string | null
          display_area: string | null
          id: string
          introduction: string | null
          latitude: number | null
          longitude: number | null
          rating: number | null
          request_type: string[]
          service_radius_km: number | null
          status: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_photo_urls?: string[]
          available_animals?: string[]
          available_area?: string | null
          base_price?: number | null
          career?: string | null
          certificate_urls?: string[]
          created_at?: string | null
          display_area?: string | null
          id?: string
          introduction?: string | null
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          request_type?: string[]
          service_radius_km?: number | null
          status?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_photo_urls?: string[]
          available_animals?: string[]
          available_area?: string | null
          base_price?: number | null
          career?: string | null
          certificate_urls?: string[]
          created_at?: string | null
          display_area?: string | null
          id?: string
          introduction?: string | null
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          request_type?: string[]
          service_radius_km?: number | null
          status?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sitters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          birthdate: string | null
          created_at: string | null
          delete_reason: string | null
          deleted_at: string | null
          display_area: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_verified: boolean
          latitude: number | null
          location_consent: boolean
          longitude: number | null
          phone_number: string | null
          profile_image: string | null
          provider: string
          role: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birthdate?: string | null
          created_at?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          display_area?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_verified?: boolean
          latitude?: number | null
          location_consent?: boolean
          longitude?: number | null
          phone_number?: string | null
          profile_image?: string | null
          provider: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birthdate?: string | null
          created_at?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          display_area?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          location_consent?: boolean
          longitude?: number | null
          phone_number?: string | null
          profile_image?: string | null
          provider?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_unread_counts: {
        Args: { room_ids: string[]; my_id: string }
        Returns: { room_id: string; count: number }[]
      }
      get_petsitter_detail: { Args: { p_sitter_id: string }; Returns: Json }
      get_petsitters_for_map: {
        Args: never
        Returns: {
          available_area: string
          base_price: number
          display_area: string
          full_name: string
          id: string
          latitude: number
          longitude: number
          rating: number
          service_radius_km: number
          service_types: string[]
        }[]
      }
      get_unread_counts: {
        Args: { my_id: string; room_ids: string[] }
        Returns: {
          count: number
          room_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
