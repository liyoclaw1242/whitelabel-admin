import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Label, RadioGroup, RadioGroupItem } from "@whitelabel/ui";

const meta: Meta<typeof RadioGroup> = {
  title: "Forms/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable" className="space-y-2">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="r-default" />
        <Label htmlFor="r-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="r-comfortable" />
        <Label htmlFor="r-comfortable">Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="compact" id="r-compact" />
        <Label htmlFor="r-compact">Compact</Label>
      </div>
    </RadioGroup>
  ),
};

export const Controlled: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState("weekly");
    return (
      <div className="space-y-3">
        <RadioGroup value={value} onValueChange={setValue} className="space-y-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="daily" id="r-daily" />
            <Label htmlFor="r-daily">Daily digest</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="weekly" id="r-weekly" />
            <Label htmlFor="r-weekly">Weekly digest</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="never" id="r-never" />
            <Label htmlFor="r-never">Never</Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">Selected: {value}</p>
      </div>
    );
  },
};
