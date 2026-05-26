import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, Loader2, X, Sparkles, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useDomains, useUploadResume } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiErrorBanner } from "@/components/api-status";
import { getErrorMessage } from "@/components/api-status";

type UploadStatus = "queued" | "uploading" | "parsing" | "done" | "error";

type UploadItem = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  message?: string;
  candidateName?: string;
  matchScore?: number;
  matchedSkills?: string[];
};

export const Route = createFileRoute("/upload")({ component: UploadPage });

function UploadPage() {
  const domainsQuery = useDomains();
  const uploadMutation = useUploadResume();

  const domains = domainsQuery.data ?? [];
  const [domain, setDomain] = useState<string>("");
  const selectedDomain = useMemo(
    () => domains.find((d) => d.id === domain) ?? domains[0],
    [domain, domains],
  );
  const [skills, setSkills] = useState<string[]>([]);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedDomain && skills.length === 0) {
      setDomain(selectedDomain.id);
      setSkills(selectedDomain.skills);
    }
  }, [selectedDomain, skills.length]);

  function selectDomain(id: string) {
    setDomain(id);
    const d = domains.find((x) => x.id === id);
    if (d) setSkills(d.skills);
  }

  function patchItem(id: string, updates: Partial<UploadItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  }

  async function uploadSingleFile(file: File) {
    const id = Math.random().toString(36).slice(2);
    const item: UploadItem = {
      id,
      name: file.name,
      size: file.size,
      progress: 10,
      status: "uploading",
    };
    setItems((prev) => [item, ...prev]);

    const timer = setInterval(() => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          if (it.progress >= 80 || it.status === "done" || it.status === "error") return it;
          return { ...it, progress: Math.min(80, it.progress + 10) };
        }),
      );
    }, 250);

    try {
      patchItem(id, { status: "parsing", progress: 85 });
      const result = await uploadMutation.mutateAsync({
        file,
        domain: selectedDomain?.name,
        jobSkills: skills,
      });
      patchItem(id, {
        status: "done",
        progress: 100,
        message: result.message,
        candidateName: result.candidate_name,
        matchScore: Math.round(result.match_score),
        matchedSkills: result.matched_skills,
      });
    } catch (err) {
      patchItem(id, {
        status: "error",
        progress: 100,
        message: getErrorMessage(err),
      });
    } finally {
      clearInterval(timer);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files)
      .filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
      .forEach((f) => {
        void uploadSingleFile(f);
      });
  }

  function removeSkill(s: string) {
    setSkills((prev) => prev.filter((x) => x !== s));
  }

  function addSkill(s: string) {
    const v = s.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
  }

  const parsedCount = items.filter((i) => i.status === "done").length;

  return (
    <div>
      <PageHeader title="Upload Resumes" subtitle="Drop PDFs and let the AI parse, score and rank candidates." />

      {domainsQuery.isError && (
        <div className="mb-4">
          <ApiErrorBanner error={domainsQuery.error} onRetry={() => domainsQuery.refetch()} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`glass-strong p-10 border-2 border-dashed transition-all cursor-pointer ${dragging ? "border-primary bg-primary/5" : "border-white/10"}`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex flex-col items-center text-center">
              <motion.div animate={{ y: dragging ? -6 : 0 }} className="size-16 rounded-2xl bg-[var(--gradient-primary)] grid place-items-center glow mb-4">
                <UploadCloud className="size-8 text-primary-foreground" />
              </motion.div>
              <h3 className="text-lg font-semibold">Drop resumes here</h3>
              <p className="text-sm text-muted-foreground mt-1">PDF only — backend parsing via FastAPI</p>
              <Button className="mt-5 bg-[var(--gradient-primary)] hover:opacity-90" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? <><Loader2 className="size-4 animate-spin" /> Uploading…</> : "Browse files"}
              </Button>
            </div>
          </motion.div>

          <div className="glass-strong p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Processing Queue</h3>
              <span className="text-xs text-muted-foreground">{parsedCount}/{items.length} parsed</span>
            </div>
            {items.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                <FileText className="size-10 mx-auto mb-2 opacity-50" />
                No resumes uploaded yet.
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((it) => (
                    <motion.div
                      key={it.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]"
                    >
                      <div className="size-9 rounded-lg bg-primary/15 text-primary grid place-items-center">
                        <FileText className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium truncate">{it.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            {it.status === "uploading" && <><Loader2 className="size-3 animate-spin" />Uploading</>}
                            {it.status === "parsing" && <><Sparkles className="size-3 animate-pulse text-primary" />AI parsing…</>}
                            {it.status === "done" && <><CheckCircle2 className="size-3 text-[var(--color-success)]" />Parsed</>}
                            {it.status === "error" && <><AlertCircle className="size-3 text-[var(--color-destructive)]" />Failed</>}
                          </div>
                        </div>
                        <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            animate={{ width: `${it.progress}%` }}
                            className={`h-full ${it.status === "done" ? "bg-[var(--color-success)]" : it.status === "error" ? "bg-[var(--color-destructive)]" : "bg-[var(--gradient-primary)]"}`}
                          />
                        </div>
                        {it.candidateName && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {it.candidateName} · {it.matchScore}% match
                          </p>
                        )}
                        {it.message && it.status === "error" && (
                          <p className="text-xs text-[var(--color-destructive)] mt-2">{it.message}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-strong p-6">
            <h3 className="font-semibold mb-1">Hiring Domain</h3>
            <p className="text-xs text-muted-foreground mb-4">Pick a domain to load required skills</p>
            <div className="flex flex-wrap gap-2">
              {(domainsQuery.data ?? []).map((d) => (
                <button
                  key={d.id}
                  onClick={() => selectDomain(d.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${selectedDomain?.id === d.id ? "bg-[var(--gradient-primary)] border-transparent text-primary-foreground" : "border-white/10 hover:border-white/30"}`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-strong p-6">
            <h3 className="font-semibold mb-1">Required Skills</h3>
            <p className="text-xs text-muted-foreground mb-4">Tune the evaluation criteria sent to backend</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="bg-primary/15 text-primary border border-primary/20 gap-1.5">
                  {s}
                  <button onClick={() => removeSkill(s)}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <input
              placeholder="Add skill and press Enter"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addSkill((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
