import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, StockEntry } from "@/lib/store";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useStockEntries() {
  return useQuery<StockEntry[]>({
    queryKey: ["stock_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_entries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: { reference: string; name: string; category: string; prix_achat: number; prix_vente: number; stock: number; stock_min: number }) => {
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantite, prixAchat, product }: { productId: string; quantite: number; prixAchat: number; product: Product }) => {
      // Insert stock entry
      await supabase.from("stock_entries").insert({
        product_id: productId,
        reference: product.reference,
        nom: product.name,
        quantite,
        prix_achat: prixAchat,
      });
      const newStock = product.stock + quantite;
      // Update product stock
      const { error } = await supabase
        .from("products")
        .update({ stock: newStock, prix_achat: prixAchat })
        .eq("id", productId);
      if (error) throw error;
      // Record stock movement
      await supabase.from("stock_movements").insert({
        product_id: productId,
        reference: product.reference,
        nom: product.name,
        type: "entree",
        quantite,
        stock_avant: product.stock,
        stock_apres: newStock,
        motif: `Entrée de stock — Prix d'achat: ${prixAchat} FCFA`,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock_entries"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
    },
  });
}

export function useBulkAddProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (products: { reference: string; name: string; category: string; prix_achat: number; prix_vente: number; stock: number; stock_min: number }[]) => {
      const { data, error } = await supabase.from("products").insert(products).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, updates }: { productId: string; updates: { reference?: string; name?: string; category?: string; prix_achat?: number; prix_vente?: number; stock_min?: number } }) => {
      const { error } = await supabase.from("products").update(updates).eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
