import type { Meta, StoryObj } from "@storybook/react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@whitelabel/ui";

const meta: Meta<typeof ResizablePanelGroup> = {
  title: "Layout/Resizable",
  component: ResizablePanelGroup,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ResizablePanelGroup>;

export const Horizontal: Story = {
  render: () => (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-60 w-[640px] rounded-lg border"
    >
      <ResizablePanel defaultSize={40}>
        <div className="flex h-full items-center justify-center p-6 text-sm">Sidebar</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60}>
        <div className="flex h-full items-center justify-center p-6 text-sm">Content</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ResizablePanelGroup
      orientation="vertical"
      className="h-80 w-[480px] rounded-lg border"
    >
      <ResizablePanel defaultSize={30}>
        <div className="flex h-full items-center justify-center p-4 text-sm">Header</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70}>
        <div className="flex h-full items-center justify-center p-4 text-sm">Body</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
