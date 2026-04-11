import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@whitelabel/ui";

const meta: Meta<typeof Combobox> = {
  title: "Forms/Combobox",
  component: Combobox,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Combobox>;

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "nuxt", label: "Nuxt" },
  { value: "sveltekit", label: "SvelteKit" },
];

export const Default: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState<string | null>(null);
    return (
      <div className="w-72 space-y-2">
        <Combobox items={frameworks} value={value} onValueChange={setValue}>
          <ComboboxInput placeholder="Pick a framework…" />
          <ComboboxContent>
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
            <ComboboxList>
              {(item: (typeof frameworks)[number]) => (
                <ComboboxItem key={item.value} value={item.value}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <p className="text-xs text-muted-foreground">Selected: {value ?? "—"}</p>
      </div>
    );
  },
};
