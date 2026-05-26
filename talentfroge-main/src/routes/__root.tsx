import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass-strong p-10">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That route doesn't exist in the recruitment console.
        </p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass-strong p-10">
        <h1 className="text-xl font-semibold">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TalentForge — AI Recruitment Analytics" },
      { name: "description", content: "AI-powered recruitment platform with resume screening, candidate scoring, and hiring analytics." },
      { property: "og:title", content: "TalentForge — AI Recruitment Analytics" },
      { name: "twitter:title", content: "TalentForge — AI Recruitment Analytics" },
      { property: "og:description", content: "AI-powered recruitment platform with resume screening, candidate scoring, and hiring analytics." },
      { name: "twitter:description", content: "AI-powered recruitment platform with resume screening, candidate scoring, and hiring analytics." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/08a66483-f8bb-4626-9994-9a3e1618c965/id-preview-896f891d--635ae40d-54ab-46a9-be81-86df7f64416d.lovable.app-1779807955786.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/08a66483-f8bb-4626-9994-9a3e1618c965/id-preview-896f891d--635ae40d-54ab-46a9-be81-86df7f64416d.lovable.app-1779807955786.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 min-w-0 px-5 md:px-10 py-8">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}
