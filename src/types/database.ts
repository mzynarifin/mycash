export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          nim: string | null;
          avatar_url: string | null;
          currency: string;
          theme: string;
          email: string | null;
          is_suspended: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          nim?: string | null;
          avatar_url?: string | null;
          currency?: string;
          theme?: string;
          email?: string | null;
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          nim?: string | null;
          avatar_url?: string | null;
          currency?: string;
          theme?: string;
          email?: string | null;
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          description: string;
          expense_date: string;
          payment_method: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          description: string;
          expense_date: string;
          payment_method: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          description?: string;
          expense_date?: string;
          payment_method?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bills: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          notes: string | null;
          reference: string | null;
          amount: number;
          issue_date: string;
          due_date: string;
          status: string;
          audience: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          category?: string;
          notes?: string | null;
          reference?: string | null;
          amount: number;
          issue_date?: string;
          due_date: string;
          status?: string;
          audience?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          notes?: string | null;
          reference?: string | null;
          amount?: number;
          issue_date?: string;
          due_date?: string;
          status?: string;
          audience?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bill_assignments: {
        Row: {
          id: string;
          bill_id: string;
          user_id: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          user_id: string;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          bill_id?: string;
          user_id?: string;
          assigned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bill_assignments_bill_id_fkey";
            columns: ["bill_id"];
            isOneToOne: false;
            referencedRelation: "bills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bill_assignments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          assignment_id: string;
          user_id: string;
          amount: number;
          payment_method: string;
          payment_date: string;
          status: string;
          reject_reason: string | null;
          notes: string | null;
          reference: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          proof_object: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          user_id: string;
          amount: number;
          payment_method: string;
          payment_date?: string;
          status?: string;
          reject_reason?: string | null;
          notes?: string | null;
          reference?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          proof_object?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          user_id?: string;
          amount?: number;
          payment_method?: string;
          payment_date?: string;
          status?: string;
          reject_reason?: string | null;
          notes?: string | null;
          reference?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          proof_object?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "bill_assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          detail: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          detail?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          detail?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
