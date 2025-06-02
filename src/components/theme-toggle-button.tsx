// src/components/theme-toggle-button.tsx
"use client"

import * as React from "react"
import { Moon, Sun, Settings } from "lucide-react" // Import Settings o un icono genérico
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

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Renderizar un botón placeholder completamente estático
    // No usa clases que cambien con el tema (como dark:...) ni iconos dinámicos.
    // El tamaño y variante deben ser consistentes.
    return (
      <Button variant="outline" size="icon" disabled aria-hidden="true" style={{ width: '2.5rem', height: '2.5rem' }}>
        {/* Un icono simple y estático o incluso nada. 
            Usar 'h-[1.2rem] w-[1.2rem]' como en el original para mantener dimensiones si es posible,
            pero asegúrate que el Button en sí tenga un tamaño fijo (ej. size="icon" que es h-10 w-10)
            o aplica un style={{ width: '...', height: '...' }}
            El className="h-[1.2rem] w-[1.2rem]" original se aplica a los iconos Sun/Moon, no al botón.
            El Button size="icon" por defecto es h-10 w-10.
            Si los iconos Sun/Moon son de 1.2rem (aprox 19.2px), el botón es más grande.
            Vamos a usar el tamaño por defecto de size="icon" para el placeholder.
        */}
        <Settings className="h-[1.2rem] w-[1.2rem] opacity-50" /> {/* Icono genérico */}
      </Button>
    );
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
