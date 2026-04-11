import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox, Input, Label } from "@whitelabel/ui";

const meta: Meta<typeof Label> = {
  title: "Atoms/Label",
  component: Label,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => <Label>Your name</Label>,
};

export const WithInput: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="name">Name</Label>
      <Input id="name" placeholder="Jane Doe" />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="remember" />
      <Label htmlFor="remember">Remember me</Label>
    </div>
  ),
};
