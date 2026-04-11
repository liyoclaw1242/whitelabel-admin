import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button, Checkbox, Label } from "@whitelabel/ui";

const meta: Meta<typeof Checkbox> = {
  title: "Forms/Checkbox (Form)",
  component: Checkbox,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const FormUsage: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [marketing, setMarketing] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [analytics, setAnalytics] = useState(true);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [submitted, setSubmitted] = useState<string | null>(null);
    return (
      <form
        className="w-80 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(JSON.stringify({ marketing, analytics }));
        }}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="marketing"
              checked={marketing}
              onCheckedChange={(v) => setMarketing(v === true)}
            />
            <Label htmlFor="marketing">Marketing emails</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="analytics"
              checked={analytics}
              onCheckedChange={(v) => setAnalytics(v === true)}
            />
            <Label htmlFor="analytics">Share anonymous usage</Label>
          </div>
        </div>
        <Button type="submit">Save preferences</Button>
        {submitted ? (
          <pre className="rounded-md border bg-muted p-2 text-xs">{submitted}</pre>
        ) : null}
      </form>
    );
  },
};
