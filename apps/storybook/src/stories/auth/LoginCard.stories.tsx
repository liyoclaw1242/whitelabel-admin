import type { Meta, StoryObj } from "@storybook/react";
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

interface DemoLoginCardProps {
  errorMessage?: string;
  loading?: boolean;
}

function DemoLoginCard({ errorMessage, loading }: DemoLoginCardProps) {
  const disabled = !!loading;
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back. Enter your credentials.</CardDescription>
      </CardHeader>
      <form noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sb-email">Email</Label>
            <div className="relative">
              <MailIcon aria-hidden className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="sb-email" type="email" placeholder="you@example.com" className="pl-8" disabled={disabled} defaultValue="user@example.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sb-password">Password</Label>
            <div className="relative">
              <LockIcon aria-hidden className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="sb-password" type="password" placeholder="••••••••" className="pl-8" disabled={disabled} defaultValue="hunter2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="sb-remember" disabled={disabled} />
            <Label htmlFor="sb-remember">Remember me</Label>
          </div>
          {errorMessage ? (
            <p role="alert" className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="button" className="w-full" disabled={disabled} aria-busy={loading || undefined}>
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

const meta: Meta<typeof DemoLoginCard> = {
  title: "Auth/LoginCard",
  component: DemoLoginCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof DemoLoginCard>;

export const Default: Story = {};

export const WithError: Story = {
  args: { errorMessage: "Email or password is incorrect." },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Disabled: Story = {
  render: () => (
    <div aria-disabled className="pointer-events-none opacity-50">
      <DemoLoginCard />
    </div>
  ),
};
