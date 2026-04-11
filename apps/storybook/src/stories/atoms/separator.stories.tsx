import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "@whitelabel/ui";

const meta: Meta<typeof Separator> = {
  title: "Atoms/Separator",
  component: Separator,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div>
        <h4 className="text-sm font-medium">Radix Primitives</h4>
        <p className="text-xs text-muted-foreground">An open-source UI library.</p>
      </div>
      <Separator />
      <div className="flex gap-3 text-xs">
        <span>Blog</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Docs</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Source</span>
      </div>
    </div>
  ),
};
