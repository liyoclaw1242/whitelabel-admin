import type { Meta, StoryObj } from "@storybook/react";
import { toast } from "sonner";
import { Button, Toaster } from "@whitelabel/ui";

const meta: Meta<typeof Toaster> = {
  title: "Layout/Sonner",
  component: Toaster,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Button
        onClick={() =>
          toast("Event has been created", {
            description: "Sunday, December 03, 2023 at 9:00 AM",
          })
        }
      >
        Show toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Saved", { description: "Your changes have been saved." })
        }
      >
        Success toast
      </Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast.error("Something went wrong", {
            description: "Failed to reach the server. Try again.",
          })
        }
      >
        Error toast
      </Button>
      <Toaster />
    </div>
  ),
};
