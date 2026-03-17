import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCFA } from "@/lib/store";

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  type: "page" | "product" | "client";
  url: string;
}

const pages: SearchResult[] = [
  { id: "dashboard", label: "Tableau de Bord", sublabel: "Vue d'ensemble", type: "page", url: "/" },
  { id: "stock", label: "Inventaire / Stock", sublabel: "Gestion des produits", type: "page", url: "/stock" },
  { id: "ventes", label: "Nouvelle Vente", sublabel: "Créer une vente", type: "page", url: "/ventes" },
  { id: "clients", label: "Clients", sublabel: "Gestion des clients", type: "page", url: "/clients" },
  { id: "factures", label: "Factures", sublabel: "Historique des factures", type: "page", url: "/factures" },
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<SearchResult[]>([]);
  const [clients, setClients] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Load products and clients for search
    Promise.all([
      supabase.from("products").select("id, reference, name, prix_vente, category"),
      supabase.from("clients").select("id, nom, telephone, adresse"),
    ]).then(([prodRes, clientRes]) => {
      if (prodRes.data) {
        setProducts(
          prodRes.data.map((p) => ({
            id: p.id,
            label: p.name,
            sublabel: `${p.reference} — ${formatCFA(p.prix_vente)} — ${p.category}`,
            type: "product",
            url: "/stock",
          }))
        );
      }
      if (clientRes.data) {
        setClients(
          clientRes.data.map((c) => ({
            id: c.id,
            label: c.nom,
            sublabel: [c.telephone, c.adresse].filter(Boolean).join(" — "),
            type: "client",
            url: "/clients",
          }))
        );
      }
    });
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.url);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-card text-muted-foreground text-xs hover:border-primary/50 transition-colors"
      >
        <Search className="w-3 h-3" />
        <span>Recherche rapide</span>
        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher produit, client ou page..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

          <CommandGroup heading="Pages">
            {pages.map((p) => (
              <CommandItem key={p.id} onSelect={() => handleSelect(p)}>
                {p.id === "dashboard" && <LayoutDashboard className="mr-2 h-4 w-4" />}
                {p.id === "stock" && <Package className="mr-2 h-4 w-4" />}
                {p.id === "ventes" && <ShoppingCart className="mr-2 h-4 w-4" />}
                {p.id === "clients" && <Users className="mr-2 h-4 w-4" />}
                {p.id === "factures" && <FileText className="mr-2 h-4 w-4" />}
                <div>
                  <p>{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.sublabel}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          {products.length > 0 && (
            <CommandGroup heading="Produits">
              {products.map((p) => (
                <CommandItem key={p.id} onSelect={() => handleSelect(p)}>
                  <Package className="mr-2 h-4 w-4" />
                  <div>
                    <p>{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.sublabel}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {clients.length > 0 && (
            <CommandGroup heading="Clients">
              {clients.map((c) => (
                <CommandItem key={c.id} onSelect={() => handleSelect(c)}>
                  <Users className="mr-2 h-4 w-4" />
                  <div>
                    <p>{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.sublabel}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
