import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn, ThemeProvider } from "@whitelabel/ui";
import { FaroProvider } from "@/components/providers/FaroProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/lib/auth-store";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Whitelabel Admin",
  description: "White-label admin dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body>
        <FaroProvider>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>{children}</AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </FaroProvider>
      </body>
    </html>
  );
}
