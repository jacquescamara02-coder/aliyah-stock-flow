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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          adresse: string
          created_at: string
          id: string
          nom: string
          telephone: string
          total_achats: number
        }
        Insert: {
          adresse?: string
          created_at?: string
          id?: string
          nom: string
          telephone?: string
          total_achats?: number
        }
        Update: {
          adresse?: string
          created_at?: string
          id?: string
          nom?: string
          telephone?: string
          total_achats?: number
        }
        Relationships: []
      }
      depenses: {
        Row: {
          categorie: string
          created_at: string
          date_depense: string
          description: string
          id: string
          montant: number
        }
        Insert: {
          categorie?: string
          created_at?: string
          date_depense?: string
          description: string
          id?: string
          montant?: number
        }
        Update: {
          categorie?: string
          created_at?: string
          date_depense?: string
          description?: string
          id?: string
          montant?: number
        }
        Relationships: []
      }
      facture_fournisseur_items: {
        Row: {
          created_at: string
          facture_id: string
          id: string
          nom: string
          prix_unitaire: number
          product_id: string | null
          quantite: number
          reference: string
        }
        Insert: {
          created_at?: string
          facture_id: string
          id?: string
          nom: string
          prix_unitaire: number
          product_id?: string | null
          quantite: number
          reference?: string
        }
        Update: {
          created_at?: string
          facture_id?: string
          id?: string
          nom?: string
          prix_unitaire?: number
          product_id?: string | null
          quantite?: number
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "facture_fournisseur_items_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facture_fournisseur_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      factures_fournisseurs: {
        Row: {
          created_at: string
          date_facture: string
          fournisseur_id: string | null
          fournisseur_nom: string
          id: string
          numero_facture: string
          total: number
        }
        Insert: {
          created_at?: string
          date_facture?: string
          fournisseur_id?: string | null
          fournisseur_nom: string
          id?: string
          numero_facture?: string
          total?: number
        }
        Update: {
          created_at?: string
          date_facture?: string
          fournisseur_id?: string | null
          fournisseur_nom?: string
          id?: string
          numero_facture?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "factures_fournisseurs_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      fournisseurs: {
        Row: {
          adresse: string
          created_at: string
          id: string
          nom: string
          telephone: string
        }
        Insert: {
          adresse?: string
          created_at?: string
          id?: string
          nom: string
          telephone?: string
        }
        Update: {
          adresse?: string
          created_at?: string
          id?: string
          nom?: string
          telephone?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          prix_achat: number
          prix_vente: number
          reference: string
          stock: number
          stock_min: number
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          prix_achat?: number
          prix_vente?: number
          reference: string
          stock?: number
          stock_min?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          prix_achat?: number
          prix_vente?: number
          reference?: string
          stock?: number
          stock_min?: number
        }
        Relationships: []
      }
      stock_entries: {
        Row: {
          created_at: string
          id: string
          nom: string
          prix_achat: number
          product_id: string
          quantite: number
          reference: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom: string
          prix_achat: number
          product_id: string
          quantite: number
          reference: string
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
          prix_achat?: number
          product_id?: string
          quantite?: number
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          motif: string
          nom: string
          product_id: string
          quantite: number
          reference: string
          stock_apres: number
          stock_avant: number
          type: string
          vente_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          motif?: string
          nom: string
          product_id: string
          quantite: number
          reference?: string
          stock_apres?: number
          stock_avant?: number
          type?: string
          vente_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          motif?: string
          nom?: string
          product_id?: string
          quantite?: number
          reference?: string
          stock_apres?: number
          stock_avant?: number
          type?: string
          vente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      vente_items: {
        Row: {
          id: string
          nom: string
          prix_achat: number
          prix_unitaire: number
          product_id: string
          quantite: number
          reference: string
          vente_id: string
        }
        Insert: {
          id?: string
          nom: string
          prix_achat: number
          prix_unitaire: number
          product_id: string
          quantite: number
          reference: string
          vente_id: string
        }
        Update: {
          id?: string
          nom?: string
          prix_achat?: number
          prix_unitaire?: number
          product_id?: string
          quantite?: number
          reference?: string
          vente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vente_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vente_items_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      ventes: {
        Row: {
          client_id: string | null
          client_nom: string
          created_at: string
          id: string
          marge: number
          montant_paye: number
          statut_paiement: string
          total: number
        }
        Insert: {
          client_id?: string | null
          client_nom: string
          created_at?: string
          id?: string
          marge?: number
          montant_paye?: number
          statut_paiement?: string
          total?: number
        }
        Update: {
          client_id?: string | null
          client_nom?: string
          created_at?: string
          id?: string
          marge?: number
          montant_paye?: number
          statut_paiement?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ventes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
