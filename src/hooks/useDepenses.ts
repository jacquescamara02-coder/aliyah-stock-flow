import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Depense {
  id: string;
  description: string;
  montant: number;
  categorie: string;
  date_depense: string;
  created_at: string;
}

export function useDepenses() {
  return useQuery<Depense[]>({
    queryKey: ["depenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("depenses")
        .select("*")
        .order("date_depense", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: { description: string; montant: number; categorie: string; date_depense?: string }) => {
      const { data, error } = await supabase.from("depenses").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["depenses"] }),
  });
}

export function useDeleteDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("depenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["depenses"] }),
  });
}
