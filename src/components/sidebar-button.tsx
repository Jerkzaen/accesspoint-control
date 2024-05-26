// Importamos los iconos de lucide-react
import { LucideIcon, Sun, Home } from "lucide-react";
// Importamos el componente Button y ButtonProps
import { Button, ButtonProps } from "./ui/button";
// Importamos la función cn desde el archivo utils
import { cn } from "@/lib/utils";

// Definimos la interfaz sidebarButtonProps que extiende de ButtonProps y agrega un icono de tipo LucideIcon
interface sidebarButtonProps extends ButtonProps {
  icon?: LucideIcon;
}
//
export function SidebarButton({
  icon: Icon,
  className,
  children,
  ...props
}: sidebarButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn("gap-2 justify-start rounded-full", className)}
      {...props}
    >
      {Icon && <Icon />}
      <span>{children}</span>
    </Button>
  );
}
