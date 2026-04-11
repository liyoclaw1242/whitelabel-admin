import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { Progress } from "@whitelabel/ui";

const meta: Meta<typeof Progress> = {
  title: "Forms/Progress",
  component: Progress,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  render: () => <Progress value={60} className="w-80" />,
};

export const Animated: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState(13);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const t = setTimeout(() => setValue(78), 400);
      return () => clearTimeout(t);
    }, []);
    return <Progress value={value} className="w-80" />;
  },
};

export const Empty: Story = {
  render: () => <Progress value={0} className="w-80" />,
};

export const Full: Story = {
  render: () => <Progress value={100} className="w-80" />,
};
