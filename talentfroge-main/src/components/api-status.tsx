import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";

type ApiLoadingProps = {
  label?: string;
  rows?: number;
};

export function ApiLoading({ label = "Loading data…", rows = 4 }: ApiLoadingProps) {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        {label}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

type ApiErrorBannerProps = {
  error: unknown;
  onRetry?: () => void;
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const code = error.errorCode ? ` (${error.errorCode})` : "";
    return `HTTP ${error.status}: ${error.message}${code}`;
  }
  if (error instanceof Error) {
    // Common in browsers when CORS blocks access.
    const hint = error.message.toLowerCase().includes("failed to fetch")
      ? " Possible CORS/network issue."
      : "";
    return `${error.message}${hint}`;
  }
  return "Something went wrong while loading data.";
}

export function ApiErrorBanner({ error, onRetry }: ApiErrorBannerProps) {
  return (
    <div
      className="glass-strong border border-[var(--color-destructive)]/30 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
      role="alert"
    >
      <div className="flex items-start gap-3 flex-1">
        <AlertCircle className="size-5 text-[var(--color-destructive)] shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">API request failed</p>
          <p className="text-xs text-muted-foreground mt-1">{getErrorMessage(error)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ensure the backend is running at{" "}
            <code className="text-foreground/80">http://127.0.0.1:8001</code>
          </p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 shrink-0"
          onClick={onRetry}
        >
          <RefreshCw className="size-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

export function ApiEmpty({ message }: { message: string }) {
  return (
    <div className="glass-strong p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
