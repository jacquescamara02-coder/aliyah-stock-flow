import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Fournisseur {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  created_at: string;
}

export interface FactureFournisseur {
  id: string;
  fournisseur_id: string | null;
  fournisseur_nom: string;
  numero_facture: string;
  total: number;
  date_facture: string;
  created_at: string;
  items?: FactureFournisseurItem[];
}

export interface FactureFournisseurItem {
  id: string;
  facture_id: string;
  product_id: string | null;
  reference: string;
  nom: string;
  quantite: number;
  prix_unitaire: number;
}

export function useFournisseurs() {
  return useQuery<Fournisseur[]>({
    queryKey: ["fournisseurs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fournisseurs")
        .select("*")
        .order("nom");
      if (error) throw error;
      return data;
    },
  });
}

export function useAddFournisseur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: { nom: string; telephone: string; adresse: string }) => {
      const { data, error } = await supabase.from("fournisseurs").insert(f).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fournisseurs"] }),
  });
}

export function useFacturesFournisseurs() {
  return useQuery<FactureFournisseur[]>({
    queryKey: ["factures_fournisseurs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factures_fournisseurs")
        .select("*, facture_fournisseur_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((f: any) => ({
        ...f,
        items: f.facture_fournisseur_items || [],
      }));
    },
  });
}

export function useAddFactureFournisseur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fournisseur,
      numero_facture,
      items,
    }: {
      fournisseur: Fournisseur;
      numero_facture: string;
      items: { product_id?: string; reference: string; nom: string; quantite: number; prix_unitaire: number }[];
    }) => {
      const total = items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0);

      const { data: facture, error } = await supabase
        .from("factures_fournisseurs")
        .insert({
          fournisseur_id: fournisseur.id,
          fournisseur_nom: fournisseur.nom,
          numero_facture,
          total,
        })
        .select()
        .single();
      if (error) throw error;

      const rows = items.map((i) => ({
        facture_id: facture.id,
        product_id: i.product_id || null,
        reference: i.reference,
        nom: i.nom,
        quantite: i.quantite,
        prix_unitaire: i.prix_unitaire,
      }));
      await supabase.from("facture_fournisseur_items").insert(rows);

      // Update product stock for linked products
      for (const item of items) {
        if (item.product_id) {
          const { data: prod } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          if (prod) {
            await supabase
              .from("products")
              .update({ stock: prod.stock + item.quantite, prix_achat: item.prix_unitaire })
              .eq("id", item.product_id);
          }
        }
      }

      return facture;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["factures_fournisseurs"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
