import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- ألوان واجهة المستخدم العادية (Claude 2) ---
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
        "surface-sunken": "rgb(var(--surface-sunken) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--ink-muted) / <alpha-value>)",
        "ink-faint": "rgb(var(--ink-faint) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-ink": "rgb(var(--accent-ink) / <alpha-value>)",
        "bubble-out": "rgb(var(--bubble-out) / <alpha-value>)",
        "bubble-out-ink": "rgb(var(--bubble-out-ink) / <alpha-value>)",
        "bubble-in": "rgb(var(--bubble-in) / <alpha-value>)",
        online: "rgb(var(--online) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",

        // --- ألوان لوحة تحكم الإدارة (Claude 3) ---
        admin: {
          ink: "#12141C",
          ink2: "#1B1E29",
          ink3: "#262A38",
          canvas: "#F4F5F7",
          surface: "#FFFFFF",
          border: "#E1E3E8",
          borderStrong: "#C7CAD3",
          text: "#171923",
          textMuted: "#6B7280",
          textFaint: "#9AA0AC",
          textInverse: "#F4F5F7",
          textInverseMuted: "#9AA3B8",
          accent: "#3854E0",
          accentHover: "#2D45C7",
          accentSoft: "#EBEEFC",
          success: "#1E8F5F",
          successSoft: "#E5F5EC",
          warning: "#B7791F",
          warningSoft: "#FBF0DD",
          danger: "#C4392B",
          dangerHover: "#A92F22",
          dangerSoft: "#FBEAE7",
          moderator: "#7A5AF8",
          moderatorSoft: "#EFEAFE",
        },
      },
      fontFamily: {
        // خطوط واجهة المستخدم
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // خطوط لوحة الإدارة
        adminSans: ["var(--font-admin-sans)", "sans-serif"],
        adminMono: ["var(--font-admin-mono)", "monospace"],
      },
      maxWidth: {
        // أقصى عرض لعمود المحادثة (من Claude 2)
        "chat-col": "26rem",
      },
    },
  },
  plugins: [],
};

export default config;