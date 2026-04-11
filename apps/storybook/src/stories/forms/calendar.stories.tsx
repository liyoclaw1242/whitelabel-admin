import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Calendar } from "@whitelabel/ui";

const meta: Meta<typeof Calendar> = {
  title: "Forms/Calendar",
  component: Calendar,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        className="rounded-md border"
      />
    );
  },
};

export const WithoutSelection: Story = {
  render: () => <Calendar mode="single" className="rounded-md border" />,
};
