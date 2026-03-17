import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useClients } from "@/hooks/useClients";
import { useConfirmVente } from "@/hooks/useVentes";
import { useCartStore, formatCFA } from "@/lib/store";
import { motion } from "framer-motion";
import { Search, ShoppingCart, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Ventes() {
  const { data: products = [] } = useProducts();
  const { data: clients = [] } = useClients();
  const cart = useCartStore((s) => s.cart);
  const selectedClientId = useCartStore((s) => s.selectedClientId);
  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateCartQuantity = useCartStore((s) => s.updateCartQuantity);
  const updateCartPrice = useCartStore((s) => s.updateCartPrice);
  const setSelectedClient = useCartStore((s) => s.setSelectedClient);
  const clearCart = useCartStore((s) => s.clearCart);
  const confirmVente = useConfirmVente();

  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.reference.toLowerCase().includes(search.toLowerCase())) &&
      p.stock > 0
  );

  const cartTotal = cart.reduce((s, i) => s + i.prixUnitaire * i.quantite, 0);
  const cartMarge = cart.reduce((s, i) => s + (i.prixUnitaire - i.prixAchat) * i.quantite, 0);

  const handleConfirm = async () => {
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) { toast.error("Veuillez sélectionner un client."); return; }
    if (cart.length === 0) { toast.error("Le panier est vide."); return; }
    try {
      await confirmVente.mutateAsync({ cart, client });
      toast.success(`Vente confirmée. Total : ${formatCFA(cartTotal)}`);
      clearCart();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_380px] gap-6 h-[calc(100vh-8rem)]">
      <div className="space-y-4 overflow-hidden flex flex-col">
        <div>
          <h1 className="text-2xl font-bold">Nouvelle Vente</h1>
          <p className="text-muted-foreground text-sm mt-1">Sélectionnez les pièces à vendre</p>
        </div>
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="input-underline w-full pl-6" placeholder="Rechercher une pièce..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto space-y-0 bg-card border border-border rounded">
          {filtered.map((p) => (
            <motion.div key={p.id} whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              className="flex items-center justify-between p-4 border-b border-border cursor-pointer"
              onClick={() => { addToCart(p, 1); toast.success(`${p.name} ajouté au panier.`); }}>
              <div>
                <span className="text-xs text-muted-foreground font-mono">{p.reference}</span>
                <p className="font-medium">{p.name}</p>
              </div>
              <div className="flex gap-6 items-center">
                <div className="text-right">
                  <p className="label-industrial">Prix</p>
                  <p className="font-mono text-sm">{formatCFA(p.prix_vente)}</p>
                </div>
                <div className="text-right">
                  <p className="label-industrial">Stock</p>
                  <p className="font-mono text-lg">{p.stock}</p>
                </div>
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" /> Panier</h2>
        </div>
        <div className="p-4 border-b border-border">
          <label className="label-industrial">Client</label>
          <select className="input-underline w-full mt-1 bg-transparent" value={selectedClientId || ""} onChange={(e) => setSelectedClient(e.target.value || null)}>
            <option value="" className="bg-card">Sélectionner un client</option>
            {clients.map((c) => (<option key={c.id} value={c.id} className="bg-card">{c.nom}</option>))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Cliquez sur un produit pour l'ajouter</p>}
          {cart.map((item) => (
            <div key={item.productId} className="border border-border rounded p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{item.reference}</p>
                  <p className="text-sm font-medium">{item.nom}</p>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="label-industrial">Qté</label>
                  <input type="number" min={1} value={item.quantite} onChange={(e) => updateCartQuantity(item.productId, Math.max(1, Number(e.target.value)))} className="input-underline w-16 font-mono text-center" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="label-industrial">Prix</label>
                  <input type="number" min={0} value={item.prixUnitaire} onChange={(e) => updateCartPrice(item.productId, Math.max(0, Number(e.target.value)))} className="input-underline w-24 font-mono text-right" />
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold">{formatCFA(item.prixUnitaire * item.quantite)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex justify-between items-center">
            <span className="label-industrial">Total</span>
            <span className="font-mono text-xl font-bold">{formatCFA(cartTotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="label-industrial">Marge</span>
            <span className="font-mono text-lg text-primary font-bold">{formatCFA(cartMarge)}</span>
          </div>
          <Button onClick={handleConfirm} disabled={cart.length === 0 || !selectedClientId || confirmVente.isPending}
            className="w-full bg-primary text-primary-foreground font-bold gap-2">
            <Check className="w-4 h-4" /> {confirmVente.isPending ? "Validation..." : "Valider la Vente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
