// Generado con `supabase gen types typescript` contra el proyecto real.
// No editar a mano: regenerar tras cada migración.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.15'
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          description: string | null
          emoji: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          emoji: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          emoji?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      connections: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          initial_message: string | null
          seeker_id: string
          seeker_last_read_at: string | null
          status: string
          updated_at: string
          volunteer_id: string
          volunteer_last_read_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          initial_message?: string | null
          seeker_id: string
          seeker_last_read_at?: string | null
          status?: string
          updated_at?: string
          volunteer_id: string
          volunteer_last_read_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          initial_message?: string | null
          seeker_id?: string
          seeker_last_read_at?: string | null
          status?: string
          updated_at?: string
          volunteer_id?: string
          volunteer_last_read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'connections_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'connections_seeker_id_fkey'
            columns: ['seeker_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'connections_volunteer_id_fkey'
            columns: ['volunteer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      email_queue: {
        Row: {
          created_at: string
          error_message: string | null
          from_email: string
          html_body: string
          id: string
          max_retries: number
          next_retry_at: string
          recipient_email: string
          retry_count: number
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          from_email?: string
          html_body: string
          id?: string
          max_retries?: number
          next_retry_at?: string
          recipient_email: string
          retry_count?: number
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          from_email?: string
          html_body?: string
          id?: string
          max_retries?: number
          next_retry_at?: string
          recipient_email?: string
          retry_count?: number
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          content: string
          created_at: string | null
          id: string
          profile_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          profile_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          profile_id?: string | null
        }
        Relationships: []
      }
      hashtag_suggestions: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          suggestion: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          suggestion: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          suggestion?: string
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          created_at: string | null
          id: string
          label: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          slug?: string
        }
        Relationships: []
      }
      hospitals: {
        Row: {
          city: string
          country: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          region: string | null
        }
        Insert: {
          city: string
          country?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          region?: string | null
        }
        Update: {
          city?: string
          country?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          connection_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          connection_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          connection_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: []
      }
      post_hashtags: {
        Row: {
          hashtag_id: string
          post_id: string
        }
        Insert: {
          hashtag_id: string
          post_id: string
        }
        Update: {
          hashtag_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'post_hashtags_hashtag_id_fkey'
            columns: ['hashtag_id']
            isOneToOne: false
            referencedRelation: 'hashtags'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'post_hashtags_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
        ]
      }
      post_reactions: {
        Row: {
          post_id: string
          profile_id: string
        }
        Insert: {
          post_id: string
          profile_id: string
        }
        Update: {
          post_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'post_reactions_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'post_reactions_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profile_categories: {
        Row: {
          category_id: string
          created_at: string
          detail: string | null
          id: string
          profile_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          detail?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          detail?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_categories_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_categories_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profile_hashtags: {
        Row: {
          hashtag_id: string
          profile_id: string
        }
        Insert: {
          hashtag_id: string
          profile_id: string
        }
        Update: {
          hashtag_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_hashtags_hashtag_id_fkey'
            columns: ['hashtag_id']
            isOneToOne: false
            referencedRelation: 'hashtags'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_hashtags_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          alias: string
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string
          created_at: string
          display_name: string | null
          email_notifications_enabled: boolean
          hospital_id: string | null
          id: string
          is_active: boolean
          region: string | null
          role: string
        }
        Insert: {
          alias: string
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string
          created_at?: string
          display_name?: string | null
          email_notifications_enabled?: boolean
          hospital_id?: string | null
          id: string
          is_active?: boolean
          region?: string | null
          role: string
        }
        Update: {
          alias?: string
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string
          created_at?: string
          display_name?: string | null
          email_notifications_enabled?: boolean
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          region?: string | null
          role?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          connection_id: string | null
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reported_id: string | null
          reporter_id: string | null
          resolved: boolean
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reported_id?: string | null
          reporter_id?: string | null
          resolved?: boolean
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reported_id?: string | null
          reporter_id?: string | null
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'reports_connection_id_fkey'
            columns: ['connection_id']
            isOneToOne: false
            referencedRelation: 'connections'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_reported_id_fkey'
            columns: ['reported_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      blocked_user_ids: {
        Args: Record<string, never>
        Returns: { user_id: string }[]
      }
      check_rate_limit: {
        Args: { p_action: string; p_max: number }
        Returns: { allowed: boolean; remaining: number }[]
      }
      get_unread_count: { Args: { user_uuid: string }; Returns: number }
      is_blocked_with: { Args: { p_other: string }; Returns: boolean }
      mark_connection_read: {
        Args: { p_connection_id: string }
        Returns: undefined
      }
      purge_old_rate_limits: { Args: Record<string, never>; Returns: number }
      requeue_stuck_emails: { Args: Record<string, never>; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Alias de conveniencia
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Hashtag = Database['public']['Tables']['hashtags']['Row']
export type ProfileHashtag = Database['public']['Tables']['profile_hashtags']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Connection = Database['public']['Tables']['connections']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type HashtagSuggestion = Database['public']['Tables']['hashtag_suggestions']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type Block = Database['public']['Tables']['blocks']['Row']
export type EmailQueue = Database['public']['Tables']['email_queue']['Row']
export type RateLimit = Database['public']['Tables']['rate_limits']['Row']
export type Post = Database['public']['Tables']['posts']['Row']

// `status` y `role` son `text` en la BD; estos son los valores que usa la app.
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected'
export type UserRole = 'seeker' | 'volunteer'
