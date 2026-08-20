export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          alias: string
          role: 'seeker' | 'volunteer'
          city: string
          country: string
          bio: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          alias: string
          role: 'seeker' | 'volunteer'
          city: string
          country?: string
          bio?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          alias?: string
          role?: 'seeker' | 'volunteer'
          city?: string
          country?: string
          bio?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      hashtags: {
        Row: {
          id: string
          slug: string
          label: string
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          label: string
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          label?: string
          created_at?: string
        }
      }
      profile_hashtags: {
        Row: {
          profile_id: string
          hashtag_id: string
        }
        Insert: {
          profile_id: string
          hashtag_id: string
        }
        Update: {
          profile_id?: string
          hashtag_id?: string
        }
      }
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          emoji: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          emoji: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          emoji?: string
        }
      }
      profile_categories: {
        Row: {
          profile_id: string
          category_id: string
        }
        Insert: {
          profile_id: string
          category_id: string
        }
        Update: {
          profile_id?: string
          category_id?: string
        }
      }
      connections: {
        Row: {
          id: string
          seeker_id: string
          volunteer_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          seeker_last_read_at: string | null
          volunteer_last_read_at: string | null
        }
        Insert: {
          id?: string
          seeker_id: string
          volunteer_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          seeker_last_read_at?: string | null
          volunteer_last_read_at?: string | null
        }
        Update: {
          id?: string
          seeker_id?: string
          volunteer_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          seeker_last_read_at?: string | null
          volunteer_last_read_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          connection_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          connection_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          connection_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          profile_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          content?: string
          created_at?: string
        }
      }
      hashtag_suggestions: {
        Row: {
          id: string
          profile_id: string | null
          suggestion: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          suggestion: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          suggestion?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string | null
          reported_id: string | null
          connection_id: string | null
          reason: string
          description: string | null
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id?: string | null
          reported_id?: string | null
          connection_id?: string | null
          reason: string
          description?: string | null
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string | null
          reported_id?: string | null
          connection_id?: string | null
          reason?: string
          description?: string | null
          resolved?: boolean
          created_at?: string
        }
      }
      blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
      }
      email_queue: {
        Row: {
          id: string
          recipient_email: string
          subject: string
          html_body: string
          from_email: string
          retry_count: number
          max_retries: number
          next_retry_at: string
          error_message: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipient_email: string
          subject: string
          html_body: string
          from_email?: string
          retry_count?: number
          max_retries?: number
          next_retry_at?: string
          error_message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipient_email?: string
          subject?: string
          html_body?: string
          from_email?: string
          retry_count?: number
          max_retries?: number
          next_retry_at?: string
          error_message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      rate_limits: {
        Row: {
          id: string
          user_id: string
          action: string
          count: number
          window_start: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          count?: number
          window_start?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          count?: number
          window_start?: string
        }
      }
    }
    Functions: {
      get_unread_count: {
        Args: { user_uuid: string }
        Returns: number
      }
    }
  }
}

// Convenience row types
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

export type ConnectionStatus = Connection['status']
export type UserRole = Profile['role']
