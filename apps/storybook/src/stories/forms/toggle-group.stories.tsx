import type { Meta, StoryObj } from "@storybook/react";
import { ToggleGroup, ToggleGroupItem } from "@whitelabel/ui";

const meta: Meta<typeof ToggleGroup> = {
  title: "Forms/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ToggleGroup>;

export const Single: Story = {
  render: () => (
    <ToggleGroup defaultValue={["center"]}>
      <ToggleGroupItem value="left" aria-label="Align left">
        L
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        C
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        R
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroup multiple defaultValue={["bold", "italic"]}>
      <ToggleGroupItem value="bold" aria-label="Bold">
        B
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        I
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        U
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Outline: Story = {
  render: () => (
    <ToggleGroup variant="outline" defaultValue={["md"]}>
      <ToggleGroupItem value="sm">Small</ToggleGroupItem>
      <ToggleGroupItem value="md">Medium</ToggleGroupItem>
      <ToggleGroupItem value="lg">Large</ToggleGroupItem>
    </ToggleGroup>
  ),
};
