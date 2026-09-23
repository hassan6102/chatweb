import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Messaging App",
  description: "Backend foundation phase — no final UI yet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
