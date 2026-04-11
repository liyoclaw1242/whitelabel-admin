import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@whitelabel/ui";

const meta: Meta<typeof Tabs> = {
  title: "Layout/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[420px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="rounded-md border p-4 text-sm">
        Make changes to your account here. Click save when you&apos;re done.
      </TabsContent>
      <TabsContent value="password" className="rounded-md border p-4 text-sm">
        Change your password here.
      </TabsContent>
    </Tabs>
  ),
};

export const ThreePanels: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[520px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="rounded-md border p-4 text-sm">
        At-a-glance numbers for the last 30 days.
      </TabsContent>
      <TabsContent value="analytics" className="rounded-md border p-4 text-sm">
        Deeper breakdowns by source, device, and region.
      </TabsContent>
      <TabsContent value="reports" className="rounded-md border p-4 text-sm">
        Downloadable PDF and CSV exports.
      </TabsContent>
    </Tabs>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-[420px]">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="archived" disabled>
          Archived
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="rounded-md border p-4 text-sm">
        Only the active tab is selectable here.
      </TabsContent>
    </Tabs>
  ),
};
