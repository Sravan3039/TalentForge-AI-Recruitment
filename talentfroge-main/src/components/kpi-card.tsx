import { motion } from "framer-motion";
import { LucideIcon, TrendingUp } from "lucide-react";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      className="glass-strong p-5 relative overflow-hidden group"
    >
      <div className="absolute -top-12 -right-12 size-32 rounded-full bg-[var(--gradient-primary)] opacity-10 blur-2xl group-hover:opacity-20 transition" />
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {delta && (
        <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-success)]">
          <TrendingUp className="size-3" />
          {delta}
        </div>
      )}
    </motion.div>
  );
}
