"use client";

import { useState, type FormEvent } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
} from "@whitelabel/ui";
import { LockIcon, MailIcon, Loader2Icon } from "lucide-react";

export interface LoginCardProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  initialEmail?: string;
  errorMessage?: string | null;
  loading?: boolean;
}

export function LoginCard({
  onSubmit,
  initialEmail = "",
  errorMessage,
  loading: loadingProp,
}: LoginCardProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const loading = loadingProp ?? internalLoading;
  const message = errorMessage ?? internalError;
  const disabled = loading || !email || !password;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInternalError(null);
    setInternalLoading(true);
    try {
      await onSubmit(email, password);
    } catch (err) {
      const detail =
        err instanceof Error
          ? (err as { problem?: { detail?: string } }).problem?.detail ??
            err.message
          : "Sign-in failed. Please try again.";
      setInternalError(detail);
    } finally {
      setInternalLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back. Enter your credentials.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <div className="relative">
              <MailIcon
                aria-hidden
                className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="pl-8"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                data-testid="login-email"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm">
              Password
            </Label>
            <div className="relative">
              <LockIcon
                aria-hidden
                className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-8"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                data-testid="login-password"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="remember" disabled={loading} />
            <Label htmlFor="remember" className="text-sm">
              Remember me
            </Label>
          </div>
          {message ? (
            <p
              role="alert"
              className="text-sm text-destructive"
              data-testid="login-error"
            >
              {message}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={disabled}
            aria-busy={loading || undefined}
            data-testid="login-submit"
          >
            {loading ? (
              <>
                <Loader2Icon aria-hidden className="mr-2 size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
