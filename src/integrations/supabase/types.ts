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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      answer_submissions: {
        Row: {
          created_at: string
          id: string
          is_final: boolean
          player_id: string
          resolved: boolean
          room_id: string
          round_no: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_final?: boolean
          player_id: string
          resolved?: boolean
          room_id: string
          round_no: number
        }
        Update: {
          created_at?: string
          id?: string
          is_final?: boolean
          player_id?: string
          resolved?: boolean
          room_id?: string
          round_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "answer_submissions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_submissions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          answer: string
          correct: boolean
          created_at: string
          explanation: string | null
          id: string
          nickname: string
          player_id: string
          room_id: string
          round_no: number
        }
        Insert: {
          answer: string
          correct: boolean
          created_at?: string
          explanation?: string | null
          id?: string
          nickname: string
          player_id: string
          room_id: string
          round_no: number
        }
        Update: {
          answer?: string
          correct?: boolean
          created_at?: string
          explanation?: string | null
          id?: string
          nickname?: string
          player_id?: string
          room_id?: string
          round_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "attempts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      football_careers: {
        Row: {
          club_id: string
          end_date: string | null
          evidence: Json | null
          evidence_license: string | null
          id: string
          player_id: string
          reported_appearances: number | null
          retrieved_at: string
          review_method: string | null
          review_status: string
          source_url: string
          start_date: string | null
          verified_source_url: string | null
        }
        Insert: {
          club_id: string
          end_date?: string | null
          evidence?: Json | null
          evidence_license?: string | null
          id: string
          player_id: string
          reported_appearances?: number | null
          retrieved_at: string
          review_method?: string | null
          review_status?: string
          source_url: string
          start_date?: string | null
          verified_source_url?: string | null
        }
        Update: {
          club_id?: string
          end_date?: string | null
          evidence?: Json | null
          evidence_license?: string | null
          id?: string
          player_id?: string
          reported_appearances?: number | null
          retrieved_at?: string
          review_method?: string | null
          review_status?: string
          source_url?: string
          start_date?: string | null
          verified_source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "football_careers_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "football_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "football_careers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "football_players"
            referencedColumns: ["id"]
          },
        ]
      }
      football_clubs: {
        Row: {
          country_code: string
          id: string
          license: string
          name: string
          source_url: string
        }
        Insert: {
          country_code: string
          id: string
          license?: string
          name: string
          source_url: string
        }
        Update: {
          country_code?: string
          id?: string
          license?: string
          name?: string
          source_url?: string
        }
        Relationships: []
      }
      football_players: {
        Row: {
          aliases: string[]
          id: string
          license: string
          name: string
          source_url: string
        }
        Insert: {
          aliases?: string[]
          id: string
          license?: string
          name: string
          source_url: string
        }
        Update: {
          aliases?: string[]
          id?: string
          license?: string
          name?: string
          source_url?: string
        }
        Relationships: []
      }
      football_verdict_cache: {
        Row: {
          checked_at: string
          explanation: string
          pair_key: string
          player: string
          player_key: string
          sources: string[]
        }
        Insert: {
          checked_at?: string
          explanation: string
          pair_key: string
          player: string
          player_key: string
          sources: string[]
        }
        Update: {
          checked_at?: string
          explanation?: string
          pair_key?: string
          player?: string
          player_key?: string
          sources?: string[]
        }
        Relationships: []
      }
      football_api_candidates: {
        Row: {
          club_names: string[]
          external_id: string
          player_key: string
          player_name: string
          provider: string
          retrieved_at: string
          review_status: string
          source_url: string
        }
        Insert: {
          club_names?: string[]
          external_id: string
          player_key: string
          player_name: string
          provider: string
          retrieved_at?: string
          review_status?: string
          source_url: string
        }
        Update: {
          club_names?: string[]
          external_id?: string
          player_key?: string
          player_name?: string
          provider?: string
          retrieved_at?: string
          review_status?: string
          source_url?: string
        }
        Relationships: []
      }
      game_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          room_id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          room_id: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          room_id?: string
        }
        Relationships: []
      }
      game_reports: {
        Row: {
          created_at: string
          details: string
          id: string
          reason: string
          reporter_id: string
          room_id: string
          status: string
          target_id: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          reason: string
          reporter_id: string
          room_id: string
          status?: string
          target_id: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_id?: string
          room_id?: string
          status?: string
          target_id?: string
        }
        Relationships: []
      }
      match_rounds: {
        Row: {
          answer: string | null
          match_start_round: number
          outcome: string
          room_id: string
          round_no: number
          suggestions: Json | null
          team_a: string | null
          team_b: string | null
          winner_player_id: string | null
        }
        Insert: {
          answer?: string | null
          match_start_round: number
          outcome: string
          room_id: string
          round_no: number
          suggestions?: Json | null
          team_a?: string | null
          team_b?: string | null
          winner_player_id?: string | null
        }
        Update: {
          answer?: string | null
          match_start_round?: number
          outcome?: string
          room_id?: string
          round_no?: number
          suggestions?: Json | null
          team_a?: string | null
          team_b?: string | null
          winner_player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_rounds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      picks: {
        Row: {
          player_id: string
          room_id: string
          round_no: number
          team: string
        }
        Insert: {
          player_id: string
          room_id: string
          round_no: number
          team: string
        }
        Update: {
          player_id?: string
          room_id?: string
          round_no?: number
          team?: string
        }
        Relationships: [
          {
            foreignKeyName: "picks_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "picks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          nickname: string
          room_id: string
          score: number
          token: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          nickname: string
          room_id: string
          score?: number
          token?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          nickname?: string
          room_id?: string
          score?: number
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          chooser_a: string | null
          chooser_b: string | null
          code: string
          created_at: string
          difficulty: string
          final_deadline: string | null
          final_players: string[] | null
          host_player_id: string | null
          id: string
          match_start_round: number
          pass_round: number | null
          passed_players: string[]
          random_exhausted: boolean
          round_answer: string | null
          round_no: number
          round_seconds: number
          round_deadline: string | null
          round_suggestions: Json | null
          round_winner_id: string | null
          status: string
          target_score: number
          team_a: string | null
          team_b: string | null
          team_mode: string
          updated_at: string
          winner_player_id: string | null
        }
        Insert: {
          chooser_a?: string | null
          chooser_b?: string | null
          code: string
          created_at?: string
          difficulty?: string
          final_deadline?: string | null
          final_players?: string[] | null
          host_player_id?: string | null
          id?: string
          match_start_round?: number
          pass_round?: number | null
          passed_players?: string[]
          random_exhausted?: boolean
          round_answer?: string | null
          round_no?: number
          round_seconds?: number
          round_deadline?: string | null
          round_suggestions?: Json | null
          round_winner_id?: string | null
          status?: string
          target_score?: number
          team_a?: string | null
          team_b?: string | null
          team_mode?: string
          updated_at?: string
          winner_player_id?: string | null
        }
        Update: {
          chooser_a?: string | null
          chooser_b?: string | null
          code?: string
          created_at?: string
          difficulty?: string
          final_deadline?: string | null
          final_players?: string[] | null
          host_player_id?: string | null
          id?: string
          match_start_round?: number
          pass_round?: number | null
          passed_players?: string[]
          random_exhausted?: boolean
          round_answer?: string | null
          round_no?: number
          round_seconds?: number
          round_deadline?: string | null
          round_suggestions?: Json | null
          round_winner_id?: string | null
          status?: string
          target_score?: number
          team_a?: string | null
          team_b?: string | null
          team_mode?: string
          updated_at?: string
          winner_player_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_final_round: {
        Args: { p_player: string; p_room: string; p_token: string }
        Returns: boolean
      }
      expire_room_round: {
        Args: { p_player: string; p_room: string; p_token: string }
        Returns: boolean
      }
      cleanup_game_data: { Args: never; Returns: undefined }
      erase_game_player: {
        Args: { p_player: string; p_room: string; p_token: string }
        Returns: undefined
      }
      pass_round: {
        Args: {
          p_player: string
          p_room: string
          p_round: number
          p_token: string
        }
        Returns: boolean
      }
      record_answer: {
        Args: {
          p_answer: string
          p_correct: boolean
          p_explanation: string
          p_name: string
          p_submission: string
        }
        Returns: undefined
      }
      reserve_answer: {
        Args: {
          p_player: string
          p_room: string
          p_round: number
          p_token: string
        }
        Returns: string
      }
      set_random_teams: {
        Args: {
          p_a: string
          p_b: string
          p_player: string
          p_room: string
          p_round: number
          p_token: string
        }
        Returns: boolean
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
    Enums: {},
  },
} as const
