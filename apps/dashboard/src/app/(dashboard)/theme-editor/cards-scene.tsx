"use client";

import {
  Avatar,
  AvatarFallback,
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
  Separator,
  Switch,
} from "@whitelabel/ui";
import { LockIcon, MailIcon, UsersIcon } from "lucide-react";

export function CardsScene() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Login Card */}
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Email</Label>
            <div className="relative">
              <MailIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="you@example.com" className="pl-8" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Password</Label>
            <div className="relative">
              <LockIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" className="pl-8" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox />
            <Label className="text-sm">Remember me</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Sign In</Button>
        </CardFooter>
      </Card>

      {/* Team Members Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4" />
            Team Members
          </CardTitle>
          <CardDescription>Manage your team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Alice Chen", role: "Admin", initials: "AC" },
            { name: "Bob Smith", role: "Editor", initials: "BS" },
            { name: "Carol Lee", role: "Viewer", initials: "CL" },
          ].map((member) => (
            <div key={member.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cookie Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Cookie Settings</CardTitle>
          <CardDescription>Manage your cookie preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Strictly Necessary", desc: "Required for the site to function", locked: true },
            { label: "Functional", desc: "Enable enhanced functionality", locked: false },
            { label: "Analytics", desc: "Help us improve our site", locked: false },
          ].map((cookie) => (
            <div key={cookie.label} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">{cookie.label}</Label>
                <p className="text-xs text-muted-foreground">{cookie.desc}</p>
              </div>
              <Switch defaultChecked={cookie.locked} disabled={cookie.locked} />
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" className="flex-1">Decline All</Button>
          <Button className="flex-1">Accept All</Button>
        </CardFooter>
      </Card>

      {/* Notification Card */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Recent activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { text: "New user registered", time: "2 min ago", dot: "bg-primary" },
            { text: "Payment received", time: "1 hour ago", dot: "bg-primary/60" },
            { text: "Server alert cleared", time: "3 hours ago", dot: "bg-muted-foreground/40" },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex items-start gap-3">
                <div className={`mt-1.5 size-2 shrink-0 rounded-full ${item.dot}`} />
                <div className="flex-1">
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
              {i < 2 && <Separator className="mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
