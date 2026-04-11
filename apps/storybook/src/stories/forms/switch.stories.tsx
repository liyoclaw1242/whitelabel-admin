import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Label, Switch } from "@whitelabel/ui";

const meta: Meta<typeof Switch> = {
  title: "Forms/Switch",
  component: Switch,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="airplane" />
      <Label htmlFor="airplane">Airplane mode</Label>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [on, setOn] = useState(true);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Switch id="notif" checked={on} onCheckedChange={setOn} />
          <Label htmlFor="notif">Notifications</Label>
        </div>
        <p className="text-xs text-muted-foreground">State: {on ? "on" : "off"}</p>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="locked" disabled />
      <Label htmlFor="locked">Locked setting</Label>
    </div>
  ),
};
