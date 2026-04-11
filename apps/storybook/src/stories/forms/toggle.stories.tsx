import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Toggle } from "@whitelabel/ui";

const meta: Meta<typeof Toggle> = {
  title: "Forms/Toggle",
  component: Toggle,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: () => <Toggle aria-label="Toggle bold">B</Toggle>,
};

export const Outline: Story = {
  render: () => (
    <Toggle variant="outline" aria-label="Toggle italic">
      I
    </Toggle>
  ),
};

export const Controlled: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [pressed, setPressed] = useState(false);
    return (
      <div className="space-y-2">
        <Toggle pressed={pressed} onPressedChange={setPressed} aria-label="Toggle">
          Pressed: {String(pressed)}
        </Toggle>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Toggle disabled aria-label="Disabled toggle">
      Disabled
    </Toggle>
  ),
};
