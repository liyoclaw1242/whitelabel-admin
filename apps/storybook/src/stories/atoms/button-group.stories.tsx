import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@whitelabel/ui";

const meta: Meta<typeof ButtonGroup> = {
  title: "Atoms/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Left</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Right</Button>
    </ButtonGroup>
  ),
};

export const WithSeparator: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Save</Button>
      <ButtonGroupSeparator />
      <Button variant="outline">Save as draft</Button>
    </ButtonGroup>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <ButtonGroup>
      <ButtonGroupText>Align</ButtonGroupText>
      <Button variant="outline">Left</Button>
      <Button variant="outline">Center</Button>
      <Button variant="outline">Right</Button>
    </ButtonGroup>
  ),
};
