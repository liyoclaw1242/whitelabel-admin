import { ShieldOffIcon } from "lucide-react";

export interface ForbiddenProps {
  permission?: string;
  message?: string;
}

export function Forbidden({ permission, message }: ForbiddenProps) {
  return (
    <div
      role="alert"
      className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-xl bg-muted/30 p-8 text-center ring-1 ring-foreground/10"
    >
      <ShieldOffIcon aria-hidden className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">You don&apos;t have access to this view</p>
        <p className="text-xs text-muted-foreground max-w-[40ch]">
          {message ??
            (permission
              ? `Missing permission: ${permission}. Contact your administrator if you believe this is a mistake.`
              : "Contact your administrator if you believe this is a mistake.")}
        </p>
      </div>
    </div>
  );
}
