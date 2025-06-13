// src/components/ui/drawer.tsx
// Este archivo ahora usa los componentes Sheet de shadcn/ui para crear un Drawer inferior.
// Esto elimina la dependencia 'vaul' y unifica la lógica de modales/cajones.

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Importamos TODOS los componentes de Sheet directamente de tu UI existente.
// Es crucial que todos los componentes que se usan (SheetPortal, SheetOverlay, etc.)
// estén correctamente importados desde el archivo original.
import {
  Sheet as SheetPrimitive,
  SheetClose as SheetPrimitiveClose,
  SheetContent as SheetPrimitiveContent,
  SheetDescription as SheetPrimitiveDescription,
  SheetFooter as SheetPrimitiveFooter,
  SheetHeader as SheetPrimitiveHeader,
  SheetOverlay as SheetPrimitiveOverlay,
  SheetPortal as SheetPrimitivePortal,
  SheetTitle as SheetPrimitiveTitle,
  SheetTrigger as SheetPrimitiveTrigger,
} from "@/components/ui/sheet"; // Asegúrate de que esta ruta sea correcta y que todos los componentes se exporten desde aquí

// Renombramos los componentes de Sheet para que coincidan con la API de Drawer.
// Esto permite una migración más sencilla sin cambiar las importaciones en el resto del proyecto.
// No es necesario re-exportar cada uno individualmente si ya se importan arriba,
// pero los listamos explícitamente en el export final para claridad.
const Drawer = SheetPrimitive;
const DrawerTrigger = SheetPrimitiveTrigger;
const DrawerPortal = SheetPrimitivePortal; // Aquí se define DrawerPortal
const DrawerClose = SheetPrimitiveClose;
const DrawerOverlay = SheetPrimitiveOverlay; // Aquí se define DrawerOverlay

// Las variantes y propiedades de SheetContent se mantienen, pero con un valor predeterminado para 'side'
// que simula un drawer inferior.
interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitiveContent> {
  // Opcional: puedes añadir un prop para ocultar el handle superior si lo deseas
  hideHandle?: boolean;
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitiveContent>,
  DrawerContentProps
>(({ className, children, hideHandle = false, ...props }, ref) => (
  // CORRECCIÓN: Usamos DrawerPortal y DrawerOverlay aquí
  <DrawerPortal> {/* Usamos DrawerPortal, no SheetPortal */}
    <DrawerOverlay /> {/* Usamos DrawerOverlay, no SheetOverlay */}
    <SheetPrimitiveContent
      ref={ref}
      // Forzamos el lado a 'bottom' para simular el comportamiento de vaul
      side="bottom"
      // Eliminamos el botón de cerrar por defecto, ya que vaul no lo tiene
      // y esperamos que el contenido del drawer maneje su propio cierre.
      hideClose={true} 
      className={cn(
        // Clases para simular el estilo de vaul: altura automática, esquinas redondeadas en la parte superior
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      {/* El "handle" superior del drawer, como en el componente vaul original */}
      {!hideHandle && (
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      )}
      {children}
    </SheetPrimitiveContent>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

// Reutilizamos los demás componentes de Sheet directamente, ya que su API es compatible
const DrawerHeader = SheetPrimitiveHeader;
const DrawerFooter = SheetPrimitiveFooter;
const DrawerTitle = SheetPrimitiveTitle;
const DrawerDescription = SheetPrimitiveDescription;

export {
  Drawer,
  DrawerPortal, // Exportamos SheetPortal como DrawerPortal
  DrawerOverlay, // Exportamos SheetOverlay como DrawerOverlay
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
