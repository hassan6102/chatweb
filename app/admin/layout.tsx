import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { AdminShell } from "@/components/admin/AdminShell";

// Fonts are scoped to this layout (via CSS variables consumed only by
// admin-* Tailwind tokens) so they never affect the normal user-facing UI
// built under the rest of app/**.
const adminSans = Manrope({
  subsets: ["latin"],
  variable: "--font-admin-sans",
  display: "swap",
});

const adminMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-admin-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin console",
  description: "Administration dashboard for the messaging app.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${adminSans.variable} ${adminMono.variable}`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
