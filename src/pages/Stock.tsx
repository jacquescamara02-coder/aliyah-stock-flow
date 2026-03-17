import { useState } from "react";
import { useStore, formatCFA, getMarginPercent } from "@/lib/store";
import { motion } from "framer-motion";
import { Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Stock() {
  const products = useStore((s) => s.products);
  const addProduct = useStore((s) => s.addProduct);
  const updateStock = useStore((s) => s.updateStock);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEntry, setShowEntry] = useState<string | null>(null);

  // New product form
  const [newRef, setNewRef] = useState("");
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newPrixAchat, setNewPrixAchat] = useState("");
  const [newPrixVente, setNewPrixVente] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newStockMin, setNewStockMin] = useState("");

  // Entry form
  const [entryQty, setEntryQty] = useState("");
  const [entryPrix, setEntryPrix] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddProduct = () => {
    if (!newRef || !newName || !newPrixAchat || !newPrixVente) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    addProduct({
      reference: newRef,
      name: newName,
      category: newCat,
      prixAchat: Number(newPrixAchat),
      prixVente: Number(newPrixVente),
      stock: Number(newStock) || 0,
      stockMin: Number(newStockMin) || 5,
    });
    toast.success(`Produit "${newName}" ajouté avec succès.`);
    setShowAdd(false);
    setNewRef(""); setNewName(""); setNewCat(""); setNewPrixAchat(""); setNewPrixVente(""); setNewStock(""); setNewStockMin("");
  };

  const handleEntry = () => {
    if (!entryQty || !entryPrix || !showEntry) return;
    updateStock(showEntry, Number(entryQty), Number(entryPrix));
    const product = products.find((p) => p.id === showEntry);
    toast.success(`Stock mis à jour. ${entryQty} unités ajoutées pour ${product?.name}.`);
    setShowEntry(null);
    setEntryQty(""); setEntryPrix("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventaire</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} produits en stock</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-bold gap-2">
              <Plus className="w-4 h-4" /> Nouveau Produit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Ajouter un Produit</DialogTitle>
            </DialogHeader>
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
                <p className="text-sm font-mono text-primary">
                  Marge : {getMarginPercent(Number(newPrixAchat), Number(newPrixVente))}%
                </p>
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
              <Button onClick={handleAddProduct} className="w-full bg-primary text-primary-foreground font-bold">
                Ajouter le Produit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="input-underline w-full pl-6"
          placeholder="Rechercher par nom, référence ou catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 p-4 border-b border-border">
          <span className="label-industrial">Produit</span>
          <span className="label-industrial text-right">Prix Achat</span>
          <span className="label-industrial text-right">Prix Vente</span>
          <span className="label-industrial text-right">Stock</span>
          <span className="label-industrial text-right">Marge</span>
          <span className="label-industrial text-right">Action</span>
        </div>
        {filtered.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 p-4 border-b border-border items-center"
          >
            <div>
              <span className="text-xs text-muted-foreground font-mono">{p.reference}</span>
              <p className="font-medium">{p.name}</p>
              <span className="text-xs text-muted-foreground">{p.category}</span>
            </div>
            <p className="font-mono text-sm text-right">{formatCFA(p.prixAchat)}</p>
            <p className="font-mono text-sm text-right">{formatCFA(p.prixVente)}</p>
            <p className={`font-mono text-lg text-right font-bold ${p.stock <= p.stockMin ? "text-destructive" : ""}`}>
              {p.stock}
            </p>
            <p className="font-mono text-lg text-right text-primary font-bold">
              {getMarginPercent(p.prixAchat, p.prixVente)}%
            </p>
            <Dialog open={showEntry === p.id} onOpenChange={(open) => {
              setShowEntry(open ? p.id : null);
              if (open) setEntryPrix(String(p.prixAchat));
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1 border-border text-foreground">
                  <Package className="w-3 h-3" /> Entrée
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Entrée de Stock — {p.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="label-industrial">Quantité</label>
                    <input className="input-underline w-full mt-1 font-mono" type="number" value={entryQty} onChange={(e) => setEntryQty(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-industrial">Prix d'achat unitaire (FCFA)</label>
                    <input className="input-underline w-full mt-1 font-mono" type="number" value={entryPrix} onChange={(e) => setEntryPrix(e.target.value)} />
                  </div>
                  <Button onClick={handleEntry} className="w-full bg-primary text-primary-foreground font-bold">
                    Confirmer l'entrée
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Aucun produit trouvé.</p>
        )}
      </div>
    </div>
  );
}
