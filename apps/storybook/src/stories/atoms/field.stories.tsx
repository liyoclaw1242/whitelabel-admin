import type { Meta, StoryObj } from "@storybook/react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  Input,
} from "@whitelabel/ui";

const meta: Meta<typeof Field> = {
  title: "Atoms/Field",
  component: Field,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" type="email" placeholder="you@example.com" />
      <FieldDescription>We&apos;ll never share your email.</FieldDescription>
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel htmlFor="email-err">Email</FieldLabel>
      <Input id="email-err" type="email" defaultValue="not-an-email" aria-invalid />
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  ),
};

export const Grouped: Story = {
  render: () => (
    <FieldGroup className="w-80">
      <FieldTitle>Account</FieldTitle>
      <Field>
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <Input id="username" placeholder="jdoe" />
      </Field>
      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input id="password" type="password" />
      </Field>
    </FieldGroup>
  ),
};
