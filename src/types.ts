import { LucideIcon } from "lucide-react";

export interface SidebarItem {
    links: Array < {
        label: string;
        href: string;
        icon?: LucideIcon;
    } >;
}