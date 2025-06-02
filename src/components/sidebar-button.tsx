// src/components/sidebar-button.tsx
import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button"; // Asegúrate que la ruta a ui/button es correcta
import { cn } from "@/lib/utils"; // Asegúrate que la ruta a lib/utils es correcta

interface SidebarButtonProps extends ButtonProps {
  icon?: LucideIcon;
  children: React.ReactNode;
}

// Componente base SidebarButton que acepta y reenvía una ref
const SidebarButton = React.forwardRef<
  HTMLButtonElement,
  SidebarButtonProps
>(({ icon: Icon, className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref} 
      variant="ghost"
      className={cn("gap-2 justify-start rounded-full w-full", className)} // Asegurar w-full aquí
      {...props}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      <span>{children}</span>
    </Button>
  );
});
SidebarButton.displayName = "SidebarButton";

export { SidebarButton }; // Solo exportamos SidebarButton