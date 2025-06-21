// RUTA: src/components/empresas/DireccionComercialSelector.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, Check, ChevronsUpDown, MapPin, X, HomeIcon, Building } from 'lucide-react';
import { toast } from 'sonner';
import { searchComunas, ComunaWithProvinciaAndRegion } from '@/app/actions/comunaActions';
import { cn } from '@/lib/utils'; // Para utilidades de clases

// --- Interfaces para los datos de la Dirección ---
interface DireccionData {
  calle: string | null;
  numero: string | null;
  comunaId: string | null;
}

// --- Interfaces para las Props del Selector ---
interface DireccionComercialSelectorProps {
  // Callback que se dispara cuando se selecciona o "finaliza" una dirección
  onDireccionSelect: (direccionData: DireccionData) => void;
  // Dirección inicial para modo edición
  initialDireccion?: (DireccionData & { comunaNombre?: string | null }) | null;
}

export function DireccionComercialSelector({ onDireccionSelect, initialDireccion }: DireccionComercialSelectorProps) {
  const [open, setOpen] = useState(false); // Estado para controlar si el Popover está abierto/cerrado
  const [searchQuery, setSearchQuery] = useState(''); // Término de búsqueda para comunas
  const [isLoading, setIsLoading] = useState(false); // Estado de carga para la búsqueda
  const [comunaSearchResults, setComunaSearchResults] = useState<ComunaWithProvinciaAndRegion[]>([]); // Resultados de la búsqueda de comunas

  // Estado para la dirección actualmente seleccionada/mostrada en el selector
  // Este estado puede ser la initialDireccion o una que el usuario elija/cree
  const [currentSelectedDireccion, setCurrentSelectedDireccion] = useState<(DireccionData & { comunaNombre?: string | null }) | null>(initialDireccion || null);

  // Estados para el formulario de entrada de calle/número, visible tras seleccionar una comuna
  const [showCalleNumeroForm, setShowCalleNumeroForm] = useState(false);
  const [inputCalle, setInputCalle] = useState(initialDireccion?.calle || '');
  const [inputNumero, setInputNumero] = useState(initialDireccion?.numero || '');
  const [selectedComunaForForm, setSelectedComunaForForm] = useState<ComunaWithProvinciaAndRegion | null>(null);

  // Ref para el temporizador de debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Efecto para inicializar la dirección cuando la prop 'initialDireccion' cambia ---
  useEffect(() => {
    // Si la dirección inicial cambia y no estamos en medio de una selección
    if (initialDireccion !== undefined) {
      setCurrentSelectedDireccion(initialDireccion);
      // Si hay una dirección inicial completa, cerramos el formulario de calle/número.
      if (initialDireccion?.comunaId) {
        setShowCalleNumeroForm(false);
        setInputCalle(initialDireccion.calle || '');
        setInputNumero(initialDireccion.numero || '');
        // Necesitamos cargar los datos completos de la comuna si solo tenemos el ID al inicio
        if (initialDireccion.comunaId && !initialDireccion.comunaNombre) {
            searchComunas(initialDireccion.comunaId).then(res => {
                if (res.success && res.data.length > 0) {
                    setCurrentSelectedDireccion(prev => ({ ...prev, comunaNombre: res.data[0].nombre, ...res.data[0].provincia?.nombre && {provinciaNombre: res.data[0].provincia.nombre}, ...res.data[0].provincia?.region?.nombre && {regionNombre: res.data[0].provincia.region.nombre} }));
                }
            });
        }
      }
    }
  }, [initialDireccion]);

  // --- Efecto para el debounce de la búsqueda de comunas ---
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.length < 2) {
      setComunaSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await searchComunas(searchQuery);
        if (result.success) {
          setComunaSearchResults(result.data);
        } else {
          toast.error(result.error || "Error al buscar comunas.");
          setComunaSearchResults([]);
        }
      } catch (err) {
        console.error("Error en la búsqueda de comunas:", err);
        toast.error("Error al buscar comunas.");
        setComunaSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce de 300ms

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // --- Funciones de manejo ---

  // Obtiene el string completo de la comuna para mostrarlo
  const getComunaDisplayString = useCallback((comuna: ComunaWithProvinciaAndRegion): string => {
    let display = comuna.nombre;
    if (comuna.provincia?.nombre) {
      display += `, ${comuna.provincia.nombre}`;
      if (comuna.provincia.region?.nombre) {
        display += `, ${comuna.provincia.region.nombre}`;
      }
    }
    return display;
  }, []);

  // Cuando se selecciona una comuna de los resultados de búsqueda
  const handleComunaSelect = useCallback((comuna: ComunaWithProvinciaAndRegion) => {
    setSelectedComunaForForm(comuna); // Guarda la comuna completa
    setOpen(false); // Cierra el popover
    setShowCalleNumeroForm(true); // Muestra el formulario de calle/número
    setSearchQuery(''); // Limpia el término de búsqueda
    setComunaSearchResults([]); // Limpia los resultados de búsqueda
    // Inicializa los inputs de calle/numero si no hay dirección inicial
    if (!initialDireccion) {
      setInputCalle('');
      setInputNumero('');
    }
  }, [initialDireccion]);

  // Cuando se confirma la calle y el número (o se deja vacío)
  const handleSaveDireccion = useCallback(() => {
    if (!selectedComunaForForm?.id) {
        toast.error("Debe seleccionar una comuna para guardar la dirección.");
        return;
    }

    const finalDireccionData: DireccionData = {
        calle: inputCalle.trim() || null,
        numero: inputNumero.trim() || null,
        comunaId: selectedComunaForForm.id,
    };

    // Actualiza el estado local y emite los datos al padre
    setCurrentSelectedDireccion({
        ...finalDireccionData,
        comunaNombre: getComunaDisplayString(selectedComunaForForm)
    });
    onDireccionSelect(finalDireccionData);

    setShowCalleNumeroForm(false); // Oculta el formulario de calle/número
    setOpen(false); // Asegura que el popover esté cerrado
  }, [inputCalle, inputNumero, selectedComunaForForm, onDireccionSelect, getComunaDisplayString]);

  // Para limpiar la dirección seleccionada
  const handleClearSelection = useCallback(() => {
    setCurrentSelectedDireccion(null);
    setInputCalle('');
    setInputNumero('');
    setSelectedComunaForForm(null);
    setShowCalleNumeroForm(false);
    onDireccionSelect({ calle: null, numero: null, comunaId: null });
  }, [onDireccionSelect]);

  // El texto que se muestra en el botón/gatillo del Popover
  const popoverButtonText = currentSelectedDireccion ? (
    currentSelectedDireccion.calle && currentSelectedDireccion.numero && currentSelectedDireccion.comunaNombre
      ? `${currentSelectedDireccion.calle} ${currentSelectedDireccion.numero}, ${currentSelectedDireccion.comunaNombre}`
      : currentSelectedDireccion.comunaNombre
        ? `En ${currentSelectedDireccion.comunaNombre}`
        : "Seleccione una Dirección Comercial..."
  ) : "Seleccione una Dirección Comercial...";

  // --- Renderizado del componente ---
  return (
    <div className="w-full">
      {currentSelectedDireccion && !showCalleNumeroForm ? (
        // Modo de visualización de dirección seleccionada
        <div className="p-2 border rounded-md bg-muted/50 flex items-center justify-between">
          <div className="flex-grow">
            <p className="text-sm font-medium flex items-center gap-2">
              <HomeIcon className="h-4 w-4 text-primary" />
              {currentSelectedDireccion.calle || 'Sin Calle'} {currentSelectedDireccion.numero || ''}
            </p>
            {currentSelectedDireccion.comunaNombre && (
                <p className="text-xs text-muted-foreground pl-6">
                    {currentSelectedDireccion.comunaNombre}
                </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleClearSelection} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : showCalleNumeroForm && selectedComunaForForm ? (
        // Formulario inline para Calle y Número después de seleccionar Comuna
        <div className="space-y-3 p-4 border rounded-md border-dashed">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Detalles de Dirección en {getComunaDisplayString(selectedComunaForForm)}
          </h4>
          <Input placeholder="Calle (ej: Av. Libertador)" value={inputCalle} onChange={(e) => setInputCalle(e.target.value)} />
          <Input placeholder="Número (ej: 123)" value={inputNumero} onChange={(e) => setInputNumero(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowCalleNumeroForm(false); setSelectedComunaForForm(null); setInputCalle(''); setInputNumero(''); }} size="sm">Cancelar</Button>
            <Button onClick={handleSaveDireccion} size="sm">
              <Check className="mr-2 h-4 w-4" /> Confirmar Dirección
            </Button>
          </div>
        </div>
      ) : (
        // Popover para buscar Comunas
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between min-h-[40px]" // Añadido min-height para consistencia
            >
              <span className="truncate pr-2">{popoverButtonText}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar Comuna (mín. 2 caracteres)..." value={searchQuery} onValueChange={setSearchQuery} />
              {isLoading && <div className="p-2 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
              <CommandList>
                {!isLoading && comunaSearchResults.length === 0 && searchQuery.length > 1 && (
                  <CommandEmpty>No se encontraron comunas.</CommandEmpty>
                )}

                {comunaSearchResults.length > 0 && (
                  <CommandGroup heading="Comunas">
                    {comunaSearchResults.map((comuna) => (
                      <CommandItem key={comuna.id} value={comuna.nombre} onSelect={() => handleComunaSelect(comuna)}>
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>{getComunaDisplayString(comuna)}</span>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedComunaForForm?.id === comuna.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
