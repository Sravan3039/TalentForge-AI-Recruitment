import { motion } from "framer-motion";
import { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
    >
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          <span className="gradient-text">{title}</span>
        </h1>
        {subtitle && <p className="text-muted-foreground mt-1.5 text-sm md:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </motion.div>
  );
}
