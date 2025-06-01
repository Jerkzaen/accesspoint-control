// src/types/sidebar.ts
import type { LucideIcon } from "lucide-react";

export interface SidebarLink {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface SidebarItem {
  links: SidebarLink[];
  extras?: React.ReactNode;
}