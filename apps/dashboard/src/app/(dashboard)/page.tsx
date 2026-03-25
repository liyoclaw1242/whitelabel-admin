import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@whitelabel/ui";
import {
  ActivityIcon,
  DollarSignIcon,
  ClockIcon,
  UsersIcon,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono">
          Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-bold -tracking-[0.02em]">
          Overview
        </h1>
        <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
          Welcome to your admin dashboard.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value="1,234"
          change="+12% from last month"
          icon={<UsersIcon className="size-4 text-muted-foreground" />}
        />
        <StatCard
          label="Active Now"
          value="573"
          change="+4% from last hour"
          icon={<ActivityIcon className="size-4 text-muted-foreground" />}
        />
        <StatCard
          label="Revenue"
          value="$12,345"
          change="+8% from last month"
          icon={<DollarSignIcon className="size-4 text-muted-foreground" />}
        />
        <StatCard
          label="Pending"
          value="23"
          change="-2 from yesterday"
          icon={<ClockIcon className="size-4 text-muted-foreground" />}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-muted/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold -tracking-[0.02em]">{value}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
}
