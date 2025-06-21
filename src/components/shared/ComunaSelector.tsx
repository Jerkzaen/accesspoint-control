'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { searchComunas, ComunaConProvinciaYRegion } from '@/app/actions/geografiaActions';

// Exportamos el tipo para que pueda ser usado por otros componentes
export type { ComunaConProvinciaYRegion };

interface ComunaSelectorProps {
  // Función que se llama cuando el usuario selecciona o limpia una comuna.
  onSelect: (comuna: ComunaConProvinciaYRegion | null) => void;
  // La comuna inicial a mostrar, útil para formularios de edición.
  initialComuna?: ComunaConProvinciaYRegion | null;
}

export function ComunaSelector({ onSelect, initialComuna }: ComunaSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedComuna, setSelectedComuna] = React.useState<ComunaConProvinciaYRegion | null>(initialComuna || null);
  const [searchTerm, setSearchTerm] = React.useState(initialComuna?.nombre || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<ComunaConProvinciaYRegion[]>([]);

  // Efecto para buscar comunas con "debounce" (retraso) mientras el usuario escribe.
  React.useEffect(() => {
    // Si el campo de búsqueda está vacío o coincide con la comuna seleccionada, no busca.
    if (!searchTerm.trim() || searchTerm === selectedComuna?.nombre) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      const response = await searchComunas(searchTerm);
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        console.error(response.error);
        setResults([]);
      }
      setIsLoading(false);
    }, 300); // 300ms de retraso para no hacer una petición en cada tecla.

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedComuna?.nombre]);


  // Maneja la selección de una comuna de la lista.
  const handleSelect = (comuna: ComunaConProvinciaYRegion) => {
    setSelectedComuna(comuna);
    setSearchTerm(comuna.nombre);
    onSelect(comuna);
    setOpen(false);
    setResults([]);
  };
  
  // Maneja la limpieza de la selección actual.
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que el popover se abra al hacer clic en la X.
    setSelectedComuna(null);
    setSearchTerm('');
    onSelect(null);
    setResults([]);
  };

  // Determina el texto a mostrar en el botón.
  const getDisplayValue = () => {
    if (selectedComuna) {
      // Asegurarse de que provincia y region existan antes de acceder a sus propiedades
      if (selectedComuna.provincia && selectedComuna.provincia.region) {
        return `${selectedComuna.nombre}, ${selectedComuna.provincia.region.nombre}`;
      } else {
        return selectedComuna.nombre; // Fallback si la información completa no está disponible
      }
    }
    return 'Seleccione una comuna...';
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between pr-8" // Padding extra a la derecha para la X
          >
            {getDisplayValue()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
         {selectedComuna && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
        )}
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar comuna..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {isLoading && (
                <div className="p-2 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!isLoading && searchTerm.trim().length > 0 && results.length === 0 && (
                <CommandEmpty>No se encontraron comunas.</CommandEmpty>
              )}
              
              <CommandGroup>
                {results.map((comuna) => (
                  <CommandItem
                    key={comuna.id}
                    value={`${comuna.nombre}-${comuna.provincia.nombre}`} // Valor único para el item
                    onSelect={() => handleSelect(comuna)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedComuna?.id === comuna.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div>
                      <p>{comuna.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {comuna.provincia.nombre}, {comuna.provincia.region.nombre}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
