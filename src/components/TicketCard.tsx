'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import SingleTicketItemCard from './SingleTicketItemCard'; 
import { Ticket, ActionEntry } from '@/types/ticket'; 
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3 } from 'lucide-react'; // Icono para el botón editar

// Definición explícita para los campos editables del ticket
interface EditableTicketFields {
  tecnico: string;
  prioridad: string;
  contacto: string;
  estado: string; 
}

export default function TicketCard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newActionDescription, setNewActionDescription] = useState('');
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editedActionDescription, setEditedActionDescription] = useState('');

  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [editableTicketData, setEditableTicketData] = useState<EditableTicketFields | null>(null);

  // Ajusta este valor según la altura de tu cabecera global y el padding de la página.
  // Representa el espacio vertical que NO está disponible para el contenido de las columnas.
  const headerAndPagePaddingOffset = '100px'; // Ejemplo: 60px cabecera + 2rem (32px) padding de página arriba/abajo

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/tickets');
        if (!res.ok) {
          throw new Error(`Error al cargar tickets: ${res.statusText}`);
        }
        const data: Ticket[] = await res.json(); 
        setTickets(data);
      } catch (error) {
        console.error("Error en fetchTickets:", error);
      }
    };
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      setEditableTicketData({
        tecnico: selectedTicket.tecnico,
        prioridad: selectedTicket.prioridad,
        contacto: selectedTicket.contacto,
        estado: selectedTicket.estado,
      });
      setIsEditingTicket(false); 
    } else {
      setEditableTicketData(null);
      setIsEditingTicket(false);
    }
  }, [selectedTicket]);

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
      const updatedTicketData: Ticket = await response.json();
      setSelectedTicket(updatedTicketData);
      setTickets((prev) => prev.map((t) => (t.id === updatedTicketData.id ? updatedTicketData : t)));
      setNewActionDescription('');
    } catch (error) {
      console.error('Error al agregar acción:', error);
      alert('Hubo un error al guardar la nueva acción.');
    }
  };

  const handleEditAction = async (actionIdToEdit: string, newDescription: string) => {
    if (!selectedTicket || !newDescription.trim() || !actionIdToEdit) return;
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
      const updatedTicketData: Ticket = await response.json();
      setSelectedTicket(updatedTicketData);
      setTickets((prev) => prev.map((t) => (t.id === updatedTicketData.id ? updatedTicketData : t)));
      setEditingActionId(null);
      setEditedActionDescription('');
    } catch (error) {
      console.error('Error al editar acción:', error);
      alert(`Hubo un error al guardar la acción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsEditingTicket(false); 
    setEditingActionId(null); 
    setEditedActionDescription('');
  };

  const handleTicketInputChange = (field: keyof EditableTicketFields, value: string) => {
    setEditableTicketData(prev => {
      if (!prev) return null; 
      return { ...prev, [field]: value };
    });
  };

  const handleSaveTicketChanges = async () => {
    if (!selectedTicket || !editableTicketData) return;
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tecnico: editableTicketData.tecnico,
          prioridad: editableTicketData.prioridad,
          contacto: editableTicketData.contacto,
          estado: editableTicketData.estado,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el ticket');
      }
      const updatedTicketData: Ticket = await response.json();
      setSelectedTicket(updatedTicketData);
      setTickets(prevTickets => prevTickets.map(t => t.id === updatedTicketData.id ? updatedTicketData : t));
      setIsEditingTicket(false); 
      alert('Ticket actualizado correctamente!');
    } catch (error) {
      console.error("Error al actualizar ticket:", error);
      alert(`Error al actualizar el ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const actionsForSelectedTicket = selectedTicket ? parseActions(selectedTicket) : [];

  return (
    <div className="flex flex-grow flex-shrink flex-wrap h-full p-4 gap-4">
      {/* Columna de Tarjetas de Tickets */}
      <div 
        className="flex-grow overflow-y-auto pr-2 space-y-2"
        style={{ width: 'calc(70% - 1rem)', maxHeight: `calc(100vh - ${headerAndPagePaddingOffset})` }} 
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
        className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg p-4 sticky top-4 flex flex-col" 
        style={{ width: '30%', maxHeight: `calc(100vh - ${headerAndPagePaddingOffset})`, overflowY: 'hidden' }} 
      >
        {selectedTicket && editableTicketData ? (
          <div className="flex flex-col h-full overflow-y-auto"> {/* Este div interno maneja el scroll */}
            {/* Información del Ticket y Botón Editar */}
            <div className="mb-3 pb-2 border-b flex-shrink-0"> 
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Ticket #{selectedTicket.nroCaso} - {selectedTicket.empresa}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Actualizado: {selectedTicket.fechaSolucion || '--'} | Estado: {selectedTicket.estado}
                  </CardDescription>
                </div>
                {!isEditingTicket && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingTicket(true)} className="ml-auto">
                    <Edit3 className="h-3 w-3 mr-1.5" /> Editar
                  </Button>
                )}
              </div>
            </div>
            
            {/* Formulario de Edición del Ticket (condicional) */}
            {isEditingTicket && (
              <Card className="mb-3 p-3 border-dashed flex-shrink-0 bg-muted/30 dark:bg-muted/10">
                <CardHeader className="p-1 pb-2">
                  <CardTitle className="text-sm">Editando Ticket #{selectedTicket.nroCaso}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-1 text-xs">
                  <div className="space-y-0.5">
                    <Label htmlFor="tecnicoEdit" className="text-xs">Técnico</Label>
                    <Input id="tecnicoEdit" value={editableTicketData.tecnico} onChange={(e) => handleTicketInputChange('tecnico', e.target.value)} className="h-8 text-xs"/>
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="prioridadEdit" className="text-xs">Prioridad</Label>
                    <Select value={editableTicketData.prioridad} onValueChange={(value) => handleTicketInputChange('prioridad', value)}>
                      <SelectTrigger id="prioridadEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">BAJA</SelectItem>
                        <SelectItem value="media">MEDIA</SelectItem>
                        <SelectItem value="alta">ALTA</SelectItem>
                        <SelectItem value="urgente">URGENTE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="contactoEdit" className="text-xs">Contacto</Label>
                    <Input id="contactoEdit" value={editableTicketData.contacto} onChange={(e) => handleTicketInputChange('contacto', e.target.value)} className="h-8 text-xs"/>
                  </div>
                   <div className="space-y-0.5">
                    <Label htmlFor="estadoEdit" className="text-xs">Estado</Label>
                    <Select value={editableTicketData.estado} onValueChange={(value) => handleTicketInputChange('estado', value)}>
                      <SelectTrigger id="estadoEdit" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Abierto">ABIERTO</SelectItem>
                        <SelectItem value="En Progreso">EN PROGRESO</SelectItem>
                        <SelectItem value="Cerrado">CERRADO</SelectItem>
                        <SelectItem value="Pendiente">PENDIENTE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 p-1 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setIsEditingTicket(false);
                    if (selectedTicket) {
                       setEditableTicketData({ tecnico: selectedTicket.tecnico, prioridad: selectedTicket.prioridad, contacto: selectedTicket.contacto, estado: selectedTicket.estado });
                    }
                  }}>Cancelar</Button>
                  <Button size="sm" onClick={handleSaveTicketChanges}>Guardar Cambios</Button>
                </CardFooter>
              </Card>
            )}

            {/* Secciones que se muestran cuando NO se está editando el ticket */}
            {!isEditingTicket && (
              <>
                {/* Sección de Acciones del Ticket (Nueva) */}
                <div className="py-2 my-2 border-y flex-shrink-0">
                  <span className="text-sm font-semibold mb-2 block">Acciones del Ticket</span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Aquí irían los botones como "Cambiar Estado", "Cerrar Ticket", etc. */}
                    <Button variant="outline" size="sm" disabled>Cambiar Estado</Button>
                    <Button variant="destructive" size="sm" disabled>Cerrar Ticket</Button>
                  </div>
                </div>

                {/* Título Bitácora */}
                <div className="mb-2 mt-1 flex-shrink-0"> 
                  <span className="text-sm font-semibold">Bitácora de acciones</span>
                </div>
                
                {/* Contenedor de la Bitácora de Acciones */}
                {/* AJUSTE: Altura máxima definida para la bitácora. El scroll se activará si el contenido excede. */}
                <div className="overflow-y-auto space-y-2 mb-3 flex-shrink-0" style={{maxHeight: '200px'}}> 
                  {actionsForSelectedTicket.length > 0 ? actionsForSelectedTicket.map((act) => (
                    <div key={act.id} className="text-xs border-b pb-1 flex items-start justify-between">
                      {editingActionId === act.id ? (
                        <Textarea value={editedActionDescription} onChange={(e) => setEditedActionDescription(e.target.value)} className="flex-grow mr-2" rows={2} />
                      ) : (
                        <span className="font-medium flex-grow mr-2 break-all">{act.fecha}: {act.descripcion}</span>
                      )}
                      <div className="flex-shrink-0 flex flex-col gap-1"> 
                        {editingActionId === act.id ? (
                          <>
                            <Button variant="default" size="sm" onClick={() => handleEditAction(act.id, editedActionDescription)}>Guardar</Button>
                            <Button variant="ghost" size="sm" onClick={() => { setEditingActionId(null); setEditedActionDescription(''); }}>Cancelar</Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => { setEditingActionId(act.id); setEditedActionDescription(act.descripcion); }}>Editar</Button>
                        )}
                      </div>
                    </div>
                  )) : <p className="text-xs text-muted-foreground">No hay acciones registradas.</p>}
                </div>

                {/* Contenedor para Agregar Nueva Acción */}
                <div className="pt-2 border-t flex-shrink-0"> 
                  <div className="mb-2 flex-shrink-0"> 
                    <span className="text-sm font-semibold">Agregar nueva acción</span>
                  </div>
                  <Textarea
                    className="mt-1 w-full" 
                    value={newActionDescription}
                    onChange={(e) => setNewActionDescription(e.target.value)}
                    placeholder="Describe la acción realizada..."
                    rows={3} 
                  />
                  <Button className="mt-2 w-full flex-shrink-0" onClick={handleAddAction}>
                    Guardar acción
                  </Button>
                </div>
              </>
            )}
            
            {/* Div para ocupar espacio si el contenido es corto */}
            <div className="flex-grow"></div>

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
