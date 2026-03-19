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
        montant_paye: v.montant_paye ?? 0,
        items: v.vente_items || [],
      }));
    },
  });
}

export function useDeleteVente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (venteId: string) => {
      await supabase.from("vente_items").delete().eq("vente_id", venteId);
      const { error } = await supabase.from("ventes").delete().eq("id", venteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ventes"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateVente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ venteId, cart, client, statut_paiement }: { venteId: string; cart: CartItem[]; client: Client; statut_paiement?: string }) => {
      const total = cart.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0);
      const marge = cart.reduce((s, i) => s + (i.prixUnitaire - i.prixAchat) * i.quantite, 0);

      // Reverse old stock
      const { data: oldItems } = await supabase.from("vente_items").select("*").eq("vente_id", venteId);
      if (oldItems) {
        for (const item of oldItems) {
          const { data: prod } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
          if (prod) {
            await supabase.from("products").update({ stock: prod.stock + item.quantite }).eq("id", item.product_id);
          }
        }
      }

      await supabase.from("vente_items").delete().eq("vente_id", venteId);

      const updateData: any = { client_id: client.id, client_nom: client.nom, total, marge };
      if (statut_paiement) updateData.statut_paiement = statut_paiement;
      const { error: venteErr } = await supabase.from("ventes").update(updateData).eq("id", venteId);
      if (venteErr) throw venteErr;

      const items = cart.map((i) => ({
        vente_id: venteId,
        product_id: i.productId,
        reference: i.reference,
        nom: i.nom,
        quantite: i.quantite,
        prix_unitaire: i.prixUnitaire,
        prix_achat: i.prixAchat,
      }));
      await supabase.from("vente_items").insert(items);

      for (const item of cart) {
        const { data: prod } = await supabase.from("products").select("stock").eq("id", item.productId).single();
        if (prod) {
          await supabase.from("products").update({ stock: prod.stock - item.quantite }).eq("id", item.productId);
        }
      }

      return { id: venteId, items };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ventes"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useConfirmVente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cart, client, statut_paiement = "payé" }: { cart: CartItem[]; client: Client; statut_paiement?: string }) => {
      const total = cart.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0);
      const marge = cart.reduce((s, i) => s + (i.prixUnitaire - i.prixAchat) * i.quantite, 0);
      const montant_paye = statut_paiement === "payé" ? total : 0;

      const { data: vente, error: venteErr } = await supabase
        .from("ventes")
        .insert({ client_id: client.id, client_nom: client.nom, total, marge, statut_paiement, montant_paye } as any)
        .select()
        .single();
      if (venteErr) throw venteErr;

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

      for (const item of cart) {
        const { data: prod } = await supabase.from("products").select("stock").eq("id", item.productId).single();
        if (prod) {
          await supabase.from("products").update({ stock: prod.stock - item.quantite }).eq("id", item.productId);
        }
      }

      await supabase.from("clients").update({ total_achats: client.total_achats + total }).eq("id", client.id);

      return { ...vente, items };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ventes"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
