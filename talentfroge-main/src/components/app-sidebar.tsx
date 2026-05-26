import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Upload, Users, BarChart3, Lightbulb, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload Resumes", icon: Upload },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/insights", label: "Recruiter Insights", icon: Lightbulb },
  { to: "/admin", label: "Admin Panel", icon: Shield },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-2 p-4 border-r border-sidebar-border bg-sidebar/60 backdrop-blur-xl sticky top-0 h-screen">
      <Link to="/" className="flex items-center gap-2 px-2 py-3">
        <div className="size-9 rounded-xl bg-[var(--gradient-primary)] grid place-items-center glow">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold tracking-tight">TalentForge</div>
          <div className="text-xs text-muted-foreground">AI Recruitment</div>
        </div>
      </Link>
      <nav className="mt-4 flex flex-col gap-1">
        {nav.map((item, i) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <motion.div key={item.to} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Link
                to={item.to}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-[var(--gradient-primary)]"
                  />
                )}
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
      <div className="mt-auto glass p-3 text-xs text-muted-foreground">
        <div className="font-medium text-foreground mb-1">Pro tip</div>
        Drag-drop resumes on the Upload page — AI parses in seconds.
      </div>
    </aside>
  );
}
