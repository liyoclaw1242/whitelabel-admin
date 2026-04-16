import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import { ShieldOffIcon } from "lucide-react";

interface ForbiddenProps {
  permission?: string;
}
function Forbidden({ permission }: ForbiddenProps) {
  return (
    <div
      role="alert"
      className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-xl bg-muted/30 p-8 text-center ring-1 ring-foreground/10"
    >
      <ShieldOffIcon aria-hidden className="size-8 text-muted-foreground" />
      <p className="text-sm font-semibold">You don&apos;t have access to this view</p>
      <p className="text-xs text-muted-foreground max-w-[40ch]">
        Missing permission: {permission}.
      </p>
    </div>
  );
}

interface DemoProps {
  permission: string;
  granted: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}
function RequirePermissionDemo({
  permission,
  granted,
  children,
  fallback,
}: DemoProps) {
  if (granted) return <>{children}</>;
  return <>{fallback ?? <Forbidden permission={permission} />}</>;
}

const meta: Meta<typeof RequirePermissionDemo> = {
  title: "Auth/RequirePermission",
  component: RequirePermissionDemo,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    granted: { control: "boolean" },
    permission: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof RequirePermissionDemo>;

const protectedContent = (
  <div className="rounded-lg bg-card p-6 ring-1 ring-foreground/10">
    <p className="text-sm font-semibold">Protected content</p>
    <p className="text-xs text-muted-foreground">
      Only visible when the required permission is granted.
    </p>
  </div>
);

export const HasPermission: Story = {
  args: {
    permission: "users.read",
    granted: true,
    children: protectedContent,
  },
};

export const LacksPermission: Story = {
  args: {
    permission: "users.write",
    granted: false,
    children: protectedContent,
  },
};

export const CustomFallback: Story = {
  args: {
    permission: "billing.admin",
    granted: false,
    children: protectedContent,
    fallback: (
      <div className="rounded-lg bg-amber-500/10 p-6 ring-1 ring-amber-500/30">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
          Upgrade required
        </p>
        <p className="text-xs text-muted-foreground">
          Billing admin access is gated to enterprise plans.
        </p>
      </div>
    ),
  },
};
