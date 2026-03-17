import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVentes } from "@/hooks/useVentes";
import { formatCFA } from "@/lib/store";
import type { Vente, VenteItem } from "@/lib/store";
import { motion } from "framer-motion";
import { FileText, Printer, Eye, Share2, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DateFilter, filterByDateRange } from "@/components/DateFilter";

function InvoicePreview({ vente }: { vente: Vente & { items?: VenteItem[] } }) {
  const date = new Date(vente.created_at).toLocaleDateString('fr-FR');
  return (
    <div className="bg-foreground text-background p-8 rounded font-sans text-sm">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-3">
          <img src="/images/logo-aliyah.jpeg" alt="Aliyah Shop" className="w-14 h-14 rounded-full object-cover" />
          <div>
            <h2 className="text-xl font-bold">ALIYAH SHOP</h2>
            <p className="text-xs opacity-60">Vente de Pièces Détachées de Moto</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold text-lg">{vente.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs opacity-60">{date}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Client</p>
        <p className="font-bold">{vente.client_nom}</p>
      </div>

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-background/20">
            <th className="text-left py-2 text-xs uppercase tracking-widest opacity-50">Désignation</th>
            <th className="text-right py-2 text-xs uppercase tracking-widest opacity-50">Qté</th>
            <th className="text-right py-2 text-xs uppercase tracking-widest opacity-50">P.U.</th>
            <th className="text-right py-2 text-xs uppercase tracking-widest opacity-50">Total</th>
          </tr>
        </thead>
        <tbody>
          {vente.items?.map((item, idx) => (
            <tr key={idx} className="border-b border-background/10">
              <td className="py-2">
                <span className="font-mono text-xs opacity-50">{item.reference}</span><br />
                {item.nom}
              </td>
              <td className="text-right py-2 font-mono">{item.quantite}</td>
              <td className="text-right py-2 font-mono">{formatCFA(item.prix_unitaire)}</td>
              <td className="text-right py-2 font-mono font-bold">{formatCFA(item.prix_unitaire * item.quantite)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between border-t-2 border-background/20 pt-2">
            <span className="font-bold">TOTAL</span>
            <span className="font-mono font-bold text-lg">{formatCFA(vente.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-background/10 text-center text-xs opacity-40">
        ALIYAH SHOP — Merci pour votre confiance
      </div>
    </div>
  );
}

function buildInvoiceHTML(vente: Vente & { items?: VenteItem[] }) {
  const date = new Date(vente.created_at).toLocaleDateString('fr-FR');
  return `<html><head><title>Facture ${vente.id.slice(0, 8)}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Arial', sans-serif; padding: 40px; font-size: 13px; }
      h2 { font-size: 20px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { padding: 8px; text-align: left; }
      th { border-bottom: 2px solid #000; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; }
      td { border-bottom: 1px solid #eee; }
      .right { text-align: right; }
      .mono { font-family: 'Courier New', monospace; }
      .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
      .total-row { border-top: 2px solid #000; font-weight: bold; font-size: 16px; }
      .footer { margin-top: 40px; text-align: center; font-size: 10px; opacity: 0.4; }
      .client { margin-bottom: 20px; }
      .client-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.5; }
    </style></head><body>
    <div class="header">
      <div style="display:flex;align-items:center;gap:12px"><img src="${window.location.origin}/images/logo-aliyah.jpeg" style="width:50px;height:50px;border-radius:50%;object-fit:cover" /><div><h2>ALIYAH SHOP</h2><small>Vente de Pièces Détachées de Moto</small></div></div>
      <div style="text-align:right"><p class="mono" style="font-size:16px;font-weight:bold">${vente.id.slice(0, 8).toUpperCase()}</p><small>${date}</small></div>
    </div>
    <div class="client"><p class="client-label">Client</p><p style="font-weight:bold">${vente.client_nom}</p></div>
    <table>
      <thead><tr><th>Désignation</th><th class="right">Qté</th><th class="right">P.U.</th><th class="right">Total</th></tr></thead>
      <tbody>
        ${(vente.items || []).map(i => `<tr><td><small class="mono" style="opacity:0.5">${i.reference}</small><br/>${i.nom}</td><td class="right mono">${i.quantite}</td><td class="right mono">${formatCFA(i.prix_unitaire)}</td><td class="right mono" style="font-weight:bold">${formatCFA(i.prix_unitaire * i.quantite)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div style="display:flex;justify-content:flex-end">
      <div style="width:250px">
        <div class="total-row" style="display:flex;justify-content:space-between;padding-top:8px">
          <span>TOTAL</span><span class="mono">${formatCFA(vente.total)}</span>
        </div>
      </div>
    </div>
    <p class="footer">ALIYAH SHOP — Vente de Pièces Détachées de Moto — Merci pour votre confiance</p>
    </body></html>`;
}

export default function Factures() {
  const navigate = useNavigate();
  const { data: ventes = [] } = useVentes();
  const [preview, setPreview] = useState<(Vente & { items?: VenteItem[] }) | null>(null);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const filtered = filterByDateRange(ventes, "created_at", dateFrom, dateTo);

  const handlePrint = (vente: Vente & { items?: VenteItem[] }) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(buildInvoiceHTML(vente));
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = (vente: Vente & { items?: VenteItem[] }) => {
    const html = buildInvoiceHTML(vente);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facture_${vente.id.slice(0, 8).toUpperCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Facture téléchargée.");
  };

  const handleShare = async (vente: Vente & { items?: VenteItem[] }) => {
    const text = `Facture ALIYAH SHOP\nN°: ${vente.id.slice(0, 8).toUpperCase()}\nClient: ${vente.client_nom}\nTotal: ${formatCFA(vente.total)}\nDate: ${new Date(vente.created_at).toLocaleDateString('fr-FR')}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Facture ${vente.id.slice(0, 8).toUpperCase()}`, text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Détails de la facture copiés dans le presse-papier.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factures Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} facture(s) {dateFrom || dateTo ? "filtrée(s)" : "générées"}</p>
        </div>
        <div className="flex items-center gap-3">
          <DateFilter onFilter={(from, to) => { setDateFrom(from); setDateTo(to); }} />
          <Button onClick={() => navigate("/ventes")} className="bg-primary text-primary-foreground font-bold gap-2">
            <Plus className="w-4 h-4" /> Émettre une facture
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b border-border">
          <span className="label-industrial">N°</span>
          <span className="label-industrial">Client</span>
          <span className="label-industrial text-right">Total</span>
          <span className="label-industrial text-right">Date</span>
          <span className="label-industrial text-right">Actions</span>
        </div>
        {filtered.map((v) => (
          <motion.div key={v.id} whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b border-border items-center">
            <p className="font-mono text-sm font-bold text-primary">{v.id.slice(0, 8).toUpperCase()}</p>
            <p className="font-medium">{v.client_nom}</p>
            <p className="font-mono text-sm text-right font-bold">{formatCFA(v.total)}</p>
            <p className="font-mono text-xs text-muted-foreground text-right">{new Date(v.created_at).toLocaleDateString('fr-FR')}</p>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => setPreview(v)}>
                <Eye className="w-3 h-3" /> Voir
              </Button>
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => handlePrint(v)}>
                <Printer className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => handleDownload(v)}>
                <Download className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => handleShare(v)}>
                <Share2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Aperçu Facture</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="mt-4">
              <InvoicePreview vente={preview} />
              <div className="flex gap-2 mt-4">
                <Button onClick={() => handlePrint(preview)} className="flex-1 bg-primary text-primary-foreground font-bold gap-2">
                  <Printer className="w-4 h-4" /> Imprimer
                </Button>
                <Button onClick={() => handleDownload(preview)} variant="outline" className="flex-1 gap-2 border-border text-foreground">
                  <Download className="w-4 h-4" /> Télécharger
                </Button>
                <Button onClick={() => handleShare(preview)} variant="outline" className="gap-2 border-border text-foreground">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
