import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const router = useRouter();
  useEffect(() => {
    const s = getSession();
    router.navigate({ to: s ? "/navigate" : "/login", replace: true });
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
