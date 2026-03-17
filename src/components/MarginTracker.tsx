import { useVentes } from "@/hooks/useVentes";
import { formatCFA } from "@/lib/store";

export function MarginTracker() {
  const { data: ventes = [] } = useVentes();
  const totalMarge = ventes.reduce((sum, v) => sum + v.marge, 0);
  const totalCA = ventes.reduce((sum, v) => sum + v.total, 0);
  const margePercent = totalCA > 0 ? Math.round((totalMarge / totalCA) * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse-orange" />
        <span className="label-industrial">Marge Globale</span>
        <span className="font-mono text-sm font-bold text-primary">{margePercent}%</span>
      </div>
      <span className="label-industrial">|</span>
      <span className="font-mono text-xs text-muted-foreground">{formatCFA(totalMarge)}</span>
    </div>
  );
}
