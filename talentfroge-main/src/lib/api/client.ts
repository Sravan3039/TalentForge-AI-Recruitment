import type { ApiErrorBody } from "./types";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8001";

export class ApiError extends Error {
  status: number;
  errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

function buildUrl(path: string, params?: Record<string, string | undefined>) {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  let detail = res.statusText || "Request failed";
  let errorCode: string | undefined;
  try {
    const body = (await res.json()) as ApiErrorBody;
    if (body.detail) detail = body.detail;
    errorCode = body.error_code;
  } catch {
    // Some failures (CORS/network/proxies) may not return JSON bodies.
    try {
      detail = (await res.text()) || detail;
    } catch {
      /* ignore */
    }
  }
  return new ApiError(detail, res.status, errorCode);
}

async function parseJsonSafe<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    // If backend returned non-JSON (or empty), surface a helpful error.
    const txt = await res.text().catch(() => "");
    throw new ApiError(
      txt ? `Invalid JSON response: ${txt.slice(0, 200)}` : "Invalid JSON response",
      res.status,
    );
  }
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | undefined>,
): Promise<T> {
  const res = await fetch(buildUrl(path, params));
  if (!res.ok) throw await parseErrorResponse(res);
  return parseJsonSafe<T>(res);
}

export async function apiUploadResume(
  file: File,
  options: { domain?: string; jobSkills?: string[] },
): Promise<import("./types").UploadResumeResponse> {
  const form = new FormData();
  form.append("file", file);
  if (options.domain) form.append("domain", options.domain);
  if (options.jobSkills?.length) {
    form.append("job_skills", options.jobSkills.join(","));
  }

  const res = await fetch(`${API_BASE_URL}/upload-resume`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw await parseErrorResponse(res);
  return parseJsonSafe<import("./types").UploadResumeResponse>(res);
}
