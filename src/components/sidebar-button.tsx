// Importamos los iconos de lucide-react
import { LucideIcon, Sun, Home } from "lucide-react";
// Importamos el componente Button y ButtonProps
import { Button, ButtonProps } from "./ui/button";
// Importamos la función cn desde el archivo utils
import { cn } from "@/lib/utils";
// Importamos el componente SheetClose desde el archivo sheet
import { SheetClose } from "./ui/sheet";

// Definimos la interfaz sidebarButtonProps que extiende de ButtonProps y agrega un icono de tipo LucideIcon
interface sidebarButtonProps extends ButtonProps {
  icon?: LucideIcon;
}
/// Definimos la función SidebarButton que recibe un icono, una clase y un children y devuelve un componente Button
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
// Definimos la función SidebarButtonSheet que devuelve un componente SheetClose que recibe como hijo el componente SidebarButton
export function SidebarButtonSheet(props: sidebarButtonProps) {
  return (
    <SheetClose asChild>
      <SidebarButton {...props} />
    </SheetClose>
  );
}
