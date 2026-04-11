import type { Meta, StoryObj } from "@storybook/react";
import { Label, Textarea } from "@whitelabel/ui";

const meta: Meta<typeof Textarea> = {
  title: "Forms/Textarea",
  component: Textarea,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: () => <Textarea placeholder="Type your message here." className="w-80" />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="message">Your message</Label>
      <Textarea id="message" placeholder="Tell us what you think…" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => <Textarea placeholder="Read-only textarea" disabled className="w-80" />,
};

export const WithValue: Story = {
  render: () => (
    <Textarea
      defaultValue="The quick brown fox jumps over the lazy dog."
      className="w-80"
    />
  ),
};
