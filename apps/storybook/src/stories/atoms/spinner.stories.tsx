import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "@whitelabel/ui";

const meta: Meta<typeof Spinner> = {
  title: "Atoms/Spinner",
  component: Spinner,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  render: () => <Spinner />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-10" />
    </div>
  ),
};

export const InText: Story = {
  render: () => (
    <p className="inline-flex items-center gap-2 text-sm">
      <Spinner className="size-4" />
      Loading your data…
    </p>
  ),
};
