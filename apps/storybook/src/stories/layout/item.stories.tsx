import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@whitelabel/ui";

const meta: Meta<typeof Item> = {
  title: "Layout/Item",
  component: Item,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Item>;

export const Default: Story = {
  render: () => (
    <ItemGroup className="w-[520px]">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <div aria-hidden className="size-4 rounded-full bg-primary" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Deploy new release</ItemTitle>
          <ItemDescription>Pushed 5 minutes ago to production</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="ghost">
            View
          </Button>
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item variant="outline">
        <ItemMedia variant="icon">
          <div aria-hidden className="size-4 rounded-full bg-green-500" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>CI passed</ItemTitle>
          <ItemDescription>All 142 tests green</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="ghost">
            Logs
          </Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  ),
};

export const Muted: Story = {
  render: () => (
    <ItemGroup className="w-[520px]">
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>Muted variant</ItemTitle>
          <ItemDescription>Less visual weight — good for secondary lists.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};
