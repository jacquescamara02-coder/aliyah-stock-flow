import { useStore, formatCFA, getMarginPercent } from "@/lib/store";
import { KPICard } from "@/components/KPICard";
import { Package, TrendingUp, AlertTriangle, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const products = useStore((s) => s.products);
  const ventes = useStore((s) => s.ventes);
  const stockEntries = useStore((s) => s.stockEntries);

  // KPIs
  const valeurStock = products.reduce((sum, p) => sum + p.prixVente * p.stock, 0);
  const margeNette = ventes.reduce((sum, v) => sum + v.marge, 0);
  const alertes = products.filter((p) => p.stock <= p.stockMin).length;
  const ventesTotal = ventes.reduce((sum, v) => sum + v.total, 0);

  // Chart data - last 15 days
  const chartData = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i));
    const dateStr = d.toISOString().split('T')[0];
    const entrees = stockEntries.filter((e) => e.date === dateStr).reduce((s, e) => s + e.quantite * e.prixAchat, 0);
    const sorties = ventes.filter((v) => v.date === dateStr).reduce((s, v) => s + v.total, 0);
    return {
      date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      entrees,
      sorties,
    };
  });

  // Recent sales
  const recentVentes = [...ventes].reverse().slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tableau de Bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Valeur du Stock"
          value={formatCFA(valeurStock)}
          icon={<Package className="w-5 h-5" />}
        />
        <KPICard
          label="Chiffre d'Affaires"
          value={formatCFA(ventesTotal)}
          icon={<ShoppingCart className="w-5 h-5" />}
          accent
        />
        <KPICard
          label="Marge Nette"
          value={formatCFA(margeNette)}
          icon={<TrendingUp className="w-5 h-5" />}
          accent
        />
        <KPICard
          label="Alertes Rupture"
          value={String(alertes)}
          icon={<AlertTriangle className="w-5 h-5" />}
          danger={alertes > 0}
        />
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded p-6"
      >
        <h2 className="label-industrial mb-4">Flux Financier — 15 Derniers Jours</h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(155, 65%, 42%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(155, 65%, 42%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(30, 85%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(30, 85%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 18%)" />
              <XAxis dataKey="date" stroke="hsl(220, 10%, 55%)" fontSize={11} fontFamily="JetBrains Mono" />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} fontFamily="JetBrains Mono" tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}k` : '0'} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(220, 15%, 13%)', border: '1px solid hsl(220, 10%, 18%)', borderRadius: '4px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                labelStyle={{ color: 'hsl(220, 10%, 55%)' }}
                formatter={(value: number) => [formatCFA(value)]}
              />
              <Area type="monotone" dataKey="entrees" name="Entrées" stroke="hsl(155, 65%, 42%)" fill="url(#colorEntrees)" strokeWidth={2} />
              <Area type="monotone" dataKey="sorties" name="Sorties" stroke="hsl(30, 85%, 55%)" fill="url(#colorSorties)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Sales & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-card border border-border rounded p-6">
          <h2 className="label-industrial mb-4">Dernières Ventes</h2>
          <div className="space-y-0">
            {recentVentes.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{v.clientNom}</p>
                  <p className="text-xs text-muted-foreground font-mono">{v.id} — {v.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold">{formatCFA(v.total)}</p>
                  <p className="text-xs text-primary font-mono">+{formatCFA(v.marge)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-card border border-border rounded p-6">
          <h2 className="label-industrial mb-4">Alertes de Stock</h2>
          <div className="space-y-0">
            {products
              .filter((p) => p.stock <= p.stockMin)
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.reference}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="label-industrial">Stock</p>
                      <p className="font-mono text-lg text-destructive font-bold">{p.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="label-industrial">Min</p>
                      <p className="font-mono text-lg text-muted-foreground">{p.stockMin}</p>
                    </div>
                  </div>
                </div>
              ))}
            {products.filter((p) => p.stock <= p.stockMin).length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucune alerte</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
