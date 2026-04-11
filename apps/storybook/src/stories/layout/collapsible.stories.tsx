import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@whitelabel/ui";

const meta: Meta<typeof Collapsible> = {
  title: "Layout/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-96 space-y-2">
      <div className="flex items-center justify-between rounded-md border px-4 py-2">
        <span className="text-sm font-medium">@whitelabel/ui starred repos</span>
        <CollapsibleTrigger
          render={
            <Button variant="ghost" size="sm">
              Toggle
            </Button>
          }
        />
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border px-4 py-2 text-sm">@radix-ui/primitives</div>
        <div className="rounded-md border px-4 py-2 text-sm">@base-ui/react</div>
        <div className="rounded-md border px-4 py-2 text-sm">@tanstack/query</div>
      </CollapsibleContent>
    </Collapsible>
  ),
};
