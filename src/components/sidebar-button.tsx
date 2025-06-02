// src/components/sidebar-button.tsx
import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button"; // Asegúrate que la ruta a ui/button es correcta
import { cn } from "@/lib/utils"; // Asegúrate que la ruta a lib/utils es correcta
import { SheetClose } from "./ui/sheet"; // Asegúrate que la ruta a ui/sheet es correcta

// Definir la interfaz de props para SidebarButton, asegurando que children esté definido
interface SidebarButtonProps extends ButtonProps {
  icon?: LucideIcon;
  children: React.ReactNode; // Es importante que children esté explícitamente en las props
}

// Componente base SidebarButton que ahora acepta y reenvía una ref
const SidebarButton = React.forwardRef<
  HTMLButtonElement,
  SidebarButtonProps
>(({ icon: Icon, className, children, ...props }, ref) => {
  return (
    <Button
      ref={ref} // Pasar la ref al componente Button de Shadcn/ui
      variant="ghost"
      className={cn("gap-2 justify-start rounded-full", className)}
      {...props}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}{" "}
      {/* Añadido mr-2 para espaciado */}
      <span>{children}</span>
    </Button>
  );
});
SidebarButton.displayName = "SidebarButton"; // Buena práctica para DevTools

// Componente SidebarButtonSheet que también acepta y reenvía una ref
// Este es el que se importa como 'SidebarButton' en sidebar-mobile.tsx
const SidebarButtonSheet = React.forwardRef<
  HTMLButtonElement,
  SidebarButtonProps // Usa la misma interfaz de props
>(({ ...props }, ref) => {
  return (
    <SheetClose asChild>
      {/* Pasar la ref a la instancia de SidebarButton */}
      <SidebarButton ref={ref} {...props} />
    </SheetClose>
  );
});
SidebarButtonSheet.displayName = "SidebarButtonSheet"; // Buena práctica para DevTools

export { SidebarButton, SidebarButtonSheet };
