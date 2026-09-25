import type { SVGProps } from "react";
import type { AdminPermission } from "@/types/admin";
import {
  GridIcon,
  UsersIcon,
  ChatIcon,
  FlagIcon,
  BellIcon,
  ShieldIcon,
  ClipboardIcon,
  ChartIcon,
  SettingsIcon,
} from "@/components/admin/icons";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
  permission: AdminPermission;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: GridIcon, permission: "overview:view" },
  { href: "/admin/users", label: "Users", icon: UsersIcon, permission: "users:view" },
  { href: "/admin/conversations", label: "Conversations", icon: ChatIcon, permission: "conversations:view" },
  { href: "/admin/reports", label: "Reports", icon: FlagIcon, permission: "reports:view" },
  { href: "/admin/notifications", label: "Notifications", icon: BellIcon, permission: "notifications:send" },
  { href: "/admin/security", label: "Security", icon: ShieldIcon, permission: "security:view" },
  { href: "/admin/logs", label: "Activity logs", icon: ClipboardIcon, permission: "logs:view" },
  { href: "/admin/statistics", label: "Statistics", icon: ChartIcon, permission: "statistics:view" },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon, permission: "settings:view" },
];
