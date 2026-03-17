import { ReactNode } from "react";
import { motion } from "framer-motion";

interface KPICardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: boolean;
  danger?: boolean;
}

export function KPICard({ label, value, icon, accent, danger }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded p-5 flex items-start justify-between ${
        danger ? "border-destructive/30" : ""
      }`}
    >
      <div className="space-y-2">
        <p className="label-industrial">{label}</p>
        <p className={`font-mono text-2xl font-bold ${
          accent ? "text-primary" : danger ? "text-destructive" : "text-foreground"
        }`}>
          {value}
        </p>
      </div>
      <div className={`p-2 rounded ${
        accent ? "bg-primary/10 text-primary" : danger ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
      }`}>
        {icon}
      </div>
    </motion.div>
  );
}
