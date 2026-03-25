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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
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
          <div className="rounded-lg border p-6 text-muted-foreground">
            Account settings will go here.
          </div>
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <div className="rounded-lg border p-6 text-muted-foreground">
            Notification preferences will go here.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
