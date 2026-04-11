import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@whitelabel/ui";

const meta: Meta<typeof Button> = {
  title: "_smoke/Button",
  component: Button,
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Smoke test",
  },
};
