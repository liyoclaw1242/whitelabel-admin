import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@whitelabel/ui";

const meta: Meta<typeof Tooltip> = {
  title: "Interactive/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const Multiple: Story = {
  render: () => (
    <TooltipProvider delay={200}>
      <div className="flex gap-3">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline">Save</Button>} />
          <TooltipContent>⌘S</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline">Open</Button>} />
          <TooltipContent>⌘O</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline">Close</Button>} />
          <TooltipContent>⌘W</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};
