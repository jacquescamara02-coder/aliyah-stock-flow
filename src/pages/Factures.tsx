import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVentes, useDeleteVente } from "@/hooks/useVentes";
import { formatCFA } from "@/lib/store";
import type { Vente, VenteItem } from "@/lib/store";
import { generateInvoicePDF, downloadPDF, getPDFBlob } from "@/lib/generateInvoicePDF";
import { motion } from "framer-motion";
import { FileText, Printer, Eye, Share2, Download, Plus, MessageCircle, Mail } from "lucide-react";
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
        ALIYAH SHOP — Hire Ouatta — Tél : 07 59 09 59 59 / 05 74 98 02 68
      </div>
    </div>
  );
}

async function buildPDF(vente: Vente & { items?: VenteItem[] }) {
  return generateInvoicePDF({
    numero: vente.id.slice(0, 8).toUpperCase(),
    date: new Date(vente.created_at).toLocaleDateString('fr-FR'),
    clientOrFournisseur: vente.client_nom,
    labelType: "Client",
    items: (vente.items || []).map(i => ({
      reference: i.reference,
      nom: i.nom,
      quantite: i.quantite,
      prix_unitaire: i.prix_unitaire,
    })),
    total: vente.total,
  });
}

export default function Factures() {
  const navigate = useNavigate();
  const { data: ventes = [] } = useVentes();
  const [preview, setPreview] = useState<(Vente & { items?: VenteItem[] }) | null>(null);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const filtered = filterByDateRange(ventes, "created_at", dateFrom, dateTo);

  const handleDownloadPDF = async (vente: Vente & { items?: VenteItem[] }) => {
    try {
      const doc = await buildPDF(vente);
      downloadPDF(doc, `Facture_${vente.id.slice(0, 8).toUpperCase()}.pdf`);
      toast.success("Facture PDF téléchargée.");
    } catch {
      toast.error("Erreur lors de la génération du PDF.");
    }
  };

  const handlePrintPDF = async (vente: Vente & { items?: VenteItem[] }) => {
    try {
      const doc = await buildPDF(vente);
      doc.autoPrint();
      const blob = getPDFBlob(doc);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.onafterprint = () => URL.revokeObjectURL(url);
      }
    } catch {
      toast.error("Erreur lors de l'impression.");
    }
  };

  const handleWhatsApp = async (vente: Vente & { items?: VenteItem[] }) => {
    const text = `📄 *FACTURE ALIYAH SHOP*\n\n` +
      `N°: ${vente.id.slice(0, 8).toUpperCase()}\n` +
      `Client: ${vente.client_nom}\n` +
      `Date: ${new Date(vente.created_at).toLocaleDateString('fr-FR')}\n\n` +
      (vente.items || []).map(i =>
        `▸ ${i.nom} x${i.quantite} — ${formatCFA(i.prix_unitaire * i.quantite)}`
      ).join('\n') +
      `\n\n*TOTAL: ${formatCFA(vente.total)}*\n\nMerci pour votre confiance ! 🙏`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmail = async (vente: Vente & { items?: VenteItem[] }) => {
    const subject = `Facture ALIYAH SHOP - ${vente.id.slice(0, 8).toUpperCase()}`;
    const body = `Bonjour ${vente.client_nom},\n\n` +
      `Veuillez trouver ci-dessous le récapitulatif de votre facture :\n\n` +
      `N° Facture: ${vente.id.slice(0, 8).toUpperCase()}\n` +
      `Date: ${new Date(vente.created_at).toLocaleDateString('fr-FR')}\n\n` +
      (vente.items || []).map(i =>
        `• ${i.nom} x${i.quantite} — ${formatCFA(i.prix_unitaire * i.quantite)}`
      ).join('\n') +
      `\n\nTOTAL: ${formatCFA(vente.total)}\n\n` +
      `Merci pour votre confiance.\n\nALIYAH SHOP\nVente de Pièces Détachées de Moto`;

    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
    toast.info("Ouvrez votre client email pour envoyer la facture.");
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
            <div className="flex gap-1 justify-end">
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => setPreview(v)}>
                <Eye className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => handleDownloadPDF(v)}>
                <Download className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => handlePrintPDF(v)}>
                <Printer className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-green-500 border-green-500/30 hover:bg-green-500/10" onClick={() => handleWhatsApp(v)}>
                <MessageCircle className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => handleEmail(v)}>
                <Mail className="w-3 h-3" />
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                <Button onClick={() => handleDownloadPDF(preview)} className="bg-primary text-primary-foreground font-bold gap-2">
                  <Download className="w-4 h-4" /> PDF
                </Button>
                <Button onClick={() => handlePrintPDF(preview)} variant="outline" className="gap-2 border-border text-foreground">
                  <Printer className="w-4 h-4" /> Imprimer
                </Button>
                <Button onClick={() => handleWhatsApp(preview)} variant="outline" className="gap-2 text-green-500 border-green-500/30 hover:bg-green-500/10">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </Button>
                <Button onClick={() => handleEmail(preview)} variant="outline" className="gap-2 border-border text-foreground">
                  <Mail className="w-4 h-4" /> Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
