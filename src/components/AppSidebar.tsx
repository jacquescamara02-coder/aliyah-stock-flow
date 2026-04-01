import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVentes } from "@/hooks/useVentes";
import { useDepenses } from "@/hooks/useDepenses";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { formatCFA } from "@/lib/store";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Truck,
  TrendingUp,
  LogOut,
  Wallet,
  AlertCircle,
  ArrowLeftRight,
} from "lucide-react";

const navItems = [
  { title: "Tableau de Bord", url: "/", icon: LayoutDashboard },
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Mouvements Stock", url: "/mouvements-stock", icon: ArrowLeftRight },
  { title: "Ventes", url: "/ventes", icon: ShoppingCart },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Factures Clients", url: "/factures", icon: FileText },
  { title: "Factures Fournisseurs", url: "/fournisseurs", icon: Truck },
  { title: "Dépenses Diverses", url: "/depenses", icon: Wallet },
  { title: "Impayés", url: "/impayes", icon: AlertCircle },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { data: ventes = [] } = useVentes();
  const { data: depenses = [] } = useDepenses();

  const today = new Date().toISOString().split("T")[0];
  const ventesJour = ventes.filter((v) => v.created_at.startsWith(today));
  const caJour = ventesJour.reduce((s, v) => s + v.total, 0);
  const margeJour = ventesJour.reduce((s, v) => s + v.marge, 0);
  const depensesJour = depenses.filter((d) => d.date_depense.startsWith(today)).reduce((s, d) => s + d.montant, 0);

  return (
    <aside className="w-[240px] h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src="/images/logo-aliyah.jpeg" alt="Aliyah Shop" className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30" />
          <div>
            <h1 className="font-bold text-foreground text-sm tracking-wide">ALIYAH SHOP</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight">Vente de Pièces Détachées de Moto</p>
          </div>
        </div>
      </div>

      {/* Daily KPIs */}
      <div className="px-4 pt-4 pb-2 space-y-1.5 border-b border-sidebar-border">
        <p className="label-industrial px-1 mb-2">Aujourd'hui</p>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] text-muted-foreground">CA Jour</span>
          <span className="font-mono text-xs font-bold text-primary">{formatCFA(caJour)}</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] text-muted-foreground">Marge Jour</span>
          <span className="font-mono text-xs font-bold text-accent-foreground">{formatCFA(margeJour)}</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] text-muted-foreground">Dépenses</span>
          <span className="font-mono text-xs font-bold text-destructive">-{formatCFA(depensesJour)}</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 border-t border-sidebar-border pt-1.5">
          <span className="text-[11px] text-muted-foreground font-medium">Bénéfice Net</span>
          <span className={`font-mono text-xs font-bold ${margeJour - depensesJour >= 0 ? "text-primary" : "text-destructive"}`}>
            {formatCFA(margeJour - depensesJour)}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="label-industrial mb-3 px-3">Navigation</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
              activeClassName=""
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        {user && (
          <div className="px-3 pb-2">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <ThemeSwitcher />
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
        <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest pt-2">
          v1.0 — Gestion de Stock
        </p>
      </div>
    </aside>
  );
}
