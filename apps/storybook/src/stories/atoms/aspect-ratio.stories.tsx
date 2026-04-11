import type { Meta, StoryObj } from "@storybook/react";
import { AspectRatio } from "@whitelabel/ui";

const meta: Meta<typeof AspectRatio> = {
  title: "Atoms/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof AspectRatio>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <AspectRatio ratio={16 / 9} className="rounded-md bg-muted">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          16 / 9
        </div>
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-60">
      <AspectRatio ratio={1} className="rounded-md bg-muted">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          1 / 1
        </div>
      </AspectRatio>
    </div>
  ),
};

export const Portrait: Story = {
  render: () => (
    <div className="w-40">
      <AspectRatio ratio={3 / 4} className="rounded-md bg-muted">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          3 / 4
        </div>
      </AspectRatio>
    </div>
  ),
};
