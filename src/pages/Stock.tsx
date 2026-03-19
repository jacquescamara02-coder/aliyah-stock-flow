import { useState } from "react";
import { useProducts, useAddProduct, useUpdateStock, useDeleteProduct, useBulkAddProducts } from "@/hooks/useProducts";
import { formatCFA, getMarginPercent } from "@/lib/store";
import { motion } from "framer-motion";
import { Plus, Search, Package, Trash2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import ExcelImport from "@/components/ExcelImport";

export default function Stock() {
  const { data: products = [] } = useProducts();
  const addProduct = useAddProduct();
  const updateStock = useUpdateStock();
  const deleteProduct = useDeleteProduct();
  const bulkAdd = useBulkAddProducts();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showEntry, setShowEntry] = useState<string | null>(null);

  const [newRef, setNewRef] = useState("");
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newPrixAchat, setNewPrixAchat] = useState("");
  const [newPrixVente, setNewPrixVente] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newStockMin, setNewStockMin] = useState("");

  const [entryQty, setEntryQty] = useState("");
  const [entryPrix, setEntryPrix] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (!newRef || !newName || !newPrixAchat || !newPrixVente) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    try {
      await addProduct.mutateAsync({
        reference: newRef,
        name: newName,
        category: newCat,
        prix_achat: Number(newPrixAchat),
        prix_vente: Number(newPrixVente),
        stock: Number(newStock) || 0,
        stock_min: Number(newStockMin) || 5,
      });
      toast.success(`Produit "${newName}" ajouté avec succès.`);
      setShowAdd(false);
      setNewRef(""); setNewName(""); setNewCat(""); setNewPrixAchat(""); setNewPrixVente(""); setNewStock(""); setNewStockMin("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEntry = async () => {
    if (!entryQty || !entryPrix || !showEntry) return;
    const product = products.find((p) => p.id === showEntry);
    if (!product) return;
    try {
      await updateStock.mutateAsync({ productId: showEntry, quantite: Number(entryQty), prixAchat: Number(entryPrix), product });
      toast.success(`Stock mis à jour. ${entryQty} unités ajoutées pour ${product.name}.`);
      setShowEntry(null);
      setEntryQty(""); setEntryPrix("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventaire</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} produits en stock</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border text-foreground font-bold gap-2" onClick={() => setShowImport(true)}>
            <FileSpreadsheet className="w-4 h-4" /> Import Excel
          </Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-bold gap-2">
                <Plus className="w-4 h-4" /> Nouveau Produit
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Ajouter un Produit</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-industrial">Référence *</label>
                  <input className="input-underline w-full mt-1" value={newRef} onChange={(e) => setNewRef(e.target.value)} placeholder="REF-XXXX" />
                </div>
                <div>
                  <label className="label-industrial">Catégorie</label>
                  <input className="input-underline w-full mt-1" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Moteur, Freinage..." />
                </div>
              </div>
              <div>
                <label className="label-industrial">Nom du produit *</label>
                <input className="input-underline w-full mt-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Piston Kit - Yamaha 125" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-industrial">Prix d'achat (FCFA) *</label>
                  <input className="input-underline w-full mt-1 font-mono" type="number" value={newPrixAchat} onChange={(e) => setNewPrixAchat(e.target.value)} />
                </div>
                <div>
                  <label className="label-industrial">Prix de vente (FCFA) *</label>
                  <input className="input-underline w-full mt-1 font-mono" type="number" value={newPrixVente} onChange={(e) => setNewPrixVente(e.target.value)} />
                </div>
              </div>
              {newPrixAchat && newPrixVente && (
                <p className="text-sm font-mono text-primary">Marge : {getMarginPercent(Number(newPrixAchat), Number(newPrixVente))}%</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-industrial">Stock initial</label>
                  <input className="input-underline w-full mt-1 font-mono" type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} />
                </div>
                <div>
                  <label className="label-industrial">Stock minimum</label>
                  <input className="input-underline w-full mt-1 font-mono" type="number" value={newStockMin} onChange={(e) => setNewStockMin(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleAddProduct} disabled={addProduct.isPending} className="w-full bg-primary text-primary-foreground font-bold">
                {addProduct.isPending ? "Ajout..." : "Ajouter le Produit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input className="input-underline w-full pl-6" placeholder="Rechercher par nom, référence ou catégorie..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 p-4 border-b border-border">
          <span className="label-industrial">Produit</span>
          <span className="label-industrial">Catégorie</span>
          <span className="label-industrial text-right">Prix Achat</span>
          <span className="label-industrial text-right">Prix Vente</span>
          <span className="label-industrial text-right">Stock</span>
          <span className="label-industrial text-right">Marge</span>
          <span className="label-industrial text-right">Action</span>
        </div>
        {filtered.map((p) => (
          <motion.div key={p.id} whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 p-4 border-b border-border items-center">
            <div>
              <span className="text-xs text-muted-foreground font-mono">{p.reference}</span>
              <p className="font-medium">{p.name}</p>
            </div>
            <span className="text-xs text-muted-foreground">{p.category || "—"}</span>
            <p className="font-mono text-sm text-right">{formatCFA(p.prix_achat)}</p>
            <p className="font-mono text-sm text-right">{formatCFA(p.prix_vente)}</p>
            <p className={`font-mono text-lg text-right font-bold ${p.stock <= p.stock_min ? "text-destructive" : ""}`}>{p.stock}</p>
            <p className="font-mono text-lg text-right text-primary font-bold">{getMarginPercent(p.prix_achat, p.prix_vente)}%</p>
            <div className="flex gap-1 justify-end">
              <Dialog open={showEntry === p.id} onOpenChange={(open) => { setShowEntry(open ? p.id : null); if (open) setEntryPrix(String(p.prix_achat)); }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 border-border text-foreground"><Package className="w-3 h-3" /> Entrée</Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle>Entrée de Stock — {p.name}</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><label className="label-industrial">Quantité</label><input className="input-underline w-full mt-1 font-mono" type="number" value={entryQty} onChange={(e) => setEntryQty(e.target.value)} /></div>
                    <div><label className="label-industrial">Prix d'achat unitaire (FCFA)</label><input className="input-underline w-full mt-1 font-mono" type="number" value={entryPrix} onChange={(e) => setEntryPrix(e.target.value)} /></div>
                    <Button onClick={handleEntry} disabled={updateStock.isPending} className="w-full bg-primary text-primary-foreground font-bold">
                      {updateStock.isPending ? "Mise à jour..." : "Confirmer l'entrée"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="w-3 h-3" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer {p.name} ?</AlertDialogTitle>
                    <AlertDialogDescription>Cette action est irréversible. Le produit sera définitivement supprimé.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => {
                      try {
                        await deleteProduct.mutateAsync(p.id);
                        toast.success(`"${p.name}" supprimé.`);
                      } catch (e: any) { toast.error(e.message); }
                    }}>Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun produit trouvé.</p>}
      </div>

      <ExcelImport
        open={showImport}
        onOpenChange={setShowImport}
        onImport={async (rows) => {
          await bulkAdd.mutateAsync(rows);
        }}
      />
    </div>
  );
}
