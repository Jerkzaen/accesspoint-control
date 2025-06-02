// src/components/theme-toggle-button.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme(); // Usar resolvedTheme para el placeholder si es necesario
  const [mounted, setMounted] = React.useState(false);

  // Efecto para establecer que el componente está montado en el cliente
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Si el componente aún no está montado, no renderizamos nada o un placeholder muy simple
  // para evitar el mismatch de hidratación. Retornar null es a menudo lo más seguro.
  if (!mounted) {
    // Alternativamente, podrías renderizar un botón esqueleto si el salto de layout es un problema,
    // pero asegúrate de que su contenido no dependa del tema.
    // Por ahora, retornamos null para máxima seguridad contra errores de hidratación.
    // Si necesitas mantener el espacio, un botón simple sin iconos dinámicos:
    // return <Button variant="outline" size="icon" disabled className="h-[1.2rem] w-[1.2rem]" />;
    return null; 
  }

  // Una vez montado, renderizamos el componente completo
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          Systema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
