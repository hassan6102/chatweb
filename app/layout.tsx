import type { Metadata, Viewport } from "next";
// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "Messaging App",
  description: "A fast, modern 1-to-1 messaging app — find people by User ID and chat privately.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_INIT_SCRIPT = `
try {
  var stored = JSON.parse(localStorage.getItem("theme-preference") || '"system"');
  if (stored === "light" || stored === "dark") {
    document.documentElement.setAttribute("data-theme", stored);
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}