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
    PostgrestVersion: '12.2.3 (519615d)'
  }
  public: {
    Tables: {
      app: {
        Row: {
          id: number
          updated_at: string
        }
        Insert: {
          id?: number
          updated_at?: string
        }
        Update: {
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      game_leaders: {
        Row: {
          assists: number | null
          blocks: number | null
          created_at: string | null
          fga: number | null
          fgm: number | null
          fouls: number | null
          fta: number | null
          ftm: number | null
          game_id: string | null
          id: string
          minutes: string | null
          performance_score: number | null
          player_name: string
          points: number | null
          rebounds: number | null
          stat_type: string | null
          steals: number | null
          team_id: string | null
          tpa: number | null
          tpm: number | null
          turnovers: number | null
          updated_at: string | null
        }
        Insert: {
          assists?: number | null
          blocks?: number | null
          created_at?: string | null
          fga?: number | null
          fgm?: number | null
          fouls?: number | null
          fta?: number | null
          ftm?: number | null
          game_id?: string | null
          id?: string
          minutes?: string | null
          performance_score?: number | null
          player_name: string
          points?: number | null
          rebounds?: number | null
          stat_type?: string | null
          steals?: number | null
          team_id?: string | null
          tpa?: number | null
          tpm?: number | null
          turnovers?: number | null
          updated_at?: string | null
        }
        Update: {
          assists?: number | null
          blocks?: number | null
          created_at?: string | null
          fga?: number | null
          fgm?: number | null
          fouls?: number | null
          fta?: number | null
          ftm?: number | null
          game_id?: string | null
          id?: string
          minutes?: string | null
          performance_score?: number | null
          player_name?: string
          points?: number | null
          rebounds?: number | null
          stat_type?: string | null
          steals?: number | null
          team_id?: string | null
          tpa?: number | null
          tpm?: number | null
          turnovers?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'game_leaders_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_leaders_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      game_odds: {
        Row: {
          away_moneyline: number | null
          bookmaker: string
          created_at: string | null
          game_id: string | null
          home_moneyline: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          away_moneyline?: number | null
          bookmaker: string
          created_at?: string | null
          game_id?: string | null
          home_moneyline?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          away_moneyline?: number | null
          bookmaker?: string
          created_at?: string | null
          game_id?: string | null
          home_moneyline?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'game_odds_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
        ]
      }
      game_predictions: {
        Row: {
          bet_units: number | null
          created_at: string | null
          edge_away: number | null
          edge_home: number | null
          game_id: string
          id: string
          key_factors: Json | null
          latency_ms: number | null
          model_id: string
          model_prob_away: number
          model_prob_home: number
          prompt_id: string
          raw_response: Json | null
          reasoning: string | null
          recommended_bet: string | null
          tokens_used: number | null
          updated_at: string | null
        }
        Insert: {
          bet_units?: number | null
          created_at?: string | null
          edge_away?: number | null
          edge_home?: number | null
          game_id: string
          id?: string
          key_factors?: Json | null
          latency_ms?: number | null
          model_id: string
          model_prob_away: number
          model_prob_home: number
          prompt_id: string
          raw_response?: Json | null
          reasoning?: string | null
          recommended_bet?: string | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Update: {
          bet_units?: number | null
          created_at?: string | null
          edge_away?: number | null
          edge_home?: number | null
          game_id?: string
          id?: string
          key_factors?: Json | null
          latency_ms?: number | null
          model_id?: string
          model_prob_away?: number
          model_prob_home?: number
          prompt_id?: string
          raw_response?: Json | null
          reasoning?: string | null
          recommended_bet?: string | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'game_predictions_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_predictions_model_id_fkey'
            columns: ['model_id']
            isOneToOne: false
            referencedRelation: 'prediction_models'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_predictions_prompt_id_fkey'
            columns: ['prompt_id']
            isOneToOne: false
            referencedRelation: 'prediction_prompts'
            referencedColumns: ['id']
          },
        ]
      }
      games: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          clock: string | null
          created_at: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          quarter: string | null
          scheduled: string
          season: string
          status: string
          updated_at: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          clock?: string | null
          created_at?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id: string
          quarter?: string | null
          scheduled: string
          season: string
          status: string
          updated_at?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          clock?: string | null
          created_at?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          quarter?: string | null
          scheduled?: string
          season?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'games_away_team_id_fkey'
            columns: ['away_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'games_home_team_id_fkey'
            columns: ['home_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      job_role_definitions: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          job_role_name: string
          job_role_slug: string
          keywords: Json | null
          parent_category: string | null
          updated_at: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_order: number
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          job_role_name: string
          job_role_slug: string
          keywords?: Json | null
          parent_category?: string | null
          updated_at?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          job_role_name?: string
          job_role_slug?: string
          keywords?: Json | null
          parent_category?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'fk_parent_category'
            columns: ['parent_category']
            isOneToOne: false
            referencedRelation: 'parent_categories'
            referencedColumns: ['slug']
          },
          {
            foreignKeyName: 'job_role_definitions_parent_category_fkey'
            columns: ['parent_category']
            isOneToOne: false
            referencedRelation: 'parent_categories'
            referencedColumns: ['slug']
          },
        ]
      }
      parent_categories: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_order: number
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      permit_changes: {
        Row: {
          business_impact: string | null
          change_count_for_permit: number | null
          change_type: string | null
          changed_at: string
          changed_fields: string[]
          created_at: string | null
          days_since_last_change: number | null
          detected_at: string | null
          external_id: number | null
          id: string
          new_values: Json
          old_values: Json
          permit_id: string
          permit_num: string
        }
        Insert: {
          business_impact?: string | null
          change_count_for_permit?: number | null
          change_type?: string | null
          changed_at: string
          changed_fields: string[]
          created_at?: string | null
          days_since_last_change?: number | null
          detected_at?: string | null
          external_id?: number | null
          id?: string
          new_values: Json
          old_values: Json
          permit_id: string
          permit_num: string
        }
        Update: {
          business_impact?: string | null
          change_count_for_permit?: number | null
          change_type?: string | null
          changed_at?: string
          changed_fields?: string[]
          created_at?: string | null
          days_since_last_change?: number | null
          detected_at?: string | null
          external_id?: number | null
          id?: string
          new_values?: Json
          old_values?: Json
          permit_id?: string
          permit_num?: string
        }
        Relationships: [
          {
            foreignKeyName: 'permit_changes_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'active_permits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'permit_changes_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'permits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'permit_changes_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'permits_to_monitor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'permit_changes_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'recent_status_changes'
            referencedColumns: ['id']
          },
        ]
      }
      permit_cost_stats: {
        Row: {
          cost_0_50k: number | null
          cost_100k_200k: number | null
          cost_1m_2m: number | null
          cost_200k_500k: number | null
          cost_2m_5m: number | null
          cost_500k_1m: number | null
          cost_50k_100k: number | null
          cost_5m_plus: number | null
          created_at: string | null
          id: string
          max_cost: number | null
          median_cost: number | null
          min_cost: number | null
          snapshot_date: string
          total_permits: number | null
          total_permits_with_cost: number | null
          updated_at: string | null
        }
        Insert: {
          cost_0_50k?: number | null
          cost_100k_200k?: number | null
          cost_1m_2m?: number | null
          cost_200k_500k?: number | null
          cost_2m_5m?: number | null
          cost_500k_1m?: number | null
          cost_50k_100k?: number | null
          cost_5m_plus?: number | null
          created_at?: string | null
          id?: string
          max_cost?: number | null
          median_cost?: number | null
          min_cost?: number | null
          snapshot_date?: string
          total_permits?: number | null
          total_permits_with_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          cost_0_50k?: number | null
          cost_100k_200k?: number | null
          cost_1m_2m?: number | null
          cost_200k_500k?: number | null
          cost_2m_5m?: number | null
          cost_500k_1m?: number | null
          cost_50k_100k?: number | null
          cost_5m_plus?: number | null
          created_at?: string | null
          id?: string
          max_cost?: number | null
          median_cost?: number | null
          min_cost?: number | null
          snapshot_date?: string
          total_permits?: number | null
          total_permits_with_cost?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permit_job_roles: {
        Row: {
          categorized_at: string | null
          created_at: string | null
          id: string
          job_role_slug: string
          llm_model: string | null
          llm_reasoning: string | null
          permit_id: string
        }
        Insert: {
          categorized_at?: string | null
          created_at?: string | null
          id?: string
          job_role_slug: string
          llm_model?: string | null
          llm_reasoning?: string | null
          permit_id: string
        }
        Update: {
          categorized_at?: string | null
          created_at?: string | null
          id?: string
          job_role_slug?: string
          llm_model?: string | null
          llm_reasoning?: string | null
          permit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'permit_job_roles_job_role_slug_fkey'
            columns: ['job_role_slug']
            isOneToOne: false
            referencedRelation: 'job_role_definitions'
            referencedColumns: ['job_role_slug']
          },
          {
            foreignKeyName: 'permit_job_roles_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'active_permits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'permit_job_roles_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'permits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'permit_job_roles_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'permits_to_monitor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'permit_job_roles_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'recent_status_changes'
            referencedColumns: ['id']
          },
        ]
      }
      permit_status_history: {
        Row: {
          alert_sent: boolean | null
          change_detected_at: string | null
          id: number
          new_status: string | null
          old_status: string | null
          permit_num: string | null
          permit_uuid: string
          status_changed_at: string | null
        }
        Insert: {
          alert_sent?: boolean | null
          change_detected_at?: string | null
          id?: number
          new_status?: string | null
          old_status?: string | null
          permit_num?: string | null
          permit_uuid: string
          status_changed_at?: string | null
        }
        Update: {
          alert_sent?: boolean | null
          change_detected_at?: string | null
          id?: number
          new_status?: string | null
          old_status?: string | null
          permit_num?: string | null
          permit_uuid?: string
          status_changed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'permit_status_history_permit_uuid_fkey'
            columns: ['permit_uuid']
            isOneToOne: false
            referencedRelation: 'active_permits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'permit_status_history_permit_uuid_fkey'
            columns: ['permit_uuid']
            isOneToOne: false
            referencedRelation: 'permits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'permit_status_history_permit_uuid_fkey'
            columns: ['permit_uuid']
            isOneToOne: false
            referencedRelation: 'permits_to_monitor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'permit_status_history_permit_uuid_fkey'
            columns: ['permit_uuid']
            isOneToOne: false
            referencedRelation: 'recent_status_changes'
            referencedColumns: ['id']
          },
        ]
      }
      permits: {
        Row: {
          application_date: string | null
          assembly: number | null
          builder_name: string | null
          business_and_personal_services: number | null
          completed_date: string | null
          created_at: string | null
          current_use: string | null
          data_source_version: string | null
          demolition: number | null
          description: string | null
          dwelling_units_created: number | null
          dwelling_units_lost: number | null
          est_const_cost: number | null
          external_id: string | null
          first_seen_at: string | null
          fts: unknown
          full_address: string | null
          geo_id: string | null
          has_address: boolean | null
          id: string
          industrial: number | null
          institutional: number | null
          interior_alterations: number | null
          issued_date: string | null
          location: unknown
          mercantile: number | null
          permit_num: string
          permit_type: string | null
          postal: string | null
          previous_status: string | null
          proposed_use: string | null
          raw_data: Json | null
          residential: number | null
          revision_num: string | null
          source: string | null
          status: string | null
          status_changed_at: string | null
          street_direction: string | null
          street_name: string | null
          street_num: string | null
          street_type: string | null
          structure_type: string | null
          updated_at: string | null
          ward_grid: string | null
          work: string | null
        }
        Insert: {
          application_date?: string | null
          assembly?: number | null
          builder_name?: string | null
          business_and_personal_services?: number | null
          completed_date?: string | null
          created_at?: string | null
          current_use?: string | null
          data_source_version?: string | null
          demolition?: number | null
          description?: string | null
          dwelling_units_created?: number | null
          dwelling_units_lost?: number | null
          est_const_cost?: number | null
          external_id?: string | null
          first_seen_at?: string | null
          fts?: unknown
          full_address?: string | null
          geo_id?: string | null
          has_address?: boolean | null
          id?: string
          industrial?: number | null
          institutional?: number | null
          interior_alterations?: number | null
          issued_date?: string | null
          location?: unknown
          mercantile?: number | null
          permit_num: string
          permit_type?: string | null
          postal?: string | null
          previous_status?: string | null
          proposed_use?: string | null
          raw_data?: Json | null
          residential?: number | null
          revision_num?: string | null
          source?: string | null
          status?: string | null
          status_changed_at?: string | null
          street_direction?: string | null
          street_name?: string | null
          street_num?: string | null
          street_type?: string | null
          structure_type?: string | null
          updated_at?: string | null
          ward_grid?: string | null
          work?: string | null
        }
        Update: {
          application_date?: string | null
          assembly?: number | null
          builder_name?: string | null
          business_and_personal_services?: number | null
          completed_date?: string | null
          created_at?: string | null
          current_use?: string | null
          data_source_version?: string | null
          demolition?: number | null
          description?: string | null
          dwelling_units_created?: number | null
          dwelling_units_lost?: number | null
          est_const_cost?: number | null
          external_id?: string | null
          first_seen_at?: string | null
          fts?: unknown
          full_address?: string | null
          geo_id?: string | null
          has_address?: boolean | null
          id?: string
          industrial?: number | null
          institutional?: number | null
          interior_alterations?: number | null
          issued_date?: string | null
          location?: unknown
          mercantile?: number | null
          permit_num?: string
          permit_type?: string | null
          postal?: string | null
          previous_status?: string | null
          proposed_use?: string | null
          raw_data?: Json | null
          residential?: number | null
          revision_num?: string | null
          source?: string | null
          status?: string | null
          status_changed_at?: string | null
          street_direction?: string | null
          street_name?: string | null
          street_num?: string | null
          street_type?: string | null
          structure_type?: string | null
          updated_at?: string | null
          ward_grid?: string | null
          work?: string | null
        }
        Relationships: []
      }
      prediction_models: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          provider: string
          version: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          provider: string
          version: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          provider?: string
          version?: string
        }
        Relationships: []
      }
      prediction_performance: {
        Row: {
          actual_outcome: string | null
          edge_realized: number | null
          evaluated_at: string | null
          game_id: string
          id: string
          model_id: string
          prediction_id: string
          prompt_id: string
          roi: number | null
          was_correct: boolean | null
        }
        Insert: {
          actual_outcome?: string | null
          edge_realized?: number | null
          evaluated_at?: string | null
          game_id: string
          id?: string
          model_id: string
          prediction_id: string
          prompt_id: string
          roi?: number | null
          was_correct?: boolean | null
        }
        Update: {
          actual_outcome?: string | null
          edge_realized?: number | null
          evaluated_at?: string | null
          game_id?: string
          id?: string
          model_id?: string
          prediction_id?: string
          prompt_id?: string
          roi?: number | null
          was_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'prediction_performance_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prediction_performance_model_id_fkey'
            columns: ['model_id']
            isOneToOne: false
            referencedRelation: 'prediction_models'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prediction_performance_prediction_id_fkey'
            columns: ['prediction_id']
            isOneToOne: true
            referencedRelation: 'game_predictions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prediction_performance_prompt_id_fkey'
            columns: ['prompt_id']
            isOneToOne: false
            referencedRelation: 'prediction_prompts'
            referencedColumns: ['id']
          },
        ]
      }
      prediction_prompts: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          system_prompt: string
          user_prompt_template: string
          version: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          system_prompt: string
          user_prompt_template: string
          version: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          system_prompt?: string
          user_prompt_template?: string
          version?: string
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          abbreviation: string | null
          conference: string | null
          created_at: string | null
          division: string | null
          id: string
          logo: string | null
          losses: number | null
          name: string
          wins: number | null
        }
        Insert: {
          abbreviation?: string | null
          conference?: string | null
          created_at?: string | null
          division?: string | null
          id: string
          logo?: string | null
          losses?: number | null
          name: string
          wins?: number | null
        }
        Update: {
          abbreviation?: string | null
          conference?: string | null
          created_at?: string | null
          division?: string | null
          id?: string
          logo?: string | null
          losses?: number | null
          name?: string
          wins?: number | null
        }
        Relationships: []
      }
      user_digest_history: {
        Row: {
          created_at: string | null
          id: string
          permit_id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permit_id: string
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permit_id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_digest_history_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'active_permits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_digest_history_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'permits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_digest_history_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'permits_to_monitor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_digest_history_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'recent_status_changes'
            referencedColumns: ['id']
          },
        ]
      }
      user_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          description: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          metadata: Json | null
          notification_type: string
          read_at: string | null
          severity: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          description: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          severity: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          description?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          severity?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_permit_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          permit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          permit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          permit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_permit_actions_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'active_permits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_permit_actions_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'permits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_permit_actions_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'permits_to_monitor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_permit_actions_permit_id_fkey'
            columns: ['permit_id']
            isOneToOne: false
            referencedRelation: 'recent_status_changes'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          address_lat: number | null
          address_lng: number | null
          address_location: unknown
          admin: boolean | null
          cost_max: number | null
          cost_min: number | null
          created_at: string | null
          daily_email_enabled: boolean
          email: string
          email_preferences: Json | null
          id: string
          min_project_cost: number | null
          only_with_builder: boolean | null
          only_with_cost: boolean | null
          stripe_customer_id: string | null
          stripe_customer_id_test: string | null
          stripe_subscription_id: string | null
          stripe_subscription_id_test: string | null
          subscribed_categories: string[] | null
          subscribed_job_roles: string[] | null
          subscription_current_period_end: string | null
          subscription_current_period_end_test: string | null
          subscription_status: string | null
          trade_keywords: string[] | null
          trial_end: string | null
          trial_end_test: string | null
          trial_start: string | null
          trial_start_test: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          address_lat?: number | null
          address_lng?: number | null
          address_location?: unknown
          admin?: boolean | null
          cost_max?: number | null
          cost_min?: number | null
          created_at?: string | null
          daily_email_enabled?: boolean
          email: string
          email_preferences?: Json | null
          id: string
          min_project_cost?: number | null
          only_with_builder?: boolean | null
          only_with_cost?: boolean | null
          stripe_customer_id?: string | null
          stripe_customer_id_test?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_id_test?: string | null
          subscribed_categories?: string[] | null
          subscribed_job_roles?: string[] | null
          subscription_current_period_end?: string | null
          subscription_current_period_end_test?: string | null
          subscription_status?: string | null
          trade_keywords?: string[] | null
          trial_end?: string | null
          trial_end_test?: string | null
          trial_start?: string | null
          trial_start_test?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          address_lat?: number | null
          address_lng?: number | null
          address_location?: unknown
          admin?: boolean | null
          cost_max?: number | null
          cost_min?: number | null
          created_at?: string | null
          daily_email_enabled?: boolean
          email?: string
          email_preferences?: Json | null
          id?: string
          min_project_cost?: number | null
          only_with_builder?: boolean | null
          only_with_cost?: boolean | null
          stripe_customer_id?: string | null
          stripe_customer_id_test?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_id_test?: string | null
          subscribed_categories?: string[] | null
          subscribed_job_roles?: string[] | null
          subscription_current_period_end?: string | null
          subscription_current_period_end_test?: string | null
          subscription_status?: string | null
          trade_keywords?: string[] | null
          trial_end?: string | null
          trial_end_test?: string | null
          trial_start?: string | null
          trial_start_test?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_permits: {
        Row: {
          application_date: string | null
          assembly: number | null
          builder_name: string | null
          business_and_personal_services: number | null
          completed_date: string | null
          created_at: string | null
          current_use: string | null
          data_source_version: string | null
          demolition: number | null
          description: string | null
          dwelling_units_created: number | null
          dwelling_units_lost: number | null
          est_const_cost: number | null
          external_id: string | null
          first_seen_at: string | null
          full_address: string | null
          geo_id: string | null
          id: string | null
          industrial: number | null
          institutional: number | null
          interior_alterations: number | null
          issued_date: string | null
          location: unknown
          mercantile: number | null
          permit_num: string | null
          permit_type: string | null
          postal: string | null
          previous_status: string | null
          proposed_use: string | null
          raw_data: Json | null
          residential: number | null
          revision_num: string | null
          source: string | null
          status: string | null
          status_changed_at: string | null
          street_direction: string | null
          street_name: string | null
          street_num: string | null
          street_type: string | null
          structure_type: string | null
          updated_at: string | null
          ward_grid: string | null
          work: string | null
        }
        Insert: {
          application_date?: string | null
          assembly?: number | null
          builder_name?: string | null
          business_and_personal_services?: number | null
          completed_date?: string | null
          created_at?: string | null
          current_use?: string | null
          data_source_version?: string | null
          demolition?: number | null
          description?: string | null
          dwelling_units_created?: number | null
          dwelling_units_lost?: number | null
          est_const_cost?: number | null
          external_id?: string | null
          first_seen_at?: string | null
          full_address?: string | null
          geo_id?: string | null
          id?: string | null
          industrial?: number | null
          institutional?: number | null
          interior_alterations?: number | null
          issued_date?: string | null
          location?: unknown
          mercantile?: number | null
          permit_num?: string | null
          permit_type?: string | null
          postal?: string | null
          previous_status?: string | null
          proposed_use?: string | null
          raw_data?: Json | null
          residential?: number | null
          revision_num?: string | null
          source?: string | null
          status?: string | null
          status_changed_at?: string | null
          street_direction?: string | null
          street_name?: string | null
          street_num?: string | null
          street_type?: string | null
          structure_type?: string | null
          updated_at?: string | null
          ward_grid?: string | null
          work?: string | null
        }
        Update: {
          application_date?: string | null
          assembly?: number | null
          builder_name?: string | null
          business_and_personal_services?: number | null
          completed_date?: string | null
          created_at?: string | null
          current_use?: string | null
          data_source_version?: string | null
          demolition?: number | null
          description?: string | null
          dwelling_units_created?: number | null
          dwelling_units_lost?: number | null
          est_const_cost?: number | null
          external_id?: string | null
          first_seen_at?: string | null
          full_address?: string | null
          geo_id?: string | null
          id?: string | null
          industrial?: number | null
          institutional?: number | null
          interior_alterations?: number | null
          issued_date?: string | null
          location?: unknown
          mercantile?: number | null
          permit_num?: string | null
          permit_type?: string | null
          postal?: string | null
          previous_status?: string | null
          proposed_use?: string | null
          raw_data?: Json | null
          residential?: number | null
          revision_num?: string | null
          source?: string | null
          status?: string | null
          status_changed_at?: string | null
          street_direction?: string | null
          street_name?: string | null
          street_num?: string | null
          street_type?: string | null
          structure_type?: string | null
          updated_at?: string | null
          ward_grid?: string | null
          work?: string | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      permits_to_monitor: {
        Row: {
          application_date: string | null
          assembly: number | null
          builder_name: string | null
          business_and_personal_services: number | null
          completed_date: string | null
          created_at: string | null
          current_use: string | null
          data_source_version: string | null
          demolition: number | null
          description: string | null
          dwelling_units_created: number | null
          dwelling_units_lost: number | null
          est_const_cost: number | null
          external_id: string | null
          first_seen_at: string | null
          full_address: string | null
          geo_id: string | null
          id: string | null
          industrial: number | null
          institutional: number | null
          interior_alterations: number | null
          issued_date: string | null
          location: unknown
          mercantile: number | null
          permit_num: string | null
          permit_type: string | null
          postal: string | null
          previous_status: string | null
          proposed_use: string | null
          raw_data: Json | null
          residential: number | null
          revision_num: string | null
          source: string | null
          status: string | null
          status_changed_at: string | null
          street_direction: string | null
          street_name: string | null
          street_num: string | null
          street_type: string | null
          structure_type: string | null
          updated_at: string | null
          ward_grid: string | null
          work: string | null
        }
        Relationships: []
      }
      recent_status_changes: {
        Row: {
          alert_sent: boolean | null
          application_date: string | null
          change_timestamp: string | null
          current_status: string | null
          est_const_cost: number | null
          id: string | null
          location: unknown
          new_status: string | null
          old_status: string | null
          permit_num: string | null
          permit_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ''?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      add_distance_to_permits: {
        Args: { permit_uuids: string[]; user_lat: number; user_lng: number }
        Returns: {
          distance_km: number
          permit_id: string
        }[]
      }
      addauth: { Args: { '': string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      dropgeometrytable:
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { '': string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { '': string }; Returns: unknown }
      get_permits_in_radius: {
        Args: { center_lat: number; center_lng: number; radius_meters?: number }
        Returns: {
          application_date: string
          distance_meters: number
          est_const_cost: number
          permit_id: string
          permit_num: string
          permit_type: string
          status: string
        }[]
      }
      get_slow_queries: {
        Args: { min_mean_exec_time_ms?: number }
        Returns: {
          calls: number
          mean_exec_time_ms: number
          query_text: string
          stddev_exec_time_ms: number
          total_exec_time_ms: number
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { use_typmod?: boolean }; Returns: string }
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      search_permits_with_distance:
        | {
            Args: {
              job_role_slugs?: string[]
              limit_count?: number
              max_cost?: number
              max_distance_km?: number
              min_cost?: number
              offset_count?: number
              parent_category_slugs?: string[]
              search_query?: string
              status_filter?: string[]
              user_lat: number
              user_lng: number
            }
            Returns: {
              description: string
              distance_km: number
              est_const_cost: number
              full_address: string
              issued_date: string
              permit_data: Json
              permit_id: string
              permit_num: string
              status: string
            }[]
          }
        | {
            Args: {
              issued_from?: string
              issued_to?: string
              job_role_slugs?: string[]
              limit_count?: number
              max_cost?: number
              max_distance_km?: number
              min_cost?: number
              offset_count?: number
              parent_category_slugs?: string[]
              search_query?: string
              status_filter?: string[]
              user_lat: number
              user_lng: number
            }
            Returns: {
              description: string
              distance_km: number
              est_const_cost: number
              full_address: string
              issued_date: string
              permit_data: Json
              permit_id: string
              permit_num: string
              status: string
            }[]
          }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { '': string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { '': string }; Returns: string }
      st_asgeojson:
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { '': string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | { Args: { '': string }; Returns: string }
      st_askml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { '': string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { '': string }; Returns: string }
      st_astext: { Args: { '': string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { '': string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
      st_geogfromtext: { Args: { '': string }; Returns: unknown }
      st_geographyfromtext: { Args: { '': string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { '': string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { '': string }; Returns: unknown }
      st_geomfromewkt: { Args: { '': string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { '': Json }; Returns: unknown }
        | { Args: { '': Json }; Returns: unknown }
        | { Args: { '': string }; Returns: unknown }
      st_geomfromgml: { Args: { '': string }; Returns: unknown }
      st_geomfromkml: { Args: { '': string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { '': string }; Returns: unknown }
      st_gmltosql: { Args: { '': string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database['public']['CompositeTypes']['valid_detail']
        SetofOptions: {
          from: '*'
          to: 'valid_detail'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { '': string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { '': string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { '': string }; Returns: unknown }
      st_mpointfromtext: { Args: { '': string }; Returns: unknown }
      st_mpolyfromtext: { Args: { '': string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { '': string }; Returns: unknown }
      st_multipointfromtext: { Args: { '': string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { '': string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { '': string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { '': string }; Returns: unknown }
      st_polygonfromtext: { Args: { '': string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { '': string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { '': string }; Returns: number }
      update_permit_location: {
        Args: { latitude: number; longitude: number; permit_id: string }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      leader_type: 'points' | 'rebounds' | 'assists'
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      leader_type: ['points', 'rebounds', 'assists'],
    },
  },
} as const
