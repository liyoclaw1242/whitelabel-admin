import type { Meta, StoryObj } from "@storybook/react";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@whitelabel/ui";

const meta: Meta<typeof NativeSelect> = {
  title: "Atoms/NativeSelect",
  component: NativeSelect,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof NativeSelect>;

export const Default: Story = {
  render: () => (
    <NativeSelect className="w-56">
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
    </NativeSelect>
  ),
};

export const Grouped: Story = {
  render: () => (
    <NativeSelect className="w-56" defaultValue="pst">
      <NativeSelectOptGroup label="North America">
        <NativeSelectOption value="pst">Pacific (PST)</NativeSelectOption>
        <NativeSelectOption value="est">Eastern (EST)</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Europe">
        <NativeSelectOption value="gmt">GMT</NativeSelectOption>
        <NativeSelectOption value="cet">CET</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  ),
};

export const Disabled: Story = {
  render: () => (
    <NativeSelect className="w-56" disabled defaultValue="apple">
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
    </NativeSelect>
  ),
};
