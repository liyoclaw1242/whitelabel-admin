"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";
import { LoginCard } from "@/components/auth/LoginCard";
import { useAuth } from "@/lib/auth-store";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { user, status, login } = useAuth();

  useEffect(() => {
    if (status === "ready" && user) {
      router.replace(next);
    }
  }, [status, user, router, next]);

  const handleSubmit = useCallback(
    async (email: string, password: string) => {
      await login(email, password);
      router.replace(next);
    },
    [login, router, next],
  );

  return <LoginCard onSubmit={handleSubmit} />;
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono">
            Whitelabel Admin
          </p>
          <h1 className="text-2xl font-bold -tracking-[0.02em]">
            Sign in to continue
          </h1>
        </div>
        <Suspense fallback={null}>
          <LoginInner />
        </Suspense>
      </div>
    </main>
  );
}
