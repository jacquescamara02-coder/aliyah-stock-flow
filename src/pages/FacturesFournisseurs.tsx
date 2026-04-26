import { useState, useEffect } from "react";
import {
  useFournisseurs,
  useAddFournisseur,
  useFacturesFournisseurs,
  useAddFactureFournisseur,
  useDeleteFactureFournisseur,
  useUpdateFactureFournisseur,
  type FactureFournisseur,
} from "@/hooks/useFournisseurs";
import { useProducts, useAddProduct } from "@/hooks/useProducts";
import { formatCFA } from "@/lib/store";
import { generateInvoicePDF, downloadPDF, getPDFBlob } from "@/lib/generateInvoicePDF";
import { motion } from "framer-motion";
import { Plus, Truck, Eye, Printer, FileText, Trash2, Download, Pencil, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DateFilter, filterByDateRange } from "@/components/DateFilter";

interface NewItem {
  product_id: string;
  reference: string;
  nom: string;
  quantite: string;
  prix_unitaire: string;
  __newProduct?: boolean;
  __category?: string;
  __prix_vente?: string;
  __stock_min?: string;
}

const emptyItem: NewItem = { product_id: "", reference: "", nom: "", quantite: "", prix_unitaire: "" };

async function buildFournisseurPDF(facture: any, products: any[]) {
  const enrichedItems = (facture.items || []).map((i: any) => {
    const prod = products.find((p: any) => p.id === i.product_id);
    return {
      reference: i.reference || prod?.reference || "",
      nom: i.nom,
      quantite: i.quantite,
      prix_unitaire: i.prix_unitaire,
    };
  });

  return generateInvoicePDF({
    numero: facture.numero_facture || facture.id.slice(0, 8).toUpperCase(),
    date: new Date(facture.date_facture).toLocaleDateString("fr-FR"),
    clientOrFournisseur: facture.fournisseur_nom,
    labelType: "Fournisseur",
    items: enrichedItems,
    total: facture.total,
  });
}

export default function FacturesFournisseurs() {
  const { data: fournisseurs = [] } = useFournisseurs();
  const { data: factures = [] } = useFacturesFournisseurs();
  const { data: products = [] } = useProducts();
  const addFournisseur = useAddFournisseur();
  const addProduct = useAddProduct();
  const addFacture = useAddFactureFournisseur();
  const deleteFacture = useDeleteFactureFournisseur();
  const updateFacture = useUpdateFactureFournisseur();

  const [showNewFournisseur, setShowNewFournisseur] = useState(false);
  const [fNom, setFNom] = useState("");
  const [fTel, setFTel] = useState("");
  const [fAdresse, setFAdresse] = useState("");

  const [showNewFacture, setShowNewFacture] = useState(false);
  const [editingFacture, setEditingFacture] = useState<FactureFournisseur | null>(null);
  const [selectedFournisseur, setSelectedFournisseur] = useState<string>("");
  const [numFacture, setNumFacture] = useState("");
  const [items, setItems] = useState<NewItem[]>([{ ...emptyItem }]);
  const [productSearch, setProductSearch] = useState("");

  const [preview, setPreview] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const DRAFT_KEY = "aliyah-facture-fourn-draft";

  // Restore draft on mount (only if not editing existing facture)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && (d.items?.length || d.selectedFournisseur || d.numFacture)) {
          setSelectedFournisseur(d.selectedFournisseur || "");
          setNumFacture(d.numFacture || "");
          setItems(d.items?.length ? d.items : [{ ...emptyItem }]);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft whenever form changes (only when creating, not editing)
  useEffect(() => {
    if (editingFacture) return;
    const hasContent =
      selectedFournisseur ||
      numFacture ||
      items.some((i) => i.nom || i.reference || i.quantite || i.prix_unitaire);
    if (hasContent) {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ selectedFournisseur, numFacture, items })
      );
    }
  }, [selectedFournisseur, numFacture, items, editingFacture]);

  const filteredFactures = filterByDateRange(factures, "date_facture", dateFrom, dateTo);

  const handleAddFournisseur = async () => {
    if (!fNom) { toast.error("Le nom est requis."); return; }
    try {
      await addFournisseur.mutateAsync({ nom: fNom, telephone: fTel, adresse: fAdresse });
      toast.success(`Fournisseur "${fNom}" ajouté.`);
      setShowNewFournisseur(false);
      setFNom(""); setFTel(""); setFAdresse("");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleProductSelect = (idx: number, productId: string) => {
    const updated = [...items];
    if (productId === "__NEW__") {
      updated[idx] = { ...updated[idx], product_id: "", __newProduct: true, reference: "", nom: "", prix_unitaire: "", __category: "", __prix_vente: "", __stock_min: "0" };
      setItems(updated);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updated[idx] = {
      ...updated[idx],
      product_id: productId,
      reference: product.reference,
      nom: product.name,
      prix_unitaire: String(product.prix_achat),
      __newProduct: false,
    };
    setItems(updated);
  };

  const resetForm = () => {
    setShowNewFacture(false);
    setEditingFacture(null);
    setSelectedFournisseur("");
    setNumFacture("");
    setItems([{ ...emptyItem }]);
    setProductSearch("");
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleSubmitFacture = async () => {
    const fournisseur = fournisseurs.find((f) => f.id === selectedFournisseur);
    if (!fournisseur) { toast.error("Sélectionnez un fournisseur."); return; }
    const validItems = items.filter((i) => i.nom && Number(i.quantite) > 0 && Number(i.prix_unitaire) > 0);
    if (validItems.length === 0) { toast.error("Ajoutez au moins un article."); return; }

    // Create new products first
    const resolvedItems: typeof validItems = [];
    for (const item of validItems) {
      if (item.__newProduct && !item.product_id) {
        if (!item.reference || !item.nom) { toast.error(`Référence et nom requis pour le nouveau produit "${item.nom || item.reference}".`); return; }
        try {
          const newProduct = await addProduct.mutateAsync({
            reference: item.reference,
            name: item.nom,
            category: item.__category || "",
            prix_achat: Number(item.prix_unitaire),
            prix_vente: Number(item.__prix_vente) || 0,
            stock: 0,
            stock_min: Number(item.__stock_min) || 0,
          });
          resolvedItems.push({ ...item, product_id: newProduct.id });
          toast.success(`Produit "${item.nom}" créé dans le stock.`);
        } catch (e: any) { toast.error(`Erreur création produit: ${e.message}`); return; }
      } else {
        resolvedItems.push(item);
      }
    }

    const mappedItems = resolvedItems.map((i) => ({
      product_id: i.product_id || undefined,
      reference: i.reference,
      nom: i.nom,
      quantite: Number(i.quantite),
      prix_unitaire: Number(i.prix_unitaire),
    }));

    try {
      if (editingFacture) {
        await updateFacture.mutateAsync({
          facture: editingFacture,
          fournisseur,
          numero_facture: numFacture,
          items: mappedItems,
        });
        toast.success("Facture modifiée. Stock mis à jour.");
      } else {
        await addFacture.mutateAsync({
          fournisseur,
          numero_facture: numFacture,
          items: mappedItems,
        });
        toast.success("Facture fournisseur enregistrée. Stock mis à jour.");
      }
      resetForm();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleEdit = (f: FactureFournisseur) => {
    setEditingFacture(f);
    setSelectedFournisseur(f.fournisseur_id || "");
    setNumFacture(f.numero_facture);
    setItems(
      (f.items || []).map((i) => ({
        product_id: i.product_id || "",
        reference: i.reference,
        nom: i.nom,
        quantite: String(i.quantite),
        prix_unitaire: String(i.prix_unitaire),
      }))
    );
    setShowNewFacture(true);
  };

  const handleDelete = async (f: FactureFournisseur) => {
    if (!confirm(`Supprimer la facture ${f.numero_facture || f.id.slice(0, 8).toUpperCase()} ? Le stock sera restauré.`)) return;
    try {
      await deleteFacture.mutateAsync(f);
      toast.success("Facture supprimée. Stock restauré.");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDownloadPDF = async (facture: any) => {
    try {
      const doc = await buildFournisseurPDF(facture, products);
      downloadPDF(doc, `Facture_Fournisseur_${(facture.numero_facture || facture.id.slice(0, 8)).toUpperCase()}.pdf`);
      toast.success("Facture PDF téléchargée.");
    } catch {
      toast.error("Erreur lors de la génération du PDF.");
    }
  };

  const handlePrintPDF = async (facture: any) => {
    try {
      const doc = await buildFournisseurPDF(facture, products);
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

  // Get product info helper
  const getProductInfo = (productId: string | null) => {
    if (!productId) return null;
    return products.find((p) => p.id === productId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factures Fournisseurs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filteredFactures.length} facture(s) {dateFrom || dateTo ? "filtrée(s)" : ""} — {fournisseurs.length} fournisseurs
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <DateFilter onFilter={(from, to) => { setDateFrom(from); setDateTo(to); }} />
          <Dialog open={showNewFournisseur} onOpenChange={setShowNewFournisseur}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-border text-foreground">
                <Truck className="w-4 h-4" /> Nouveau Fournisseur
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Ajouter un Fournisseur</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><label className="label-industrial">Nom *</label><input className="input-underline w-full mt-1" value={fNom} onChange={(e) => setFNom(e.target.value)} /></div>
                <div><label className="label-industrial">Téléphone</label><input className="input-underline w-full mt-1" value={fTel} onChange={(e) => setFTel(e.target.value)} /></div>
                <div><label className="label-industrial">Adresse</label><input className="input-underline w-full mt-1" value={fAdresse} onChange={(e) => setFAdresse(e.target.value)} /></div>
                <Button onClick={handleAddFournisseur} disabled={addFournisseur.isPending} className="w-full bg-primary text-primary-foreground font-bold">
                  {addFournisseur.isPending ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewFacture} onOpenChange={(open) => { if (!open) resetForm(); else setShowNewFacture(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-bold gap-2">
                <Plus className="w-4 h-4" /> Nouvelle Facture
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingFacture ? "Modifier la Facture Fournisseur" : "Enregistrer une Facture Fournisseur"}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-industrial">Fournisseur *</label>
                    <select className="input-underline w-full mt-1 bg-transparent" value={selectedFournisseur} onChange={(e) => setSelectedFournisseur(e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-industrial">N° Facture</label>
                    <input className="input-underline w-full mt-1 font-mono" value={numFacture} onChange={(e) => setNumFacture(e.target.value)} placeholder="FAC-001" />
                  </div>
                </div>

                <div>
                  <p className="label-industrial mb-2">Articles</p>
                  {items.map((item, idx) => {
                    const linkedProduct = getProductInfo(item.product_id || null);
                    return (
                      <div key={idx} className="border border-border rounded p-3 mb-2">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                          <div>
                            <select className="input-underline w-full bg-transparent text-sm" value={item.__newProduct ? "__NEW__" : item.product_id} onChange={(e) => handleProductSelect(idx, e.target.value)}>
                              <option value="">Produit (ou saisie libre)</option>
                              <option value="__NEW__" className="font-bold text-primary">➕ Créer un nouveau produit</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.reference} — {p.name} ({p.category}) [Stock: {p.stock}]
                                </option>
                              ))}
                            </select>
                            {item.__newProduct && (
                              <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded space-y-2">
                                <p className="text-xs font-bold text-primary flex items-center gap-1"><Plus className="w-3 h-3" /> Nouveau produit — sera créé automatiquement</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <input className="input-underline text-sm" placeholder="Référence *" value={item.reference} onChange={(e) => { const u = [...items]; u[idx].reference = e.target.value; setItems(u); }} />
                                  <input className="input-underline text-sm" placeholder="Nom produit *" value={item.nom} onChange={(e) => { const u = [...items]; u[idx].nom = e.target.value; setItems(u); }} />
                                  <input className="input-underline text-sm" placeholder="Catégorie / Modèle" value={item.__category || ""} onChange={(e) => { const u = [...items]; u[idx].__category = e.target.value; setItems(u); }} />
                                  <input className="input-underline text-sm" type="number" placeholder="Prix de vente" value={item.__prix_vente || ""} onChange={(e) => { const u = [...items]; u[idx].__prix_vente = e.target.value; setItems(u); }} />
                                  <input className="input-underline text-sm" type="number" placeholder="Stock minimum" value={item.__stock_min || ""} onChange={(e) => { const u = [...items]; u[idx].__stock_min = e.target.value; setItems(u); }} />
                                </div>
                              </div>
                            )}
                            {!item.product_id && !item.__newProduct && (
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <input className="input-underline text-sm" placeholder="Référence" value={item.reference} onChange={(e) => { const u = [...items]; u[idx].reference = e.target.value; setItems(u); }} />
                                <input className="input-underline text-sm" placeholder="Nom article" value={item.nom} onChange={(e) => { const u = [...items]; u[idx].nom = e.target.value; setItems(u); }} />
                              </div>
                            )}
                          </div>
                          <input className="input-underline w-20 font-mono text-sm" type="number" placeholder="Qté" value={item.quantite} onChange={(e) => { const u = [...items]; u[idx].quantite = e.target.value; setItems(u); }} />
                          <input className="input-underline w-28 font-mono text-sm" type="number" placeholder="Prix unit." value={item.prix_unitaire} onChange={(e) => { const u = [...items]; u[idx].prix_unitaire = e.target.value; setItems(u); }} />
                          {items.length > 1 && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        {linkedProduct && (
                          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Package className="w-3 h-3" /> Stock actuel: <strong className={linkedProduct.stock <= linkedProduct.stock_min ? "text-destructive" : "text-foreground"}>{linkedProduct.stock}</strong></span>
                            <span>Catégorie: <strong className="text-foreground">{linkedProduct.category || "—"}</strong></span>
                            <span>Prix vente: <strong className="text-foreground">{formatCFA(linkedProduct.prix_vente)}</strong></span>
                            <span className="font-mono text-primary font-bold">{Number(item.quantite) > 0 ? `→ Stock après: ${linkedProduct.stock + Number(item.quantite)}` : ""}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button size="sm" variant="outline" className="mt-2 gap-1 border-border text-foreground" onClick={() => setItems([...items, { ...emptyItem }])}>
                    <Plus className="w-3 h-3" /> Ajouter un article
                  </Button>
                </div>

                <div className="flex justify-between items-center border-t border-border pt-4">
                  <div>
                    <span className="label-industrial">Total</span>
                    <span className="text-xs text-muted-foreground ml-2">({items.filter(i => i.nom && Number(i.quantite) > 0).length} articles)</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-primary">
                    {formatCFA(items.reduce((s, i) => s + (Number(i.quantite) || 0) * (Number(i.prix_unitaire) || 0), 0))}
                  </span>
                </div>

                <Button onClick={handleSubmitFacture} disabled={addFacture.isPending || updateFacture.isPending} className="w-full bg-primary text-primary-foreground font-bold">
                  {addFacture.isPending || updateFacture.isPending ? "Enregistrement..." : editingFacture ? "Modifier la Facture" : "Enregistrer la Facture"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b border-border">
          <span className="label-industrial">N°</span>
          <span className="label-industrial">Fournisseur</span>
          <span className="label-industrial text-right">Total</span>
          <span className="label-industrial text-right">Date</span>
          <span className="label-industrial text-right">Actions</span>
        </div>
        {filteredFactures.map((f) => (
          <motion.div key={f.id} whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 p-4 border-b border-border items-center">
            <p className="font-mono text-sm font-bold text-primary">{f.numero_facture || f.id.slice(0, 8).toUpperCase()}</p>
            <div>
              <p className="font-medium">{f.fournisseur_nom}</p>
              <p className="text-xs text-muted-foreground">{(f.items || []).length} article(s)</p>
            </div>
            <p className="font-mono text-sm text-right font-bold">{formatCFA(f.total)}</p>
            <p className="font-mono text-xs text-muted-foreground text-right">{new Date(f.date_facture).toLocaleDateString("fr-FR")}</p>
            <div className="flex gap-1 justify-end">
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => setPreview(f)}>
                <Eye className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 border-primary/30 text-primary hover:bg-primary/10" onClick={() => handleEdit(f)} title="Modifier">
                <Pencil className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => handleDownloadPDF(f)}>
                <Download className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => handlePrintPDF(f)}>
                <Printer className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(f)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
        {filteredFactures.length === 0 && <p className="text-center text-muted-foreground py-8">Aucune facture fournisseur.</p>}
      </div>

      {/* Preview dialog — enriched with stock data */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Facture Fournisseur</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="mt-4 space-y-4">
              <div className="bg-foreground text-background p-8 rounded font-sans text-sm">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3"><img src="/images/logo-aliyah.jpeg" alt="Aliyah Shop" className="w-12 h-12 rounded-full object-cover" /><div><h2 className="text-xl font-bold">ALIYAH SHOP</h2><p className="text-xs opacity-60">Vente de Pièces Détachées de Moto</p></div></div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-lg">{preview.numero_facture || preview.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs opacity-60">{new Date(preview.date_facture).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <div className="mb-6"><p className="text-xs uppercase tracking-widest opacity-50 mb-1">Fournisseur</p><p className="font-bold">{preview.fournisseur_nom}</p></div>
                <table className="w-full mb-6">
                  <thead><tr className="border-b-2 border-background/20">
                    <th className="text-left py-2 text-xs uppercase tracking-widest opacity-50">Désignation</th>
                    <th className="text-right py-2 text-xs uppercase tracking-widest opacity-50">Qté</th>
                    <th className="text-right py-2 text-xs uppercase tracking-widest opacity-50">P.U.</th>
                    <th className="text-right py-2 text-xs uppercase tracking-widest opacity-50">Total</th>
                  </tr></thead>
                  <tbody>
                    {(preview.items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-background/10">
                        <td className="py-2"><span className="font-mono text-xs opacity-50">{item.reference}</span><br />{item.nom}</td>
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
                      <span className="font-mono font-bold text-lg">{formatCFA(preview.total)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-background/10 text-center text-xs opacity-40">ALIYAH SHOP — Hire Ouatta — Tél : 07 59 09 59 59 / 05 74 98 02 68</div>
              </div>

              {/* Stock impact section */}
              <div className="border border-border rounded p-4">
                <p className="label-industrial mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Impact sur le stock</p>
                <div className="space-y-2">
                  {(preview.items || []).map((item: any, idx: number) => {
                    const prod = getProductInfo(item.product_id);
                    return (
                      <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.nom}</span>
                          {prod ? (
                            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                              Lié au stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                              Non lié
                            </Badge>
                          )}
                        </div>
                        {prod ? (
                          <div className="flex items-center gap-3 font-mono text-xs">
                            <span className="text-muted-foreground">Stock: <strong className={prod.stock <= prod.stock_min ? "text-destructive" : "text-foreground"}>{prod.stock}</strong></span>
                            <span className="text-muted-foreground">Cat: <strong className="text-foreground">{prod.category || "—"}</strong></span>
                            <span className="text-muted-foreground">Vente: <strong className="text-foreground">{formatCFA(prod.prix_vente)}</strong></span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">+{item.quantite} unités (article libre)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleEdit(preview)} variant="outline" className="flex-1 gap-2 border-primary/30 text-primary">
                  <Pencil className="w-4 h-4" /> Modifier
                </Button>
                <Button onClick={() => handleDownloadPDF(preview)} className="flex-1 bg-primary text-primary-foreground font-bold gap-2">
                  <Download className="w-4 h-4" /> PDF
                </Button>
                <Button onClick={() => handlePrintPDF(preview)} variant="outline" className="flex-1 gap-2 border-border text-foreground">
                  <Printer className="w-4 h-4" /> Imprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
