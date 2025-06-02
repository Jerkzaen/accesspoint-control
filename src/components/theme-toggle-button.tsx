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
  const { setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Efecto para establecer que el componente está montado en el cliente
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Si el componente aún no está montado, no renderizamos el botón real
  // para evitar el mismatch de hidratación.
  // Puedes retornar null o un placeholder. Un botón deshabilitado puede ser una buena opción
  // para mantener el espacio en el layout y evitar saltos visuales.
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled className="h-[1.2rem] w-[1.2rem] aspect-square opacity-50">
        {/* Puedes poner un icono genérico o dejarlo vacío */}
      </Button>
    );
  }

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
