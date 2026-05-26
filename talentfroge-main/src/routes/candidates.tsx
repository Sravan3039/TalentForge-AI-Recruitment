import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, ChevronDown, Mail, Briefcase, Award, Star, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { ApiErrorBanner, ApiEmpty, ApiLoading } from "@/components/api-status";
import {
  useCandidates,
  useDomains,
  useRecruiterInsights,
} from "@/lib/api/hooks";
import { filterByDomainSkills, mapCandidatesList } from "@/lib/api/mappers";

export const Route = createFileRoute("/candidates")({ component: CandidatesPage });

function CandidatesPage() {
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string | null>(null);

  const domainsQuery = useDomains();
  const insightsDomain = domain === "all" ? undefined : domain;
  const candidatesQuery = useCandidates();
  const insightsQuery = useRecruiterInsights(insightsDomain);

  const isLoading = candidatesQuery.isPending || insightsQuery.isPending;
  const isError = candidatesQuery.isError;

  const uiCandidates = useMemo(() => {
    if (!candidatesQuery.data) return [];
    let list = mapCandidatesList(
      candidatesQuery.data.candidates,
      insightsQuery.data,
    );
    if (domain !== "all" && domainsQuery.data) {
      list = filterByDomainSkills(list, domain, domainsQuery.data);
    }
    return list;
  }, [candidatesQuery.data, insightsQuery.data, domain, domainsQuery.data]);

  const filtered = useMemo(
    () =>
      uiCandidates.filter(
        (c) =>
          !removed.has(c.id) &&
          (c.name.toLowerCase().includes(q.toLowerCase()) ||
            c.email.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, removed, uiCandidates],
  );

  function remove(id: string) {
    setRemoved((prev) => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
    setConfirm(null);
    setOpen(null);
  }

  function restoreAll() {
    setRemoved(new Set());
  }

  const top = filtered[0];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Candidate Leaderboard" subtitle="Loading ranked candidates…" />
        <ApiLoading rows={8} />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Candidate Leaderboard" subtitle="Ranked by AI match score" />
        <ApiErrorBanner error={candidatesQuery.error} onRetry={() => candidatesQuery.refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Candidate Leaderboard"
        subtitle={`${filtered.length} candidates ranked by AI match score${removed.size ? ` · ${removed.size} hidden locally` : ""}`}
        actions={
          removed.size > 0 ? (
            <button onClick={restoreAll} className="text-sm text-primary hover:underline">
              Restore hidden
            </button>
          ) : undefined
        }
      />

      {top && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--gradient-primary)] opacity-10" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-4">
            <div className="size-16 rounded-2xl bg-[var(--gradient-primary)] grid place-items-center text-lg font-bold text-primary-foreground glow">
              {top.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-primary uppercase tracking-wider">
                <Star className="size-3.5 fill-current" /> Top match
              </div>
              <div className="text-xl font-semibold mt-0.5">{top.name}</div>
              <div className="text-sm text-muted-foreground">{top.resumeFile} · {top.matched.length} skills matched</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold gradient-text">{top.score}%</div>
              <div className="text-xs text-muted-foreground">AI match</div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search candidates…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="bg-card text-foreground border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary [&>option]:bg-card [&>option]:text-foreground"
        >
          <option value="all">All domains</option>
          {(domainsQuery.data ?? []).map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <ApiEmpty message="No candidates match your filters. Upload resumes or adjust search." />
      ) : (
        <div className="space-y-2">
          {filtered.map((c, i) => {
            const isOpen = open === c.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="glass overflow-hidden"
              >
                <div className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.03] transition">
                  <button
                    onClick={() => setOpen(isOpen ? null : c.id)}
                    className="flex items-center gap-4 flex-1 min-w-0 text-left"
                  >
                    <div className="text-xs text-muted-foreground tabular-nums w-6">#{i + 1}</div>
                    <div className="size-10 rounded-full bg-[var(--gradient-primary)] grid place-items-center text-sm font-semibold text-primary-foreground">
                      {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.resumeFile}</div>
                    </div>
                    <div className="hidden md:block">
                      <Badge variant="secondary" className="bg-white/5 border border-white/10">
                        {c.stage}
                      </Badge>
                    </div>
                    <div className="hidden lg:flex flex-1 max-w-xs items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${c.score}%` }}
                          transition={{ duration: 0.6, delay: i * 0.02 }}
                          className="h-full bg-[var(--gradient-primary)]"
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums w-10 text-right">{c.score}%</span>
                    </div>
                    <ChevronDown className={`size-4 transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {confirm === c.id ? (
                    <div className="flex items-center gap-1.5 ml-1">
                      <button
                        onClick={() => remove(c.id)}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-[var(--color-destructive)] text-destructive-foreground hover:opacity-90"
                      >
                        Hide
                      </button>
                      <button
                        onClick={() => setConfirm(null)}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-white/10 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirm(c.id)}
                      aria-label={`Hide ${c.name}`}
                      title="Hide from list (local only)"
                      className="ml-1 size-9 grid place-items-center rounded-lg text-muted-foreground hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-5 pt-2 border-t border-white/5 grid md:grid-cols-3 gap-5">
                        <div className="md:col-span-2 space-y-3">
                          <p className="text-sm text-muted-foreground">{c.summary}</p>
                          <div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Matched skills</div>
                            <div className="flex flex-wrap gap-1.5">
                              {c.matched.map((s) => (
                                <Badge key={s} className="bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/20">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {c.missing.length > 0 && (
                            <div>
                              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Missing skills</div>
                              <div className="flex flex-wrap gap-1.5">
                                {c.missing.map((s) => (
                                  <Badge key={s} variant="outline" className="border-white/10 text-muted-foreground">
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="size-4" />
                            {c.email}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="size-4" />
                            Rank #{c.rank}
                          </div>
                          {c.recommendation && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <Award className="size-4 shrink-0 mt-0.5" />
                              <span>{c.recommendation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
