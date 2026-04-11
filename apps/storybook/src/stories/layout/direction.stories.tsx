import type { Meta, StoryObj } from "@storybook/react";
import { Button, DirectionProvider } from "@whitelabel/ui";

const meta: Meta<typeof DirectionProvider> = {
  title: "Layout/DirectionProvider",
  component: DirectionProvider,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof DirectionProvider>;

function Row() {
  return (
    <div className="flex items-center gap-3">
      <Button size="sm">Primary</Button>
      <Button size="sm" variant="secondary">
        Secondary
      </Button>
      <Button size="sm" variant="outline">
        Outline
      </Button>
      <span className="text-sm text-muted-foreground">→ reads in document order</span>
    </div>
  );
}

export const LeftToRight: Story = {
  render: () => (
    <DirectionProvider direction="ltr">
      <div dir="ltr" className="space-y-2">
        <p className="text-xs text-muted-foreground">direction=&quot;ltr&quot;</p>
        <Row />
      </div>
    </DirectionProvider>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="space-y-2">
        <p className="text-xs text-muted-foreground">direction=&quot;rtl&quot; — children flip</p>
        <Row />
      </div>
    </DirectionProvider>
  ),
};
