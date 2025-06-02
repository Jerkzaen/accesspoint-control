// src/components/sidebar-button.tsx
import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button"; // Asegúrate que la ruta a ui/button es correcta
import { cn } from "@/lib/utils"; // Asegúrate que la ruta a lib/utils es correcta

interface SidebarButtonProps extends ButtonProps {
  icon?: LucideIcon;
  children: React.ReactNode;
  // La prop 'asChild' se hereda de ButtonProps, no es necesario añadirla aquí explícitamente
  // a menos que quieras restringir su tipo.
}

// Define y exporta SidebarButton directamente
export const SidebarButton = React.forwardRef<
  HTMLButtonElement, // La ref será para un elemento botón
  SidebarButtonProps
>(({ icon: Icon, className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref} 
      variant="ghost"
      className={cn("gap-2 justify-start rounded-full w-full", className)} // w-full por defecto
      {...props} // Pasa todas las props, incluyendo un posible asChild desde el padre
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      <span>{children}</span>
    </Button>
  );
});
SidebarButton.displayName = "SidebarButton";
