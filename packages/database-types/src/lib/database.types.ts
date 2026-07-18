export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      folders: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          parent_id: string | null;
          tint: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          parent_id?: string | null;
          tint?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          parent_id?: string | null;
          tint?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'folders_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'folders';
            referencedColumns: ['id'];
          },
        ];
      };
      note_attachments: {
        Row: {
          content_type: string;
          created_at: string | null;
          filename: string;
          id: string;
          note_id: string;
          size_bytes: number | null;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          content_type?: string;
          created_at?: string | null;
          filename: string;
          id?: string;
          note_id: string;
          size_bytes?: number | null;
          storage_path: string;
          user_id: string;
        };
        Update: {
          content_type?: string;
          created_at?: string | null;
          filename?: string;
          id?: string;
          note_id?: string;
          size_bytes?: number | null;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'note_attachments_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes';
            referencedColumns: ['id'];
          },
        ];
      };
      note_semantic_index: {
        Row: {
          content_hash: string;
          embedding: string;
          note_id: string;
          search_document: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content_hash?: string;
          embedding: string;
          note_id: string;
          search_document?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content_hash?: string;
          embedding?: string;
          note_id?: string;
          search_document?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'note_semantic_index_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: true;
            referencedRelation: 'notes';
            referencedColumns: ['id'];
          },
        ];
      };
      notes: {
        Row: {
          banner_attachment_id: string | null;
          content: Json;
          created_at: string | null;
          due_at: string | null;
          editor_settings: Json;
          folder_id: string | null;
          id: string;
          is_deadline: boolean;
          share_token: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          banner_attachment_id?: string | null;
          content?: Json;
          created_at?: string | null;
          due_at?: string | null;
          editor_settings?: Json;
          folder_id?: string | null;
          id?: string;
          is_deadline?: boolean;
          share_token?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          banner_attachment_id?: string | null;
          content?: Json;
          created_at?: string | null;
          due_at?: string | null;
          editor_settings?: Json;
          folder_id?: string | null;
          id?: string;
          is_deadline?: boolean;
          share_token?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_banner_attachment_id_fkey';
            columns: ['banner_attachment_id'];
            isOneToOne: false;
            referencedRelation: 'note_attachments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_folder_id_fkey';
            columns: ['folder_id'];
            isOneToOne: false;
            referencedRelation: 'folders';
            referencedColumns: ['id'];
          },
        ];
      };
      user_preferences: {
        Row: {
          delete_empty_folders: boolean;
          emoji_replacer_enabled: boolean;
          locale: string | null;
          open_todays_note_shortcut: boolean;
          semantic_search_enabled: boolean;
          show_note_backlinks: boolean;
          show_writing_activity_graph: boolean;
          updated_at: string;
          user_id: string;
          welcome_seeded: boolean;
          writing_activity_color: string;
          writing_activity_days: Json;
        };
        Insert: {
          delete_empty_folders?: boolean;
          emoji_replacer_enabled?: boolean;
          locale?: string | null;
          open_todays_note_shortcut?: boolean;
          semantic_search_enabled?: boolean;
          show_note_backlinks?: boolean;
          show_writing_activity_graph?: boolean;
          updated_at?: string;
          user_id: string;
          welcome_seeded?: boolean;
          writing_activity_color?: string;
          writing_activity_days?: Json;
        };
        Update: {
          delete_empty_folders?: boolean;
          emoji_replacer_enabled?: boolean;
          locale?: string | null;
          open_todays_note_shortcut?: boolean;
          semantic_search_enabled?: boolean;
          show_note_backlinks?: boolean;
          show_writing_activity_graph?: boolean;
          updated_at?: string;
          user_id?: string;
          welcome_seeded?: boolean;
          writing_activity_color?: string;
          writing_activity_days?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_note_semantic_index: {
        Args: {
          p_match_count?: number;
          p_query_embedding: string;
          p_user_id: string;
        };
        Returns: {
          distance: number;
          note_id: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
