//leftcolumntickets.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
// Ya no necesitamos los componentes de Table directamente aquí
// import { Table, TableBody, ... } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import SingleTicketItemCard from './SingleTicketItemCard'; // Importamos el nuevo componente

interface ActionEntry {
  id: string;
  fecha: string;
  descripcion: string;
}

interface Ticket {
  id: string;
  nroCaso: number;
  empresa: string;
  prioridad: string;
  tecnico: string;
  tipo: string;
  ubicacion: string;
  contacto: string;
  createdAt: string; // Mantener consistencia con SingleTicketItemCard
  descripcion: string;
  acciones: string; 
  estado: string;
  fechaSolucion: string | null;
}

export default function TicketCard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newActionDescription, setNewActionDescription] = useState('');
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editedActionDescription, setEditedActionDescription] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/tickets');
        if (!res.ok) {
          throw new Error(`Error al cargar tickets: ${res.statusText}`);
        }
        const data = await res.json();
        setTickets(data);
      } catch (error) {
        console.error("Error en fetchTickets:", error);
      }
    };
    fetchTickets();
  }, []);

  const parseActions = (ticket: Ticket | null): ActionEntry[] => {
    if (!ticket || !ticket.acciones) return [];
    try {
      const parsed = JSON.parse(ticket.acciones);
      if (Array.isArray(parsed)) {
        return parsed.map(act => {
          if (typeof act === 'object' && act !== null && typeof act.id === 'string') {
            return {
              id: act.id,
              fecha: typeof act.fecha === 'string' ? act.fecha : 'Fecha desconocida',
              descripcion: typeof act.descripcion === 'string' ? act.descripcion : '',
            };
          }
          return null; 
        }).filter(act => act !== null) as ActionEntry[];
      }
      return [];
    } catch (error) {
      console.error('Error al parsear acciones:', error);
      return [];
    }
  };

  const handleAddAction = async () => {
    if (!selectedTicket || !newActionDescription.trim()) return;
    const newActionEntry: ActionEntry = {
      id: crypto.randomUUID(), 
      fecha: new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }),
      descripcion: newActionDescription.trim(),
    };
    const currentActions = parseActions(selectedTicket);
    const updatedActions = [...currentActions, newActionEntry];
    console.log('Enviando para agregar acción:', { acciones: updatedActions });
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}/accion`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acciones: updatedActions }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al agregar la acción');
      }
      const updatedTicket: Ticket = await response.json();
      console.log('Ticket actualizado recibido del servidor (después de agregar acción):', updatedTicket); 
      setSelectedTicket(updatedTicket);
      setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
      setNewActionDescription('');
    } catch (error) {
      console.error('Error al agregar acción:', error);
      alert('Hubo un error al guardar la nueva acción.');
    }
  };

  const handleEditAction = async (actionIdToEdit: string, newDescription: string) => {
    if (!selectedTicket || !newDescription.trim() || !actionIdToEdit) {
      alert('Información inválida para editar la acción.');
      return;
    }
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}/accion/${actionIdToEdit}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: newDescription.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la acción editada');
      }
      const updatedTicket: Ticket = await response.json();
      console.log('Ticket actualizado recibido del servidor (después de editar acción):', updatedTicket);
      setSelectedTicket(updatedTicket);
      setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
      setEditingActionId(null);
      setEditedActionDescription('');
    } catch (error) {
      console.error('Error al editar acción:', error);
      alert(`Hubo un error al guardar la acción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditingActionId(null); // Resetea la edición al cambiar de ticket
    setEditedActionDescription('');
  };

  const actionsForSelectedTicket = selectedTicket ? parseActions(selectedTicket) : [];

  return (
    <div className="flex flex-grow flex-shrink flex-wrap h-full p-4 gap-4">
      {/* Columna de Tarjetas de Tickets */}
      <div 
        className="flex-grow overflow-y-auto pr-2 space-y-2" // Añadido space-y-2 para espaciado entre tarjetas
        style={{ width: 'calc(70% - 1rem)', maxHeight: 'calc(100vh - 120px)' }} // Ajusta maxHeight según tu layout general
      >
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <SingleTicketItemCard
              key={ticket.id}
              ticket={ticket}
              onSelectTicket={handleSelectTicket}
              isSelected={selectedTicket?.id === ticket.id}
            />
          ))
        ) : (
          <p className="text-muted-foreground">Cargando tickets o no hay tickets para mostrar...</p>
        )}
      </div>

      {/* Panel Lateral para Detalles del Ticket Seleccionado y Acciones */}
      <Card
        className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg p-4 sticky top-4" // Hacemos el panel lateral sticky
        style={{ width: '30%', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }} // Ajusta maxHeight y añade overflowY
      >
        {selectedTicket ? (
          <div className="flex flex-col h-full">
            {/* Información y Bitácora de acciones (sin cambios en esta parte) */}
            <div className="mb-4">
              <span className="text-sm font-semibold">
                Ticket #{selectedTicket.nroCaso} - {selectedTicket.empresa}
              </span>
              <br/>
              <span className="text-xs font-semibold">
                Última actualización: {selectedTicket.fechaSolucion || '--'} | Estado: {selectedTicket.estado}
              </span>
            </div>

            <div className="mb-4">
              <span className="text-sm font-semibold">Bitácora de acciones</span>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 space-y-2" style={{maxHeight: '300px'}}> {/* Max height para la bitácora interna */}
              {actionsForSelectedTicket.length > 0 ? actionsForSelectedTicket.map((act) => (
                <div key={act.id} className="text-xs border-b pb-1 flex items-start justify-between">
                  {editingActionId === act.id ? (
                    <Textarea
                      value={editedActionDescription}
                      onChange={(e) => setEditedActionDescription(e.target.value)}
                      className="flex-grow mr-2"
                      rows={2} 
                    />
                  ) : (
                    <span className="font-medium flex-grow mr-2 break-all">{act.fecha}: {act.descripcion}</span>
                  )}
                  <div className="flex-shrink-0 flex flex-col gap-1"> 
                    {editingActionId === act.id ? (
                      <>
                        <Button
                          variant="default" 
                          size="sm"
                          onClick={() => handleEditAction(act.id, editedActionDescription)}
                        >
                          Guardar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingActionId(null);
                            setEditedActionDescription('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingActionId(act.id);
                          setEditedActionDescription(act.descripcion);
                        }}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              )) : <p className="text-xs text-muted-foreground">No hay acciones registradas.</p>}
            </div>

            {/* Agregar nueva acción (sin cambios en esta parte) */}
            <div className="mt-auto"> {/* Empuja esta sección al final si el contenido anterior no llena el espacio */}
              <div className="mb-2">
                <span className="text-sm font-semibold">Agregar nueva acción</span>
                <Textarea
                  className="mt-2"
                  value={newActionDescription}
                  onChange={(e) => setNewActionDescription(e.target.value)}
                  placeholder="Describe la acción realizada..."
                />
              </div>
              <Button className="mt-2 w-full" onClick={handleAddAction}> {/* Botón ocupa todo el ancho */}
                Guardar acción
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground flex items-center justify-center h-full">
            <p>Selecciona un ticket de la lista para ver sus detalles y acciones.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
