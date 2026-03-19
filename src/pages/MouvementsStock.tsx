import { useState } from "react";
import { useStockMovements } from "@/hooks/useStockMovements";
import { formatCFA } from "@/lib/store";
import { motion } from "framer-motion";
import { ArrowUpCircle, ArrowDownCircle, RotateCcw, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DateFilter, filterByDateRange } from "@/components/DateFilter";

const typeConfig: Record<string, { label: string; icon: typeof ArrowUpCircle; color: string; bg: string }> = {
  entree: { label: "Entrée", icon: ArrowUpCircle, color: "text-green-500", bg: "bg-green-500/10" },
  sortie: { label: "Sortie", icon: ArrowDownCircle, color: "text-destructive", bg: "bg-destructive/10" },
  retour: { label: "Retour", icon: RotateCcw, color: "text-blue-500", bg: "bg-blue-500/10" },
  annulation: { label: "Annulation", icon: RotateCcw, color: "text-amber-500", bg: "bg-amber-500/10" },
  modification: { label: "Modification", icon: RotateCcw, color: "text-purple-500", bg: "bg-purple-500/10" },
};

export default function MouvementsStock() {
  const { data: movements = [] } = useStockMovements();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  let filtered = filterByDateRange(movements, "created_at", dateFrom, dateTo);

  if (filterType !== "all") {
    filtered = filtered.filter((m) => m.type === filterType);
  }

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.nom.toLowerCase().includes(s) ||
        m.reference.toLowerCase().includes(s) ||
        m.motif.toLowerCase().includes(s)
    );
  }

  const totalEntrees = movements.filter((m) => m.type === "entree" || m.type === "retour").reduce((s, m) => s + m.quantite, 0);
  const totalSorties = movements.filter((m) => m.type === "sortie").reduce((s, m) => s + m.quantite, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mouvements de Stock</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Historique complet des entrées, sorties et retours
          </p>
        </div>
        <DateFilter onFilter={(from, to) => { setDateFrom(from); setDateTo(to); }} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded p-4">
          <p className="label-industrial text-xs">Total Mouvements</p>
          <p className="text-2xl font-bold font-mono mt-1">{filtered.length}</p>
        </div>
        <div className="bg-card border border-green-500/20 rounded p-4">
          <p className="label-industrial text-xs text-green-500">Entrées</p>
          <p className="text-2xl font-bold font-mono mt-1 text-green-500">+{totalEntrees}</p>
        </div>
        <div className="bg-card border border-destructive/20 rounded p-4">
          <p className="label-industrial text-xs text-destructive">Sorties</p>
          <p className="text-2xl font-bold font-mono mt-1 text-destructive">-{totalSorties}</p>
        </div>
        <div className="bg-card border border-border rounded p-4">
          <p className="label-industrial text-xs">Solde Net</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${totalEntrees - totalSorties >= 0 ? "text-green-500" : "text-destructive"}`}>
            {totalEntrees - totalSorties >= 0 ? "+" : ""}{totalEntrees - totalSorties}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="input-underline w-full pl-6"
            placeholder="Rechercher par produit, référence ou motif..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            className="input-underline bg-transparent text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all" className="bg-card">Tous</option>
            <option value="entree" className="bg-card">Entrées</option>
            <option value="sortie" className="bg-card">Sorties</option>
            <option value="retour" className="bg-card">Retours</option>
            <option value="annulation" className="bg-card">Annulations</option>
            <option value="modification" className="bg-card">Modifications</option>
          </select>
        </div>
      </div>

      {/* Movements List */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_1fr] gap-4 p-4 border-b border-border">
          <span className="label-industrial">Type</span>
          <span className="label-industrial">Produit</span>
          <span className="label-industrial text-right">Quantité</span>
          <span className="label-industrial text-right">Stock Avant</span>
          <span className="label-industrial text-right">Stock Après</span>
          <span className="label-industrial text-right">Date</span>
          <span className="label-industrial">Motif</span>
        </div>
        {filtered.map((m) => {
          const config = typeConfig[m.type] || typeConfig.entree;
          const Icon = config.icon;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_1fr] gap-4 p-4 border-b border-border items-center"
            >
              <Badge variant="outline" className={`${config.bg} ${config.color} border-transparent gap-1 text-xs font-medium`}>
                <Icon className="w-3 h-3" />
                {config.label}
              </Badge>
              <div>
                <span className="text-xs text-muted-foreground font-mono">{m.reference}</span>
                <p className="text-sm font-medium">{m.nom}</p>
              </div>
              <p className={`font-mono text-sm text-right font-bold ${m.type === "sortie" ? "text-destructive" : "text-green-500"}`}>
                {m.type === "sortie" ? "-" : "+"}{m.quantite}
              </p>
              <p className="font-mono text-sm text-right text-muted-foreground">{m.stock_avant}</p>
              <p className="font-mono text-sm text-right font-bold">{m.stock_apres}</p>
              <p className="font-mono text-xs text-muted-foreground text-right">
                {new Date(m.created_at).toLocaleDateString("fr-FR")}<br />
                <span className="text-[10px]">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              </p>
              <p className="text-xs text-muted-foreground truncate">{m.motif || "—"}</p>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Aucun mouvement de stock trouvé.</p>
        )}
      </div>
    </div>
  );
}
