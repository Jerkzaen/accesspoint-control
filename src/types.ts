import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface SidebarItem {
  links: Array<{
    label: string;
    href: string;
    icon?: LucideIcon;
  }>;
  extras?: ReactNode;
}
