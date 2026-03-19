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

async function recordMovement(params: {
  product_id: string;
  reference: string;
  nom: string;
  type: string;
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  motif: string;
  vente_id?: string | null;
}) {
  await supabase.from("stock_movements").insert({
    product_id: params.product_id,
    reference: params.reference,
    nom: params.nom,
    type: params.type,
    quantite: params.quantite,
    stock_avant: params.stock_avant,
    stock_apres: params.stock_apres,
    motif: params.motif,
    vente_id: params.vente_id || null,
  } as any);
}

export function useDeleteVente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (venteId: string) => {
      // Restore stock before deleting
      const { data: oldItems } = await supabase.from("vente_items").select("*").eq("vente_id", venteId);
      if (oldItems) {
        for (const item of oldItems) {
          const { data: prod } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
          if (prod) {
            const newStock = prod.stock + item.quantite;
            await supabase.from("products").update({ stock: newStock }).eq("id", item.product_id);
            await recordMovement({
              product_id: item.product_id,
              reference: item.reference,
              nom: item.nom,
              type: "annulation",
              quantite: item.quantite,
              stock_avant: prod.stock,
              stock_apres: newStock,
              motif: `Suppression facture ${venteId.slice(0, 8).toUpperCase()}`,
              vente_id: venteId,
            });
          }
        }
      }
      await supabase.from("vente_items").delete().eq("vente_id", venteId);
      const { error } = await supabase.from("ventes").delete().eq("id", venteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ventes"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
    },
  });
}

export function useUpdateVente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ venteId, cart, client, statut_paiement }: { venteId: string; cart: CartItem[]; client: Client; statut_paiement?: string }) => {
      const total = cart.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0);
      const marge = cart.reduce((s, i) => s + (i.prixUnitaire - i.prixAchat) * i.quantite, 0);

      // Reverse old stock with movement tracking
      const { data: oldItems } = await supabase.from("vente_items").select("*").eq("vente_id", venteId);
      if (oldItems) {
        for (const item of oldItems) {
          const { data: prod } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
          if (prod) {
            const newStock = prod.stock + item.quantite;
            await supabase.from("products").update({ stock: newStock }).eq("id", item.product_id);
            await recordMovement({
              product_id: item.product_id,
              reference: item.reference,
              nom: item.nom,
              type: "retour",
              quantite: item.quantite,
              stock_avant: prod.stock,
              stock_apres: newStock,
              motif: `Modification facture ${venteId.slice(0, 8).toUpperCase()} — retour stock`,
              vente_id: venteId,
            });
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

      // Deduct new stock with movement tracking
      for (const item of cart) {
        const { data: prod } = await supabase.from("products").select("stock").eq("id", item.productId).single();
        if (prod) {
          const newStock = prod.stock - item.quantite;
          await supabase.from("products").update({ stock: newStock }).eq("id", item.productId);
          await recordMovement({
            product_id: item.productId,
            reference: item.reference,
            nom: item.nom,
            type: "sortie",
            quantite: item.quantite,
            stock_avant: prod.stock,
            stock_apres: newStock,
            motif: `Modification facture ${venteId.slice(0, 8).toUpperCase()} — nouvelle vente`,
            vente_id: venteId,
          });
        }
      }

      return { id: venteId, items };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ventes"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
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

      // Deduct stock with movement tracking
      for (const item of cart) {
        const { data: prod } = await supabase.from("products").select("stock").eq("id", item.productId).single();
        if (prod) {
          const newStock = prod.stock - item.quantite;
          await supabase.from("products").update({ stock: newStock }).eq("id", item.productId);
          await recordMovement({
            product_id: item.productId,
            reference: item.reference,
            nom: item.nom,
            type: "sortie",
            quantite: item.quantite,
            stock_avant: prod.stock,
            stock_apres: newStock,
            motif: `Vente ${vente.id.slice(0, 8).toUpperCase()} — ${client.nom}`,
            vente_id: vente.id,
          });
        }
      }

      await supabase.from("clients").update({ total_achats: client.total_achats + total }).eq("id", client.id);

      return { ...vente, items };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ventes"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
    },
  });
}
