import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVentes, useDeleteVente, useUpdateVente } from "@/hooks/useVentes";
import { useProducts } from "@/hooks/useProducts";
import { useClients } from "@/hooks/useClients";
import { formatCFA } from "@/lib/store";
import type { Vente, VenteItem, CartItem } from "@/lib/store";
import { generateInvoicePDF, downloadPDF, getPDFBlob } from "@/lib/generateInvoicePDF";
import { motion } from "framer-motion";
import { FileText, Printer, Eye, Download, Plus, MessageCircle, Mail, Trash2, Pencil, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DateFilter, filterByDateRange } from "@/components/DateFilter";

function InvoicePreview({ vente, products = [] }: { vente: Vente & { items?: VenteItem[] }; products?: { id: string; category: string }[] }) {
  const date = new Date(vente.created_at).toLocaleDateString('fr-FR');
  const getCategory = (productId: string) => products.find(p => p.id === productId)?.category || "";
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
                {item.nom}{getCategory(item.product_id) ? ` — ${getCategory(item.product_id)}` : ""}
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

async function buildPDF(vente: Vente & { items?: VenteItem[] }, products: { id: string; category: string }[] = []) {
  const getCategory = (productId: string) => products.find(p => p.id === productId)?.category || "";
  return generateInvoicePDF({
    numero: vente.id.slice(0, 8).toUpperCase(),
    date: new Date(vente.created_at).toLocaleDateString('fr-FR'),
    clientOrFournisseur: vente.client_nom,
    labelType: "Client",
    items: (vente.items || []).map(i => ({
      reference: i.reference,
      nom: getCategory(i.product_id) ? `${i.nom} — ${getCategory(i.product_id)}` : i.nom,
      quantite: i.quantite,
      prix_unitaire: i.prix_unitaire,
    })),
    total: vente.total,
  });
}

// Edit invoice dialog component
function EditInvoiceDialog({ vente, open, onClose }: { vente: Vente & { items?: VenteItem[] }; open: boolean; onClose: () => void }) {
  const { data: products = [] } = useProducts();
  const { data: clients = [] } = useClients();
  const updateVente = useUpdateVente();

  const [editCart, setEditCart] = useState<CartItem[]>(
    (vente.items || []).map(i => ({
      productId: i.product_id,
      reference: i.reference,
      nom: i.nom,
      quantite: i.quantite,
      prixUnitaire: i.prix_unitaire,
      prixAchat: i.prix_achat,
    }))
  );
  const [editClientId, setEditClientId] = useState(vente.client_id || "");
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.reference.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())) &&
      !editCart.find(c => c.productId === p.id)
  );

  const addProduct = (p: typeof products[0]) => {
    setEditCart(prev => [...prev, {
      productId: p.id,
      reference: p.reference,
      nom: p.name,
      quantite: 1,
      prixUnitaire: p.prix_vente,
      prixAchat: p.prix_achat,
    }]);
  };

  const removeItem = (productId: string) => {
    setEditCart(prev => prev.filter(i => i.productId !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    setEditCart(prev => prev.map(i => i.productId === productId ? { ...i, quantite: Math.max(1, qty) } : i));
  };

  const updatePrice = (productId: string, price: number) => {
    setEditCart(prev => prev.map(i => i.productId === productId ? { ...i, prixUnitaire: Math.max(0, price) } : i));
  };

  const total = editCart.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0);

  const handleSave = async () => {
    const client = clients.find(c => c.id === editClientId);
    if (!client) { toast.error("Sélectionnez un client"); return; }
    if (editCart.length === 0) { toast.error("La facture ne peut pas être vide"); return; }
    try {
      await updateVente.mutateAsync({ venteId: vente.id, cart: editCart, client });
      toast.success("Facture modifiée avec succès");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4 text-primary" /> Modifier Facture {vente.id.slice(0, 8).toUpperCase()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Client */}
          <div>
            <label className="label-industrial">Client</label>
            <select className="input-underline w-full mt-1 bg-transparent" value={editClientId} onChange={(e) => setEditClientId(e.target.value)}>
              <option value="" className="bg-card">Sélectionner un client</option>
              {clients.map((c) => (<option key={c.id} value={c.id} className="bg-card">{c.nom}</option>))}
            </select>
          </div>

          {/* Current items */}
          <div>
            <label className="label-industrial">Articles de la facture</label>
            <div className="space-y-2 mt-2">
              {editCart.map((item) => (
                <div key={item.productId} className="border border-border rounded p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-mono text-muted-foreground">{item.reference}</p>
                    <p className="text-sm font-medium">{item.nom}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="label-industrial text-xs">Qté</label>
                    <input type="number" min={1} value={item.quantite} onChange={(e) => updateQty(item.productId, Number(e.target.value))} className="input-underline w-16 font-mono text-center text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="label-industrial text-xs">Prix</label>
                    <input type="number" min={0} value={item.prixUnitaire} onChange={(e) => updatePrice(item.productId, Number(e.target.value))} className="input-underline w-24 font-mono text-right text-sm" />
                  </div>
                  <p className="font-mono text-sm font-bold w-24 text-right">{formatCFA(item.prixUnitaire * item.quantite)}</p>
                  <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Add product */}
          <div>
            <label className="label-industrial">Ajouter un article</label>
            <div className="relative mt-1">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input className="input-underline w-full pl-6" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {search && (
              <div className="border border-border rounded mt-1 max-h-32 overflow-y-auto">
                {filtered.slice(0, 5).map(p => (
                  <div key={p.id} className="p-2 hover:bg-muted/50 cursor-pointer text-sm flex justify-between" onClick={() => { addProduct(p); setSearch(""); }}>
                    <span>{p.reference} — {p.name} <span className="text-muted-foreground text-xs">({p.category})</span></span>
                    <span className="font-mono">{formatCFA(p.prix_vente)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total + save */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <span className="label-industrial">Total : </span>
              <span className="font-mono text-xl font-bold">{formatCFA(total)}</span>
            </div>
            <Button onClick={handleSave} disabled={updateVente.isPending} className="bg-primary text-primary-foreground font-bold gap-2">
              <Check className="w-4 h-4" /> {updateVente.isPending ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Factures() {
  const navigate = useNavigate();
  const { data: ventes = [] } = useVentes();
  const { data: products = [] } = useProducts();
  const { data: clients = [] } = useClients();
  const deleteVente = useDeleteVente();
  const [preview, setPreview] = useState<(Vente & { items?: VenteItem[] }) | null>(null);
  const [editVente, setEditVente] = useState<(Vente & { items?: VenteItem[] }) | null>(null);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const filtered = filterByDateRange(ventes, "created_at", dateFrom, dateTo);

  const handleDownloadPDF = async (vente: Vente & { items?: VenteItem[] }) => {
    try {
      const doc = await buildPDF(vente, products);
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

  const handleWhatsApp = (vente: Vente & { items?: VenteItem[] }) => {
    const client = clients.find(c => c.id === vente.client_id);
    const rawPhone = client?.telephone?.replace(/\s/g, "");
    const phone = rawPhone ? rawPhone.replace(/^0/, "225") : "2250759095959";
    
    const text = `📄 *FACTURE ALIYAH SHOP*\n\n` +
      `N°: ${vente.id.slice(0, 8).toUpperCase()}\n` +
      `Client: ${vente.client_nom}\n` +
      `Date: ${new Date(vente.created_at).toLocaleDateString('fr-FR')}\n\n` +
      (vente.items || []).map(i =>
        `▸ ${i.nom} x${i.quantite} — ${formatCFA(i.prix_unitaire * i.quantite)}`
      ).join('\n') +
      `\n\n*TOTAL: ${formatCFA(vente.total)}*\n\nMerci pour votre confiance ! 🙏`;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
              <Button size="sm" variant="outline" className="gap-1 border-primary/30 text-primary hover:bg-primary/10" onClick={() => setEditVente(v)} title="Modifier">
                <Pencil className="w-3 h-3" />
              </Button>
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
                    <AlertDialogDescription>La facture {v.id.slice(0, 8).toUpperCase()} de {v.client_nom} sera définitivement supprimée.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => {
                      try {
                        await deleteVente.mutateAsync(v.id);
                        toast.success("Facture supprimée.");
                      } catch (e: any) { toast.error(e.message); }
                    }}>Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Preview Dialog */}
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

      {/* Edit Dialog */}
      {editVente && (
        <EditInvoiceDialog vente={editVente} open={!!editVente} onClose={() => setEditVente(null)} />
      )}
    </div>
  );
}
