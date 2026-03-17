import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

export function MarginTracker() {
  const ventes = useStore((s) => s.ventes);
  
  const today = new Date().toISOString().split('T')[0];
  const todayVentes = ventes.filter((v) => v.date === today);
  const todayRevenue = todayVentes.reduce((sum, v) => sum + v.total, 0);
  const todayMarge = todayVentes.reduce((sum, v) => sum + v.marge, 0);
  const marginPercent = todayRevenue > 0 ? (todayMarge / todayRevenue) * 100 : 0;
  
  const isLow = marginPercent > 0 && marginPercent < 15;

  return (
    <div className="h-1 w-full relative overflow-hidden bg-secondary">
      <motion.div
        className={`h-full ${isLow ? "bg-primary animate-pulse-orange" : "bg-success"}`}
        initial={{ width: "0%" }}
        animate={{ width: `${Math.min(marginPercent * 2, 100)}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </div>
  );
}
