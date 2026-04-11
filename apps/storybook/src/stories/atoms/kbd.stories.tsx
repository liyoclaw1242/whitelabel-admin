import type { Meta, StoryObj } from "@storybook/react";
import { Kbd, KbdGroup } from "@whitelabel/ui";

const meta: Meta<typeof Kbd> = {
  title: "Atoms/Kbd",
  component: Kbd,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Kbd>;

export const Default: Story = {
  render: () => <Kbd>⌘</Kbd>,
};

export const Group: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

export const InText: Story = {
  render: () => (
    <p className="text-sm">
      Press{" "}
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>/</Kbd>
      </KbdGroup>{" "}
      to open the command menu.
    </p>
  ),
};
