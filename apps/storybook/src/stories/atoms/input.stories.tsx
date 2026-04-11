import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@whitelabel/ui";

const meta: Meta<typeof Input> = {
  title: "Atoms/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => <Input placeholder="Type here…" className="w-80" />,
};

export const WithValue: Story = {
  render: () => <Input defaultValue="hello@example.com" className="w-80" />,
};

export const Password: Story = {
  render: () => <Input type="password" defaultValue="secret" className="w-80" />,
};

export const File: Story = {
  render: () => <Input type="file" className="w-80" />,
};

export const Disabled: Story = {
  render: () => <Input placeholder="Disabled" disabled className="w-80" />,
};

export const Invalid: Story = {
  render: () => (
    <Input
      defaultValue="bad-value"
      aria-invalid
      className="w-80"
    />
  ),
};
