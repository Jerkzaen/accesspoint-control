// src/components/TicketFormInModal.tsx
'use client';

import * as React from "react";
import { useRef, useEffect, useState } from "react"; 
import { useFormState } from "react-dom"; 
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createNewTicketAction } from "@/app/actions/ticketActions"; 
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"; // Added CheckCircle icon
import { FormSubmitButton } from "@/components/ui/FormSubmitButton"; 
import { Ticket } from '@/types/ticket'; 

// Definir tipos para las props que vienen de la base de datos
interface EmpresaClienteOption {
  id: string;
  nombre: string;
}

interface UbicacionOption {
  id: string;
  nombreReferencial: string | null; 
  direccionCompleta: string;      
}

interface TicketFormInModalProps {
  nextNroCaso: number;
  onFormSubmitSuccess: (newTicket?: Ticket) => void; 
  onCancel: () => void;
  empresasClientes: EmpresaClienteOption[];    
  ubicacionesDisponibles: UbicacionOption[]; 
  // Prop para indicar si el modal padre está completamente abierto (para animaciones iniciales)
  isModalOpen?: boolean; 
}

interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
  ticketId?: string;
  ticket?: Ticket; 
}

const initialState: ActionState = {
  error: undefined,
  success: undefined,
  message: undefined,
  ticketId: undefined,
  ticket: undefined,
};

// Internal states for the modal's animation flow
type ModalInternalState = 'form' | 'loading' | 'success';

export function TicketFormInModal({ 
  nextNroCaso, 
  onFormSubmitSuccess, 
  onCancel,
  empresasClientes,      
  ubicacionesDisponibles,
  isModalOpen, // Receive isModalOpen prop
}: TicketFormInModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formState, formAction] = useFormState(createNewTicketAction, initialState);
  const [modalInternalState, setModalInternalState] = useState<ModalInternalState>('form');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Effect to manage the internal state transitions based on formState
  React.useEffect(() => {
    if (formState.pending) {
      setModalInternalState('loading');
    } else if (formState.success) {
      setSuccessMessage(formState.message || 'Ticket creado con éxito.');
      setModalInternalState('success');
      // No need to call onFormSubmitSuccess here immediately, it will be handled by TicketCard
      // which observes the new ticket ID being set after refresh.
      // This allows the success message to be seen before the modal closes.
      
    } else if (formState.error) {
      setSuccessMessage(''); // Clear previous success message if any
      setModalInternalState('form'); // Revert to form state on error
    }
  }, [formState]);


  // Effect to trigger the final callback and reset after success state
  // This helps coordinate with the parent TicketCard to close the modal
  // and handle the ticket highlight animation.
  React.useEffect(() => {
    if (modalInternalState === 'success') {
      const delayBeforeClosing = 2000; // Duration for success message display + buffer
      const timer = setTimeout(() => {
        onFormSubmitSuccess(formState.ticket); // Trigger parent callback with new ticket
        // Reset form and internal state for next potential open
        formRef.current?.reset();
        setModalInternalState('form');
        setSuccessMessage('');
      }, delayBeforeClosing);

      return () => clearTimeout(timer);
    }
  }, [modalInternalState, onFormSubmitSuccess, formState.ticket]);


  // Function to get the current local date and time string in YYYY-MM-DDTHH:MM format
  const getLocalDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Determine dynamic width/height for modal transitions
  const modalWidth = modalInternalState === 'loading' ? 'w-40' : 'w-full'; // Shrink to 40 for loading
  const modalHeight = modalInternalState === 'loading' ? 'h-40' : 'max-h-[90vh]'; // Shrink to 40 for loading, expand for form/success

  const cardClasses = `
    transition-all duration-300 ease-in-out 
    ${modalWidth} ${modalHeight}
    ${modalInternalState === 'loading' ? 'flex items-center justify-center p-4' : 'flex flex-col'}
  `;

  return (
    <Card className={`overflow-hidden shadow-none border-none ${cardClasses}`}>
        {modalInternalState === 'form' && (
            <>
                <CardHeader className="flex-shrink-0">
                    <CardTitle>Crear Nuevo Ticket</CardTitle>
                    <CardDescription>Ingresa la información detallada del problema.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto p-4 sm:p-6">
                    <form ref={formRef} action={formAction} className="space-y-6">
                        <input type="hidden" name="nroCaso" value={nextNroCaso} />

                        {formState?.error && (
                            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800 flex items-center gap-2" role="alert">
                                <AlertCircle className="h-5 w-5" />
                                <span className="font-medium">Error:</span> {formState.error}
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="nroCasoModalDisplay">N° de Caso</Label>
                                <Input id="nroCasoModalDisplay" value={nextNroCaso} readOnly className="bg-muted dark:bg-gray-700"/>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="fechaCreacionModal">Fecha Reporte</Label>
                                <Input type="datetime-local" name="fechaCreacion" id="fechaCreacionModal" defaultValue={getLocalDateTimeString()} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="empresaClienteModal">Empresa Cliente</Label>
                                <Select name="empresaClienteId" > 
                                    <SelectTrigger id="empresaClienteModal"><SelectValue placeholder="Seleccione Empresa Cliente" /></SelectTrigger>
                                    <SelectContent>
                                        {empresasClientes && empresasClientes.length > 0 ? (
                                            empresasClientes.map(empresa => (
                                                <SelectItem key={empresa.id} value={empresa.id}>
                                                    {empresa.nombre}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-empresas" disabled>No hay empresas para seleccionar</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="tipoIncidenteModal">Tipo de Incidente</Label>
                                <Select name="tipoIncidente" required defaultValue="Software"> 
                                    <SelectTrigger id="tipoIncidenteModal"><SelectValue placeholder="Seleccione Tipo" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Software">Software</SelectItem>
                                        <SelectItem value="Hardware">Hardware</SelectItem>
                                        <SelectItem value="Aplicaciones">Aplicaciones</SelectItem>
                                        <SelectItem value="Red">Red</SelectItem>
                                        <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="prioridadModal">Prioridad</Label>
                                <Select name="prioridad" defaultValue="MEDIA" required>
                                    <SelectTrigger id="prioridadModal"><SelectValue placeholder="Prioridad" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BAJA">BAJA</SelectItem>
                                        <SelectItem value="MEDIA">MEDIA</SelectItem>
                                        <SelectItem value="ALTA">ALTA</SelectItem>
                                        <SelectItem value="URGENTE">URGENTE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="md:col-span-2 space-y-1.5">
                                <Label htmlFor="ubicacionIdModal">Ubicación</Label>
                                <Select name="ubicacionId" > 
                                    <SelectTrigger id="ubicacionIdModal"><SelectValue placeholder="Seleccione Ubicación (Opcional)" /></SelectTrigger>
                                    <SelectContent>
                                        {ubicacionesDisponibles && ubicacionesDisponibles.length > 0 ? (
                                            ubicacionesDisponibles.map(ubicacion => (
                                                <SelectItem key={ubicacion.id} value={ubicacion.id}>
                                                    {ubicacion.nombreReferencial || ubicacion.direccionCompleta}
                                                </SelectItem>
                                            ))
                                        ) : (
                                             <SelectItem value="no-ubicaciones" disabled>No hay ubicaciones para seleccionar</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 mt-3 border-t pt-3">Información del Solicitante:</div>

                            <div className="space-y-1.5">
                                <Label htmlFor="solicitanteNombreModal">Nombre Solicitante</Label>
                                <Input name="solicitanteNombre" id="solicitanteNombreModal" placeholder="Nombre completo de quien reporta" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="solicitanteTelefonoModal">Teléfono Solicitante (Opcional)</Label>
                                <Input type="tel" name="solicitanteTelefono" id="solicitanteTelefonoModal" placeholder="Ej: +56912345678" />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label htmlFor="solicitanteCorreoModal">Correo Solicitante (Opcional)</Label>
                                <Input type="email" name="solicitanteCorreo" id="solicitanteCorreoModal" placeholder="Ej: contacto@empresa.com" />
                            </div>
                            
                            <div className="md:col-span-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 mt-3 border-t pt-3">Detalles del Ticket:</div>

                            <div className="md:col-span-2 space-y-1.5">
                                <Label htmlFor="tituloModal">Título del Ticket</Label>
                                <Input name="titulo" id="tituloModal" placeholder="Ej: Impresora no enciende en Contabilidad" required />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label htmlFor="descripcionDetalladaModal">Descripción Detallada</Label>
                                <Textarea name="descripcionDetallada" id="descripcionDetalladaModal" placeholder="Proporciona todos los detalles relevantes..." rows={4}/>
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label htmlFor="accionInicialModal">Acción Inicial Realizada (Si aplica)</Label>
                                <Textarea name="accionInicial" id="accionInicialModal" placeholder="Si ya realizaste alguna acción..." rows={3}/>
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label htmlFor="fechaSolucionEstimadaModal">Fecha Estimada Solución (Opcional)</Label> 
                                <Input type="date" name="fechaSolucionEstimada" id="fechaSolucionEstimadaModal" />
                            </div>
                        </div>
                        
                        <CardFooter className="px-0 pt-6 flex justify-end gap-3 flex-shrink-0">
                            <Button variant="outline" type="button" onClick={onCancel} disabled={formState.pending}>Cancelar</Button>
                            <FormSubmitButton>Guardar Ticket</FormSubmitButton>
                        </CardFooter>
                    </form>
                </CardContent>
            </>
        )}

        {modalInternalState === 'loading' && (
            <div className="flex flex-col items-center justify-center text-primary-foreground min-h-full">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Creando ticket...</p>
            </div>
        )}

        {modalInternalState === 'success' && (
            <div className="flex flex-col items-center justify-center text-center p-6 min-h-full">
                <CheckCircle className="h-16 w-16 text-green-500 mb-6 animate-bounce" />
                <h3 className="text-xl font-semibold mb-2">¡Ticket Creado con Éxito!</h3>
                <p className="text-muted-foreground text-sm max-w-sm">{successMessage}</p>
            </div>
        )}
    </Card>
  );
}
