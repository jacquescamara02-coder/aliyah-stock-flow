import { useVentes } from "@/hooks/useVentes";
import { formatCFA } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function Impayes() {
  const { data: ventes = [] } = useVentes();
  const qc = useQueryClient();

  const impayes = ventes.filter((v) => (v as any).statut_paiement === "impayé");
  const totalImpaye = impayes.reduce((s, v) => s + v.total, 0);

  const marquerPaye = async (venteId: string) => {
    const { error } = await supabase.from("ventes").update({ statut_paiement: "payé" } as any).eq("id", venteId);
    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }
    toast.success("Marqué comme payé");
    qc.invalidateQueries({ queryKey: ["ventes"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marchandises Non Payées</h1>
        <p className="text-muted-foreground text-sm mt-1">Suivi des livraisons en attente de paiement</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-destructive/30 rounded p-5 flex items-center justify-between">
        <div>
          <p className="label-industrial">Total Impayé</p>
          <p className="font-mono text-2xl font-bold text-destructive">{formatCFA(totalImpaye)}</p>
        </div>
        <AlertCircle className="w-8 h-8 text-destructive" />
      </motion.div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_120px_120px_80px] gap-0 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>Client</span>
          <span>Date</span>
          <span className="text-right">Total</span>
          <span className="text-right">Marge</span>
          <span className="text-center">Action</span>
        </div>
        {impayes.map((v) => (
          <div key={v.id} className="grid grid-cols-[1fr_1fr_120px_120px_80px] gap-0 px-4 py-3 border-t border-border items-center text-sm">
            <span className="font-medium">{v.client_nom}</span>
            <span className="font-mono text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString("fr-FR")}</span>
            <span className="font-mono font-bold text-right">{formatCFA(v.total)}</span>
            <span className="font-mono text-right text-primary">+{formatCFA(v.marge)}</span>
            <div className="text-center">
              <Button size="sm" variant="outline" onClick={() => marquerPaye(v.id)} className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" /> Payé
              </Button>
            </div>
          </div>
        ))}
        {impayes.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune marchandise impayée 🎉</p>}
      </div>
    </div>
  );
}
