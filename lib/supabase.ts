import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      children: {
        Row: {
          id: string
          user_id: string
          name: string
          date_of_birth: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['children']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['children']['Insert']>
      }
      coparent_connections: {
        Row: {
          id: string
          child_id: string
          parent1_id: string
          parent2_id: string
          parent1_split_pct: number
          parent2_split_pct: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['coparent_connections']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['coparent_connections']['Insert']>
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['expense_categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['expense_categories']['Insert']>
      }
      expenses: {
        Row: {
          id: string
          child_id: string
          paid_by_user_id: string
          category_id: string | null
          description: string
          amount: number
          date: string
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          parent_id: string
          share_pct: number
          amount_owed: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['expense_splits']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['expense_splits']['Insert']>
      }
    }
  }
}

