"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@whitelabel/ui";
import { ThemeCustomizer } from "./theme-customizer";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono">
          Configuration
        </p>
        <h1 className="mt-1 text-2xl font-bold -tracking-[0.02em]">Settings</h1>
        <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>
      <Tabs defaultValue="appearance">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="appearance" className="mt-6">
          <ThemeCustomizer />
        </TabsContent>
        <TabsContent value="account" className="mt-6">
          <div className="rounded-xl bg-muted/30 p-6 text-muted-foreground ring-1 ring-foreground/10">
            Account settings will go here.
          </div>
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <div className="rounded-xl bg-muted/30 p-6 text-muted-foreground ring-1 ring-foreground/10">
            Notification preferences will go here.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
