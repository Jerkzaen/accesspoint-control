// RUTA: src/components/tickets/TicketFiltersPanel.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter as FilterIcon, PlusCircle } from 'lucide-react';
import { EstadoTicket, PrioridadTicket } from '@prisma/client';
import { cn } from '@/lib/utils';
import { TicketFilters } from '@/hooks/useTickets';

// Hook personalizado para "retrasar" la actualización de un valor (debounce)
// Evita que se hagan llamadas a la API con cada tecla que se presiona en el buscador.
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// Interfaz para definir las props que este componente recibirá
interface TicketFiltersPanelProps {
  onFiltersChange: (filters: TicketFilters) => void;
  onOpenCreateModal: () => void;
  initialFilters: TicketFilters;
}

// El componente en sí
const TicketFiltersPanelComponent: React.FC<TicketFiltersPanelProps> = ({
  onFiltersChange,
  onOpenCreateModal,
  initialFilters,
}) => {
  // Estado interno para manejar los valores de los filtros
  const [searchText, setSearchText] = React.useState(initialFilters.searchText || '');
  const [estadoFilter, setEstadoFilter] = React.useState<string>(initialFilters.estado || 'all');
  const [prioridadFilter, setPrioridadFilter] = React.useState<string>(initialFilters.prioridad || 'all');
  
  const debouncedSearchText = useDebounce(searchText, 500);

  // Este efecto se ejecuta solo cuando los filtros cambian, y notifica al componente padre.
  React.useEffect(() => {
    onFiltersChange({
      searchText: debouncedSearchText.trim() || undefined,
      estado: estadoFilter === 'all' ? undefined : estadoFilter,
      prioridad: prioridadFilter === 'all' ? undefined : prioridadFilter,
    });
  }, [debouncedSearchText, estadoFilter, prioridadFilter, onFiltersChange]);

  // Función para limpiar los filtros a su estado inicial
  const handleClearFilters = () => {
    setSearchText('');
    setEstadoFilter('all');
    setPrioridadFilter('all');
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm mb-4 flex-shrink-0">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FilterIcon className="h-5 w-5 text-primary" /> Filtros
        </h2>
        <Button onClick={onOpenCreateModal} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Crear Ticket
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="searchText">Buscar</Label>
          <Input id="searchText" placeholder="Título, Empresa..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className={cn("h-9", {"border-primary ring-1 ring-primary/50": searchText})} />
        </div>
        <div>
          <Label htmlFor="estadoFilter">Estado</Label>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger id="estadoFilter" className={cn("h-9", {"border-primary ring-1 ring-primary/50": estadoFilter !== 'all'})}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.values(EstadoTicket).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="prioridadFilter">Prioridad</Label>
          <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
            <SelectTrigger id="prioridadFilter" className={cn("h-9", {"border-primary ring-1 ring-primary/50": prioridadFilter !== 'all'})}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.values(PrioridadTicket).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button variant="outline" size="sm" onClick={handleClearFilters}>Limpiar</Button>
      </div>
    </div>
  );
};

// Memoizamos el componente para evitar que se re-renderice si sus props no cambian.
export const TicketFiltersPanel = React.memo(TicketFiltersPanelComponent);
