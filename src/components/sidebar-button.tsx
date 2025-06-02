// src/components/sidebar-button.tsx
import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button"; // Asegúrate que la ruta a ui/button es correcta
import { cn } from "@/lib/utils"; // Asegúrate que la ruta a lib/utils es correcta

interface SidebarButtonProps extends ButtonProps {
  icon?: LucideIcon;
  children: React.ReactNode;
}

// Define y exporta SidebarButton directamente
export const SidebarButton = React.forwardRef<
  HTMLButtonElement,
  SidebarButtonProps
>(({ icon: Icon, className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref} 
      variant="ghost"
      className={cn("gap-2 justify-start rounded-full w-full", className)}
      {...props}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      <span>{children}</span>
    </Button>
  );
});
SidebarButton.displayName = "SidebarButton";

// Ya no necesitamos la línea 'export { SidebarButton };' aquí abajo
// porque la exportación se hace directamente en la declaración de la constante.
    