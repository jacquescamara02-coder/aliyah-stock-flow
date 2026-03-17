import { useState } from "react";
import {
  useFournisseurs,
  useAddFournisseur,
  useFacturesFournisseurs,
  useAddFactureFournisseur,
} from "@/hooks/useFournisseurs";
import type { Fournisseur } from "@/hooks/useFournisseurs";
import { useProducts } from "@/hooks/useProducts";
import { formatCFA } from "@/lib/store";
import { motion } from "framer-motion";
import { Plus, Truck, Eye, Printer, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

const emptyItem: NewItem = { product_id: "", reference: "", nom: "", quantite: "", prix_unitaire: "" };

export default function FacturesFournisseurs() {
  const { data: fournisseurs = [] } = useFournisseurs();
  const { data: factures = [] } = useFacturesFournisseurs();
  const { data: products = [] } = useProducts();
  const addFournisseur = useAddFournisseur();
  const addFacture = useAddFactureFournisseur();

  const [showNewFournisseur, setShowNewFournisseur] = useState(false);
  const [fNom, setFNom] = useState("");
  const [fTel, setFTel] = useState("");
  const [fAdresse, setFAdresse] = useState("");

  const [showNewFacture, setShowNewFacture] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<string>("");
  const [numFacture, setNumFacture] = useState("");
  const [items, setItems] = useState<NewItem[]>([{ ...emptyItem }]);

  const [preview, setPreview] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

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
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      product_id: productId,
      reference: product.reference,
      nom: product.name,
      prix_unitaire: String(product.prix_achat),
    };
    setItems(updated);
  };

  const handleSubmitFacture = async () => {
    const fournisseur = fournisseurs.find((f) => f.id === selectedFournisseur);
    if (!fournisseur) { toast.error("Sélectionnez un fournisseur."); return; }
    const validItems = items.filter((i) => i.nom && Number(i.quantite) > 0 && Number(i.prix_unitaire) > 0);
    if (validItems.length === 0) { toast.error("Ajoutez au moins un article."); return; }
    try {
      await addFacture.mutateAsync({
        fournisseur,
        numero_facture: numFacture,
        items: validItems.map((i) => ({
          product_id: i.product_id || undefined,
          reference: i.reference,
          nom: i.nom,
          quantite: Number(i.quantite),
          prix_unitaire: Number(i.prix_unitaire),
        })),
      });
      toast.success("Facture fournisseur enregistrée. Stock mis à jour.");
      setShowNewFacture(false);
      setSelectedFournisseur("");
      setNumFacture("");
      setItems([{ ...emptyItem }]);
    } catch (e: any) { toast.error(e.message); }
  };

  const handlePrint = (facture: any) => {
    const date = new Date(facture.date_facture).toLocaleDateString("fr-FR");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Facture Fournisseur ${facture.numero_facture}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:40px;font-size:13px}
      h2{font-size:20px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:8px;text-align:left}
      th{border-bottom:2px solid #000;font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:.5}
      td{border-bottom:1px solid #eee}.right{text-align:right}.mono{font-family:'Courier New',monospace}
      .total-row{border-top:2px solid #000;font-weight:bold;font-size:16px}
      .footer{margin-top:40px;text-align:center;font-size:10px;opacity:.4}</style></head><body>
      <div style="display:flex;justify-content:space-between;margin-bottom:30px">
        <div><h2>ALIYAH SHOP</h2><small>Facture Fournisseur</small></div>
        <div style="text-align:right"><p class="mono" style="font-size:16px;font-weight:bold">${facture.numero_facture || facture.id.slice(0, 8).toUpperCase()}</p><small>${date}</small></div>
      </div>
      <div style="margin-bottom:20px"><p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:.5">Fournisseur</p><p style="font-weight:bold">${facture.fournisseur_nom}</p></div>
      <table><thead><tr><th>Désignation</th><th class="right">Qté</th><th class="right">P.U.</th><th class="right">Total</th></tr></thead><tbody>
      ${(facture.items || []).map((i: any) => `<tr><td><small class="mono" style="opacity:.5">${i.reference}</small><br/>${i.nom}</td><td class="right mono">${i.quantite}</td><td class="right mono">${formatCFA(i.prix_unitaire)}</td><td class="right mono" style="font-weight:bold">${formatCFA(i.prix_unitaire * i.quantite)}</td></tr>`).join("")}
      </tbody></table>
      <div style="display:flex;justify-content:flex-end"><div style="width:250px"><div class="total-row" style="display:flex;justify-content:space-between;padding-top:8px"><span>TOTAL</span><span class="mono">${formatCFA(facture.total)}</span></div></div></div>
      <p class="footer">ALIYAH SHOP — Facture Fournisseur</p></body></html>`);
    w.document.close();
    w.print();
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

          <Dialog open={showNewFacture} onOpenChange={setShowNewFacture}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-bold gap-2">
                <Plus className="w-4 h-4" /> Nouvelle Facture
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Enregistrer une Facture Fournisseur</DialogTitle></DialogHeader>
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
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 mb-2 items-end">
                      <div>
                        <select className="input-underline w-full bg-transparent text-sm" value={item.product_id} onChange={(e) => handleProductSelect(idx, e.target.value)}>
                          <option value="">Produit (ou saisie libre)</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.reference} — {p.name}</option>)}
                        </select>
                        {!item.product_id && (
                          <input className="input-underline w-full mt-1 text-sm" placeholder="Nom article" value={item.nom} onChange={(e) => { const u = [...items]; u[idx].nom = e.target.value; setItems(u); }} />
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
                  ))}
                  <Button size="sm" variant="outline" className="mt-2 gap-1 border-border text-foreground" onClick={() => setItems([...items, { ...emptyItem }])}>
                    <Plus className="w-3 h-3" /> Ajouter un article
                  </Button>
                </div>

                <div className="flex justify-between items-center border-t border-border pt-4">
                  <span className="label-industrial">Total</span>
                  <span className="font-mono font-bold text-lg text-primary">
                    {formatCFA(items.reduce((s, i) => s + (Number(i.quantite) || 0) * (Number(i.prix_unitaire) || 0), 0))}
                  </span>
                </div>

                <Button onClick={handleSubmitFacture} disabled={addFacture.isPending} className="w-full bg-primary text-primary-foreground font-bold">
                  {addFacture.isPending ? "Enregistrement..." : "Enregistrer la Facture"}
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
            <p className="font-medium">{f.fournisseur_nom}</p>
            <p className="font-mono text-sm text-right font-bold">{formatCFA(f.total)}</p>
            <p className="font-mono text-xs text-muted-foreground text-right">{new Date(f.date_facture).toLocaleDateString("fr-FR")}</p>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => setPreview(f)}>
                <Eye className="w-3 h-3" /> Voir
              </Button>
              <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={() => handlePrint(f)}>
                <Printer className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
        {factures.length === 0 && <p className="text-center text-muted-foreground py-8">Aucune facture fournisseur.</p>}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Facture Fournisseur</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="mt-4">
              <div className="bg-foreground text-background p-8 rounded font-sans text-sm">
                <div className="flex justify-between items-start mb-8">
                  <div><h2 className="text-xl font-bold">ALIYAH SHOP</h2><p className="text-xs opacity-60">Facture Fournisseur</p></div>
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
                <div className="mt-8 pt-4 border-t border-background/10 text-center text-xs opacity-40">ALIYAH SHOP — Facture Fournisseur</div>
              </div>
              <Button onClick={() => handlePrint(preview)} className="w-full mt-4 bg-primary text-primary-foreground font-bold gap-2">
                <Printer className="w-4 h-4" /> Imprimer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
