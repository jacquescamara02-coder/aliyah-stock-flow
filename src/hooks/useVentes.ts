import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Vente, VenteItem, CartItem, Client } from "@/lib/store";

export function useVentes() {
  return useQuery<(Vente & { items: VenteItem[] })[]>({
    queryKey: ["ventes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ventes")
        .select("*, vente_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((v: any) => ({
        ...v,
        items: v.vente_items || [],
      }));
    },
  });
}

export function useConfirmVente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cart, client }: { cart: CartItem[]; client: Client }) => {
      const total = cart.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0);
      const marge = cart.reduce((s, i) => s + (i.prixUnitaire - i.prixAchat) * i.quantite, 0);

      // Create vente
      const { data: vente, error: venteErr } = await supabase
        .from("ventes")
        .insert({ client_id: client.id, client_nom: client.nom, total, marge })
        .select()
        .single();
      if (venteErr) throw venteErr;

      // Create items
      const items = cart.map((i) => ({
        vente_id: vente.id,
        product_id: i.productId,
        reference: i.reference,
        nom: i.nom,
        quantite: i.quantite,
        prix_unitaire: i.prixUnitaire,
        prix_achat: i.prixAchat,
      }));
      await supabase.from("vente_items").insert(items);

      // Update product stocks
      for (const item of cart) {
        const { data: prod } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.productId)
          .single();
        if (prod) {
          await supabase
            .from("products")
            .update({ stock: prod.stock - item.quantite })
            .eq("id", item.productId);
        }
      }

      // Update client total
      await supabase
        .from("clients")
        .update({ total_achats: client.total_achats + total })
        .eq("id", client.id);

      return { ...vente, items };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ventes"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
