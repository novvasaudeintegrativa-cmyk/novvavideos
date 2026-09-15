// Tipos manuais casando com supabase/migrations/*.sql.
// Depois que o projeto Supabase existir, regenerar com:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";
export type VideoStatus = "draft" | "processing" | "ready" | "error" | "archived";
export type VideoEventType = "view" | "play" | "progress" | "cta_click";
export type VideoEventMilestone = 25 | 50 | 75 | 100;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
        };
        Update: {
          full_name?: string | null;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          owner_id: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
        };
        Update: {
          role?: WorkspaceRole;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          name: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          thumbnail_url: string | null;
          status: VideoStatus;
          storage_path: string | null;
          source_url: string | null;
          duration_seconds: number | null;
          views_count: number;
          plays_count: number;
          cta_clicks_count: number;
          conversions_count: number;
          avg_watch_seconds: number | null;
          completion_rate: number | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          name: string;
          description?: string | null;
          thumbnail_url?: string | null;
          status?: VideoStatus;
          storage_path?: string | null;
          source_url?: string | null;
          duration_seconds?: number | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          status?: VideoStatus;
          storage_path?: string | null;
          source_url?: string | null;
          duration_seconds?: number | null;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      video_events: {
        Row: {
          id: string;
          video_id: string;
          session_id: string;
          event_type: VideoEventType;
          milestone: VideoEventMilestone | null;
          page_url: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          created_at: string;
        };
        Insert: {
          video_id: string;
          session_id: string;
          event_type: VideoEventType;
          milestone?: VideoEventMilestone | null;
          page_url?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      video_status: VideoStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
