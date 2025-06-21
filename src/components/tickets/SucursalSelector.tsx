// RUTA: src/components/tickets/SucursalSelector.tsx
'use client';
    

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, Check, ChevronsUpDown, Building, MapPin, X } from 'lucide-react';
import { createSucursalFromForm } from '@/app/actions/sucursalActions';
import { toast } from 'sonner';

// --- INICIO DE LA CORRECCIÓN FINAL ---
// Se mueven las interfaces de tipo al inicio del archivo para que estén disponibles
// en todo el componente, especialmente para el tipado explícito que se añadirá.

interface DireccionInfo {
  calle: string;
  numero: string;
  comuna: { nombre: string };
}
interface SucursalResult {
  id: string;
  nombre: string;
  empresa: { nombre: string } | null;
  direccion: DireccionInfo | null;
}
interface ComunaResult {
  id: string;
  nombre: string;
  provincia?: { nombre: string, region?: { nombre: string } };
}
type SearchResults = {
    sucursales: SucursalResult[];
    comunas: ComunaResult[];
}
// --- FIN DE LA CORRECCIÓN FINAL ---

interface SucursalSelectorProps {
  empresaId: string;
  onSucursalSelect: (sucursalId: string) => void;
  initialSucursalId?: string | null;
}



export function SucursalSelector({ empresaId, onSucursalSelect }: SucursalSelectorProps) {
  // Se corrige la declaración de estado para 'selectedSucursal' y 'open'.
  // 'selectedSucursal' ahora usa 'SucursalResult' y 'open' desestructura 'setOpen'.
  const [open, setOpen] = useState(false);
   const [selectedSucursal, setSelectedSucursal] = useState<SucursalResult | null>(null);

  const buttonText: string = selectedSucursal?.nombre || "Buscar por Comuna o Sucursal...";
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [results, setResults] = useState<SearchResults>({ sucursales: [], comunas: [] });
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSucursalNombre, setNewSucursalNombre] = useState('');
  const [newSucursalCalle, setNewSucursalCalle] = useState('');
  const [newSucursalNumero, setNewSucursalNumero] = useState('');
  const [selectedComunaForCreation, setSelectedComunaForCreation] = useState<ComunaResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 2) {
        setResults({ sucursales: [], comunas: [] });
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search/locations?q=${searchQuery}`);
        const data: SearchResults = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Error buscando locaciones:", error);
        toast.error("Error al buscar ubicaciones.");
      }
      setIsLoading(false);
    };

    const debounceTimer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSelectSucursal = (sucursal: SucursalResult) => {
    setSelectedSucursal(sucursal);
    onSucursalSelect(sucursal.id);
    setOpen(false);
    setShowCreateForm(false);
    setSearchQuery('');
  };

  const handleSelectComuna = (comuna: ComunaResult) => {
    setSelectedComunaForCreation(comuna);
    setShowCreateForm(true);
    setSearchQuery('');
    setOpen(false);
  };

  const handleCreateSucursal = async () => {
    if (!empresaId) {
        toast.error("Por favor, selecciona una empresa primero.");
        return;
    }
    if (!selectedComunaForCreation || !newSucursalNombre || !newSucursalCalle || !newSucursalNumero) {
        toast.error("Por favor, completa todos los campos para crear la sucursal.");
        return;
    }
    setIsCreating(true);
    const result = await createSucursalFromForm({
      nombre: newSucursalNombre,
      calle: newSucursalCalle,
      numero: newSucursalNumero,
      comunaId: selectedComunaForCreation.id,
      empresaId: empresaId
    });

    if (result.success && result.data) {
        // --- INICIO DE LA CORRECCIÓN ---
        // Se realiza un casting explícito para asegurar que el tipo `data` coincida con `SucursalResult`.
        // Esto es seguro porque la server action devuelve la sucursal con sus relaciones.
        const newSucursalData = result.data as unknown as SucursalResult;
        toast.success(`Sucursal "${newSucursalData.nombre}" creada exitosamente.`);
        handleSelectSucursal(newSucursalData);
        // --- FIN DE LA CORRECCIÓN ---
        setShowCreateForm(false);
        setNewSucursalNombre('');
        setNewSucursalCalle('');
        setNewSucursalNumero('');
        setSelectedComunaForCreation(null);
    } else {
        toast.error(result.error || "No se pudo crear la sucursal.");
    }
    setIsCreating(false);
  };
  
  const clearSelection = () => {
    setSelectedSucursal(null);
    onSucursalSelect('');
  };

  const getComunaDisplayString = (comuna: ComunaResult): string => {
    if (comuna.provincia?.nombre) {
      return `${comuna.nombre}, ${comuna.provincia.nombre}`;
    }
    return comuna.nombre;
  };

  if (selectedSucursal) {
    return (
      <div className="p-2 border rounded-md bg-muted/50 flex items-center justify-between">
          <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                {selectedSucursal.nombre}
              </p>
              <p className="text-xs text-muted-foreground pl-6">
                {selectedSucursal.direccion?.calle} {selectedSucursal.direccion?.numero}, {selectedSucursal.direccion?.comuna?.nombre}
              </p>
          </div>
          <Button variant="ghost" size="icon" onClick={clearSelection} className="h-7 w-7">
              <X className="h-4 w-4" />
          </Button>
      </div>
    );
  }

  if (showCreateForm && selectedComunaForCreation) {
    return (
        <div className="space-y-3 p-4 border rounded-md border-dashed">
            <h4 className="font-semibold text-sm">Crear Nueva Sucursal en "{selectedComunaForCreation.nombre}"</h4>
            <Input placeholder="Nombre de la nueva sucursal" value={newSucursalNombre} onChange={(e) => setNewSucursalNombre(e.target.value)} disabled={isCreating} />
            <div className='flex gap-2'>
                <Input placeholder="Calle" className="flex-grow" value={newSucursalCalle} onChange={(e) => setNewSucursalCalle(e.target.value)} disabled={isCreating} />
                <Input placeholder="Número" className="w-24" value={newSucursalNumero} onChange={(e) => setNewSucursalNumero(e.target.value)} disabled={isCreating} />
            </div>
            <div className='flex justify-end gap-2'>
                <Button variant="ghost" onClick={() => setShowCreateForm(false)} disabled={isCreating}>Cancelar</Button>
                <Button onClick={handleCreateSucursal} disabled={isCreating}>
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                    Guardar y Usar
                </Button>
            </div>
        </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {buttonText}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Escribe para buscar..." value={searchQuery} onValueChange={setSearchQuery} />
          {isLoading && <div className="p-2 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
          <CommandList>
            {!isLoading && results.sucursales.length === 0 && results.comunas.length === 0 && searchQuery.length > 1 && (
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            )}

            {results.sucursales.length > 0 && (
              <CommandGroup heading="Sucursales">
                {/* --- INICIO DE LA CORRECCIÓN FINAL --- */}
                {/* Se añade el tipo explícito 'SucursalResult' al parámetro del map. */}
                {results.sucursales.map((sucursal: SucursalResult) => (
                  <CommandItem key={sucursal.id} value={sucursal.nombre} onSelect={() => handleSelectSucursal(sucursal)}>
                    <Building className="mr-2 h-4 w-4" />
                    <span>{sucursal.nombre}</span>
                  </CommandItem>
                ))}
                {/* --- FIN DE LA CORRECCIÓN FINAL --- */}
              </CommandGroup>
            )}

            {results.comunas.length > 0 && (
              <CommandGroup heading="Comunas (para crear sucursal nueva)">
                {/* --- INICIO DE LA CORRECCIÓN FINAL --- */}
                {/* Se añade el tipo explícito 'ComunaResult' al parámetro del map. */}
                {results.comunas.map((comuna: ComunaResult) => (
                  <CommandItem key={comuna.id} value={comuna.nombre} onSelect={() => handleSelectComuna(comuna)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{getComunaDisplayString(comuna)}</span>
                  </CommandItem>
                ))}
                {/* --- FIN DE LA CORRECCIÓN FINAL --- */}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
