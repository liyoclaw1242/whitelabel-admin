import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@whitelabel/ui";

const meta: Meta<typeof Sheet> = {
  title: "Layout/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof Sheet>;

function SheetDemo({ side }: { side: "top" | "right" | "bottom" | "left" }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <Sheet>
        <SheetTrigger render={<Button variant="outline">Open from {side}</Button>} />
        <SheetContent side={side}>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when you&apos;re done.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 text-sm text-muted-foreground">Body content</div>
          <SheetFooter>
            <SheetClose render={<Button>Save changes</Button>} />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export const Right: Story = {
  render: () => <SheetDemo side="right" />,
};

export const Left: Story = {
  render: () => <SheetDemo side="left" />,
};

export const Top: Story = {
  render: () => <SheetDemo side="top" />,
};

export const Bottom: Story = {
  render: () => <SheetDemo side="bottom" />,
};
