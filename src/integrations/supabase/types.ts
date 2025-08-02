export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      image_analyses: {
        Row: {
          analysis_result: Json | null
          created_at: string
          id: string
          image_url: string | null
          master_analysis: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          master_analysis?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          master_analysis?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_data_snapshots: {
        Row: {
          analysis_id: string | null
          close_price: number
          created_at: string
          high_price: number
          id: string
          indicators: Json | null
          low_price: number
          open_price: number
          symbol: string
          timeframe: Database["public"]["Enums"]["timeframe_type"]
          timestamp: string
          volume: number
        }
        Insert: {
          analysis_id?: string | null
          close_price: number
          created_at?: string
          high_price: number
          id?: string
          indicators?: Json | null
          low_price: number
          open_price: number
          symbol: string
          timeframe: Database["public"]["Enums"]["timeframe_type"]
          timestamp: string
          volume: number
        }
        Update: {
          analysis_id?: string | null
          close_price?: number
          created_at?: string
          high_price?: number
          id?: string
          indicators?: Json | null
          low_price?: number
          open_price?: number
          symbol?: string
          timeframe?: Database["public"]["Enums"]["timeframe_type"]
          timestamp?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_data_snapshots_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "professional_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_analyses: {
        Row: {
          analysis_region: Json | null
          analysis_score: number | null
          bollinger_lower: number | null
          bollinger_upper: number | null
          bulkowski_average_move: number | null
          bulkowski_breakout_direction: string | null
          bulkowski_failure_rate: number | null
          bulkowski_pattern_name: string | null
          bulkowski_reliability: number | null
          candle_data: Json[] | null
          confluences: Json[] | null
          created_at: string
          divergences: Json[] | null
          elder_confidence: number | null
          elder_long_term_trend: string | null
          elder_medium_oscillator: string | null
          elder_short_entry: string | null
          ema_20: number | null
          ema_50: number | null
          entry_recommendations: Json[] | null
          id: string
          image_metadata: Json | null
          image_url: string | null
          macd_histogram: number | null
          macd_line: number | null
          macd_signal: number | null
          market_description: string | null
          market_phase: Database["public"]["Enums"]["market_phase"] | null
          market_sentiment:
            | Database["public"]["Enums"]["market_sentiment"]
            | null
          market_strength: number | null
          master_recommendation: string | null
          murphy_support_resistance: Json[] | null
          murphy_trend_primary: string | null
          murphy_trend_secondary: string | null
          murphy_volume_analysis: string | null
          overall_action: Database["public"]["Enums"]["action_type"] | null
          overall_confidence: number | null
          pattern_confidence: number | null
          pattern_count: number | null
          patterns: Json[] | null
          price_levels: Json | null
          primary_pattern:
            | Database["public"]["Enums"]["analysis_pattern_type"]
            | null
          reliability_score: number | null
          risk_reward_ratio: number | null
          rsi_value: number | null
          scalping_signals: Json[] | null
          sma_200: number | null
          stochastic_d: number | null
          stochastic_k: number | null
          stop_loss_level: number | null
          take_profit_levels: number[] | null
          timeframe: Database["public"]["Enums"]["timeframe_type"] | null
          updated_at: string
          user_id: string
          volatility_atr: number | null
          volatility_comparison: string | null
          volatility_trend: string | null
          volatility_value: number | null
          volume_abnormal: boolean | null
          volume_significance: string | null
          volume_trend: string | null
          volume_value: number | null
          volume_vs_average: number | null
        }
        Insert: {
          analysis_region?: Json | null
          analysis_score?: number | null
          bollinger_lower?: number | null
          bollinger_upper?: number | null
          bulkowski_average_move?: number | null
          bulkowski_breakout_direction?: string | null
          bulkowski_failure_rate?: number | null
          bulkowski_pattern_name?: string | null
          bulkowski_reliability?: number | null
          candle_data?: Json[] | null
          confluences?: Json[] | null
          created_at?: string
          divergences?: Json[] | null
          elder_confidence?: number | null
          elder_long_term_trend?: string | null
          elder_medium_oscillator?: string | null
          elder_short_entry?: string | null
          ema_20?: number | null
          ema_50?: number | null
          entry_recommendations?: Json[] | null
          id?: string
          image_metadata?: Json | null
          image_url?: string | null
          macd_histogram?: number | null
          macd_line?: number | null
          macd_signal?: number | null
          market_description?: string | null
          market_phase?: Database["public"]["Enums"]["market_phase"] | null
          market_sentiment?:
            | Database["public"]["Enums"]["market_sentiment"]
            | null
          market_strength?: number | null
          master_recommendation?: string | null
          murphy_support_resistance?: Json[] | null
          murphy_trend_primary?: string | null
          murphy_trend_secondary?: string | null
          murphy_volume_analysis?: string | null
          overall_action?: Database["public"]["Enums"]["action_type"] | null
          overall_confidence?: number | null
          pattern_confidence?: number | null
          pattern_count?: number | null
          patterns?: Json[] | null
          price_levels?: Json | null
          primary_pattern?:
            | Database["public"]["Enums"]["analysis_pattern_type"]
            | null
          reliability_score?: number | null
          risk_reward_ratio?: number | null
          rsi_value?: number | null
          scalping_signals?: Json[] | null
          sma_200?: number | null
          stochastic_d?: number | null
          stochastic_k?: number | null
          stop_loss_level?: number | null
          take_profit_levels?: number[] | null
          timeframe?: Database["public"]["Enums"]["timeframe_type"] | null
          updated_at?: string
          user_id: string
          volatility_atr?: number | null
          volatility_comparison?: string | null
          volatility_trend?: string | null
          volatility_value?: number | null
          volume_abnormal?: boolean | null
          volume_significance?: string | null
          volume_trend?: string | null
          volume_value?: number | null
          volume_vs_average?: number | null
        }
        Update: {
          analysis_region?: Json | null
          analysis_score?: number | null
          bollinger_lower?: number | null
          bollinger_upper?: number | null
          bulkowski_average_move?: number | null
          bulkowski_breakout_direction?: string | null
          bulkowski_failure_rate?: number | null
          bulkowski_pattern_name?: string | null
          bulkowski_reliability?: number | null
          candle_data?: Json[] | null
          confluences?: Json[] | null
          created_at?: string
          divergences?: Json[] | null
          elder_confidence?: number | null
          elder_long_term_trend?: string | null
          elder_medium_oscillator?: string | null
          elder_short_entry?: string | null
          ema_20?: number | null
          ema_50?: number | null
          entry_recommendations?: Json[] | null
          id?: string
          image_metadata?: Json | null
          image_url?: string | null
          macd_histogram?: number | null
          macd_line?: number | null
          macd_signal?: number | null
          market_description?: string | null
          market_phase?: Database["public"]["Enums"]["market_phase"] | null
          market_sentiment?:
            | Database["public"]["Enums"]["market_sentiment"]
            | null
          market_strength?: number | null
          master_recommendation?: string | null
          murphy_support_resistance?: Json[] | null
          murphy_trend_primary?: string | null
          murphy_trend_secondary?: string | null
          murphy_volume_analysis?: string | null
          overall_action?: Database["public"]["Enums"]["action_type"] | null
          overall_confidence?: number | null
          pattern_confidence?: number | null
          pattern_count?: number | null
          patterns?: Json[] | null
          price_levels?: Json | null
          primary_pattern?:
            | Database["public"]["Enums"]["analysis_pattern_type"]
            | null
          reliability_score?: number | null
          risk_reward_ratio?: number | null
          rsi_value?: number | null
          scalping_signals?: Json[] | null
          sma_200?: number | null
          stochastic_d?: number | null
          stochastic_k?: number | null
          stop_loss_level?: number | null
          take_profit_levels?: number[] | null
          timeframe?: Database["public"]["Enums"]["timeframe_type"] | null
          updated_at?: string
          user_id?: string
          volatility_atr?: number | null
          volatility_comparison?: string | null
          volatility_trend?: string | null
          volatility_value?: number | null
          volume_abnormal?: boolean | null
          volume_significance?: string | null
          volume_trend?: string | null
          volume_value?: number | null
          volume_vs_average?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      action_type: "compra" | "venda" | "neutro"
      analysis_pattern_type:
        | "bullish_engulfing"
        | "bearish_engulfing"
        | "hammer"
        | "doji"
        | "shooting_star"
        | "hanging_man"
        | "three_white_soldiers"
        | "three_black_crows"
        | "morning_star"
        | "evening_star"
        | "piercing_pattern"
        | "dark_cloud_cover"
        | "harami"
        | "tweezers"
        | "gap_up"
        | "gap_down"
        | "triangle"
        | "wedge"
        | "flag"
        | "pennant"
        | "head_shoulders"
        | "double_top"
        | "double_bottom"
        | "support_resistance"
      market_phase: "accumulation" | "markup" | "distribution" | "markdown"
      market_sentiment: "bullish" | "bearish" | "neutral" | "mixed"
      signal_type: "entrada" | "saída"
      timeframe_type: "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1" | "W1"
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
      action_type: ["compra", "venda", "neutro"],
      analysis_pattern_type: [
        "bullish_engulfing",
        "bearish_engulfing",
        "hammer",
        "doji",
        "shooting_star",
        "hanging_man",
        "three_white_soldiers",
        "three_black_crows",
        "morning_star",
        "evening_star",
        "piercing_pattern",
        "dark_cloud_cover",
        "harami",
        "tweezers",
        "gap_up",
        "gap_down",
        "triangle",
        "wedge",
        "flag",
        "pennant",
        "head_shoulders",
        "double_top",
        "double_bottom",
        "support_resistance",
      ],
      market_phase: ["accumulation", "markup", "distribution", "markdown"],
      market_sentiment: ["bullish", "bearish", "neutral", "mixed"],
      signal_type: ["entrada", "saída"],
      timeframe_type: ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"],
    },
  },
} as const
