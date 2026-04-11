import type { Meta, StoryObj } from "@storybook/react";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@whitelabel/ui";

const meta: Meta<typeof Table> = {
  title: "Layout/Table",
  component: Table,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Table>;

interface Invoice {
  invoice: string;
  status: "Paid" | "Pending" | "Unpaid";
  method: string;
  amount: number;
}

const ROWS: Invoice[] = [
  { invoice: "INV001", status: "Paid", method: "Credit Card", amount: 250 },
  { invoice: "INV002", status: "Pending", method: "PayPal", amount: 150 },
  { invoice: "INV003", status: "Unpaid", method: "Bank Transfer", amount: 350 },
  { invoice: "INV004", status: "Paid", method: "Credit Card", amount: 450 },
  { invoice: "INV005", status: "Paid", method: "PayPal", amount: 50 },
];

export const Default: Story = {
  render: () => (
    <Table className="w-[640px]">
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.method}</TableCell>
            <TableCell className="text-right">${row.amount.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Sortable: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [asc, setAsc] = useState(true);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const sorted = useMemo(
      () => [...ROWS].sort((a, b) => (asc ? a.amount - b.amount : b.amount - a.amount)),
      [asc],
    );
    return (
      <Table className="w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead
              className="cursor-pointer text-right select-none"
              onClick={() => setAsc((v) => !v)}
              role="button"
              aria-sort={asc ? "ascending" : "descending"}
            >
              Amount {asc ? "▲" : "▼"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.invoice}>
              <TableCell className="font-medium">{row.invoice}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.method}</TableCell>
              <TableCell className="text-right">${row.amount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};
