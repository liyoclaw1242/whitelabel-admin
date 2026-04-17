"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-store";
import { Forbidden } from "./Forbidden";

export interface RequirePermissionProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({
  permission,
  children,
  fallback,
}: RequirePermissionProps) {
  const { hasPermission } = useAuth();
  if (hasPermission(permission)) {
    return <div data-testid={`permission-${permission}`}>{children}</div>;
  }
  return <>{fallback ?? <Forbidden permission={permission} />}</>;
}
