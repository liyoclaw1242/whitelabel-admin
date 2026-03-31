"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
} from "@whitelabel/ui";
import {
  ActivityIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "lucide-react";

function MiniKPI({
  label,
  value,
  change,
  trend,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
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
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          {trend === "up" ? (
            <ArrowUpIcon className="size-3 text-primary" />
          ) : (
            <ArrowDownIcon className="size-3 text-destructive" />
          )}
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardScene() {
  return (
    <div className="space-y-6">
      {/* Mini sidebar + header mockup */}
      <div className="flex gap-4">
        <div className="hidden sm:flex w-12 shrink-0 flex-col gap-2 rounded-lg bg-muted/30 p-2 ring-1 ring-foreground/10">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-8 w-full rounded-md ${i === 1 ? "bg-primary/20" : "bg-muted/50"}`}
            />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          {/* Header bar */}
          <div className="flex items-center justify-between rounded-lg bg-muted/20 px-4 py-2 ring-1 ring-foreground/10">
            <span className="text-sm font-medium">Dashboard</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Live</Badge>
              <Button variant="outline" size="sm">Export</Button>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <MiniKPI
              label="Revenue"
              value="$45.2k"
              change="+12.5%"
              trend="up"
              icon={<DollarSignIcon className="size-4 text-muted-foreground" />}
            />
            <MiniKPI
              label="Orders"
              value="1,234"
              change="+8.2%"
              trend="up"
              icon={<ShoppingCartIcon className="size-4 text-muted-foreground" />}
            />
            <MiniKPI
              label="Users"
              value="5,678"
              change="-2.1%"
              trend="down"
              icon={<UsersIcon className="size-4 text-muted-foreground" />}
            />
            <MiniKPI
              label="Active"
              value="892"
              change="+4.3%"
              trend="up"
              icon={<ActivityIcon className="size-4 text-muted-foreground" />}
            />
          </div>

          {/* Chart placeholder + Recent activity */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Chart area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/20"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "New signups", value: 42, max: 100 },
                  { label: "Active sessions", value: 78, max: 100 },
                  { label: "Conversion", value: 23, max: 100 },
                  { label: "Retention", value: 65, max: 100 },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono">{item.value}%</span>
                    </div>
                    <Progress value={item.value} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Separator />

      {/* Table mockup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
              <span>Order</span>
              <span>Customer</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            {[
              { id: "#3210", customer: "Alice Chen", status: "Completed", amount: "$250.00" },
              { id: "#3209", customer: "Bob Smith", status: "Processing", amount: "$150.00" },
              { id: "#3208", customer: "Carol Lee", status: "Pending", amount: "$350.00" },
            ].map((order) => (
              <div key={order.id} className="grid grid-cols-4 text-sm py-2">
                <span className="font-mono text-xs">{order.id}</span>
                <span>{order.customer}</span>
                <span>
                  <Badge
                    variant={
                      order.status === "Completed" ? "default" :
                      order.status === "Processing" ? "secondary" : "outline"
                    }
                  >
                    {order.status}
                  </Badge>
                </span>
                <span className="text-right font-mono text-xs">{order.amount}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
