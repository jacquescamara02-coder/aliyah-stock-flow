import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { title: "Tableau de Bord", url: "/", icon: LayoutDashboard },
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Ventes", url: "/ventes", icon: ShoppingCart },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Factures", url: "/factures", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-[240px] min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm tracking-wide">ALIYAH SHOP</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Pièces Détachées</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
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

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
          v1.0 — Gestion de Stock
        </p>
      </div>
    </aside>
  );
}
