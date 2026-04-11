import type { Meta, StoryObj } from "@storybook/react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@whitelabel/ui";

const meta: Meta<typeof InputGroup> = {
  title: "Atoms/InputGroup",
  component: InputGroup,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof InputGroup>;

export const Default: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupInput placeholder="username" />
    </InputGroup>
  ),
};

export const WithLeadingText: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="example.com" />
    </InputGroup>
  ),
};

export const WithTrailingButton: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupInput placeholder="Search…" />
      <InputGroupAddon>
        <InputGroupButton size="sm">Search</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};
