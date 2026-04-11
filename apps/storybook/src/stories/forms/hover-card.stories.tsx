import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@whitelabel/ui";

const meta: Meta<typeof HoverCard> = {
  title: "Interactive/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger render={<Button variant="link">@vercel</Button>} />
      <HoverCardContent className="w-72">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">@vercel</h4>
          <p className="text-xs text-muted-foreground">
            Develop. Preview. Ship. Build and deploy the best web experiences in record
            time.
          </p>
          <p className="text-xs text-muted-foreground">Joined December 2021</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
