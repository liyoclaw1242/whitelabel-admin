import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "@whitelabel/ui";

const meta: Meta<typeof Skeleton> = {
  title: "Layout/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="w-80 space-y-3 rounded-lg border p-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};
