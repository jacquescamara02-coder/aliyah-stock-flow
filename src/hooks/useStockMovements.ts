import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StockMovement {
  id: string;
  product_id: string;
  reference: string;
  nom: string;
  type: string;
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  motif: string;
  vente_id: string | null;
  created_at: string;
}

export function useStockMovements() {
  return useQuery<StockMovement[]>({
    queryKey: ["stock_movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
