import { useState } from "react";
import { useVentes } from "@/hooks/useVentes";
import { useClients } from "@/hooks/useClients";
import { formatCFA } from "@/lib/store";
import type { Vente, VenteItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, MessageCircle, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateInvoicePDF, downloadPDF } from "@/lib/generateInvoicePDF";

export default function Impayes() {
  const { data: ventes = [] } = useVentes();
  const { data: clients = [] } = useClients();
  const qc = useQueryClient();
  const [paymentVente, setPaymentVente] = useState<(Vente & { items?: VenteItem[] }) | null>(null);
  const [montantPartiel, setMontantPartiel] = useState("");

  const impayes = ventes.filter((v) => v.statut_paiement === "impayé" || (v.montant_paye > 0 && v.montant_paye < v.total && v.statut_paiement !== "payé"));
  const totalImpaye = impayes.reduce((s, v) => s + (v.total - (v.montant_paye || 0)), 0);

  const marquerPaye = async (venteId: string, total: number) => {
    const { error } = await supabase.from("ventes").update({ statut_paiement: "payé", montant_paye: total } as any).eq("id", venteId);
    if (error) { toast.error("Erreur lors de la mise à jour"); return; }
    toast.success("Marqué comme payé intégralement");
    qc.invalidateQueries({ queryKey: ["ventes"] });
  };

  const enregistrerPaiementPartiel = async () => {
    if (!paymentVente) return;
    const montant = Number(montantPartiel);
    if (isNaN(montant) || montant <= 0) { toast.error("Montant invalide"); return; }
    
    const nouveauMontantPaye = (paymentVente.montant_paye || 0) + montant;
    const estPayeComplet = nouveauMontantPaye >= paymentVente.total;
    
    const { error } = await supabase.from("ventes").update({
      montant_paye: Math.min(nouveauMontantPaye, paymentVente.total),
      statut_paiement: estPayeComplet ? "payé" : "impayé",
    } as any).eq("id", paymentVente.id);
    
    if (error) { toast.error("Erreur lors de la mise à jour"); return; }
    toast.success(`Paiement de ${formatCFA(montant)} enregistré${estPayeComplet ? " — Facture soldée !" : ""}`);
    setPaymentVente(null);
    setMontantPartiel("");
    qc.invalidateQueries({ queryKey: ["ventes"] });
  };

  const handleWhatsApp = (vente: Vente & { items?: VenteItem[] }) => {
    const client = clients.find(c => c.id === vente.client_id);
    const phone = client?.telephone?.replace(/\s/g, "").replace(/^0/, "225");
    const reste = vente.total - (vente.montant_paye || 0);
    
    const text = `📄 *FACTURE ALIYAH SHOP*\n\n` +
      `N°: ${vente.id.slice(0, 8).toUpperCase()}\n` +
      `Client: ${vente.client_nom}\n` +
      `Date: ${new Date(vente.created_at).toLocaleDateString('fr-FR')}\n\n` +
      (vente.items || []).map(i =>
        `▸ ${i.nom} x${i.quantite} — ${formatCFA(i.prix_unitaire * i.quantite)}`
      ).join('\n') +
      `\n\n*TOTAL: ${formatCFA(vente.total)}*\n` +
      `*Payé: ${formatCFA(vente.montant_paye || 0)}*\n` +
      `*Reste à payer: ${formatCFA(reste)}*\n\n` +
      `Merci de régulariser votre situation. 🙏`;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marchandises Non Payées</h1>
        <p className="text-muted-foreground text-sm mt-1">Suivi des livraisons en attente de paiement</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-destructive/30 rounded p-5 flex items-center justify-between">
        <div>
          <p className="label-industrial">Total Reste à Payer</p>
          <p className="font-mono text-2xl font-bold text-destructive">{formatCFA(totalImpaye)}</p>
        </div>
        <AlertCircle className="w-8 h-8 text-destructive" />
      </motion.div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_100px_100px_100px_140px] gap-0 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>Client</span>
          <span>Date</span>
          <span className="text-right">Total</span>
          <span className="text-right">Payé</span>
          <span className="text-right">Reste</span>
          <span className="text-center">Actions</span>
        </div>
        {impayes.map((v) => {
          const reste = v.total - (v.montant_paye || 0);
          const progression = v.total > 0 ? ((v.montant_paye || 0) / v.total) * 100 : 0;
          return (
            <div key={v.id} className="grid grid-cols-[1fr_1fr_100px_100px_100px_140px] gap-0 px-4 py-3 border-t border-border items-center text-sm">
              <span className="font-medium">{v.client_nom}</span>
              <span className="font-mono text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString("fr-FR")}</span>
              <span className="font-mono font-bold text-right">{formatCFA(v.total)}</span>
              <div className="text-right">
                <span className="font-mono text-xs text-primary">{formatCFA(v.montant_paye || 0)}</span>
                {progression > 0 && progression < 100 && (
                  <div className="w-full bg-muted rounded-full h-1 mt-1">
                    <div className="bg-primary h-1 rounded-full" style={{ width: `${progression}%` }} />
                  </div>
                )}
              </div>
              <span className="font-mono font-bold text-right text-destructive">{formatCFA(reste)}</span>
              <div className="flex gap-1 justify-center">
                <Button size="sm" variant="outline" onClick={() => { setPaymentVente(v); setMontantPartiel(""); }} className="text-xs gap-1">
                  <CreditCard className="w-3 h-3" /> Payer
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleWhatsApp(v)} className="text-xs gap-1 text-green-500 border-green-500/30 hover:bg-green-500/10">
                  <MessageCircle className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
        {impayes.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune marchandise impayée 🎉</p>}
      </div>

      <Dialog open={!!paymentVente} onOpenChange={() => setPaymentVente(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          {paymentVente && (
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <p className="text-sm"><span className="text-muted-foreground">Client :</span> <strong>{paymentVente.client_nom}</strong></p>
                <p className="text-sm"><span className="text-muted-foreground">Total facture :</span> <strong className="font-mono">{formatCFA(paymentVente.total)}</strong></p>
                <p className="text-sm"><span className="text-muted-foreground">Déjà payé :</span> <strong className="font-mono text-primary">{formatCFA(paymentVente.montant_paye || 0)}</strong></p>
                <p className="text-sm"><span className="text-muted-foreground">Reste à payer :</span> <strong className="font-mono text-destructive">{formatCFA(paymentVente.total - (paymentVente.montant_paye || 0))}</strong></p>
              </div>

              <div>
                <label className="label-industrial">Montant du paiement</label>
                <input
                  type="number"
                  min={0}
                  max={paymentVente.total - (paymentVente.montant_paye || 0)}
                  value={montantPartiel}
                  onChange={(e) => setMontantPartiel(e.target.value)}
                  placeholder="Ex: 50000"
                  className="input-underline w-full mt-1 font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={enregistrerPaiementPartiel} className="flex-1 bg-primary text-primary-foreground font-bold gap-2">
                  <CreditCard className="w-4 h-4" /> Enregistrer
                </Button>
                <Button variant="outline" onClick={() => marquerPaye(paymentVente.id, paymentVente.total)} className="flex-1 gap-2 border-border">
                  <CheckCircle className="w-4 h-4" /> Tout soldé
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
