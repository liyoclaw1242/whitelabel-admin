import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "@whitelabel/ui";

const meta: Meta<typeof ScrollArea> = {
  title: "Layout/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ScrollArea>;

const TAGS = Array.from({ length: 50 }).map((_, i) => `tag-${i + 1}`);

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-72 w-64 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {TAGS.map((tag) => (
          <div key={tag} className="py-1 text-sm">
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
