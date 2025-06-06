// src/components/TicketFormInModal.tsx
'use client';

import * as React from "react";
import { useRef, useEffect, useState } from "react"; 
import { useFormState, useFormStatus } from "react-dom";
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
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"; 
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
  onCompletion: (newTicket?: Ticket) => void; 
  onCancel: () => void;
  empresasClientes: EmpresaClienteOption[];    
  ubicacionesDisponibles: UbicacionOption[]; 
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

type ModalInternalState = 'form' | 'loading' | 'success';

// Duraciones de las fases de animación en milisegundos (puedes ajustar estos valores)
const LOADING_PHASE_DURATION_MS = 3000; // Duración del spinner
const SUCCESS_MESSAGE_DISPLAY_DURATION_MS = 2000; // Duración que el mensaje de éxito se mantiene visible
// La duración total debe ser al menos la suma de las dos fases anteriores
const TOTAL_ANIMATION_DURATION_MS = LOADING_PHASE_DURATION_MS + SUCCESS_MESSAGE_DISPLAY_DURATION_MS; 

export function TicketFormInModal({ 
  nextNroCaso, 
  onCompletion, 
  onCancel,
  empresasClientes,      
  ubicacionesDisponibles,
  isModalOpen, 
}: TicketFormInModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formState, formAction] = useFormState(createNewTicketAction, initialState);
  const [modalInternalState, setModalInternalState] = useState<ModalInternalState>('form');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const submissionStartTimeRef = useRef<number | null>(null);
  const isSubmitting = useRef(false); 

  // Efecto principal para gestionar las transiciones de estado interno del modal
  React.useEffect(() => {
    if (formState.success) {
      setSuccessMessage(formState.message || 'Ticket creado con éxito.');
      isSubmitting.current = false; 
      setModalInternalState('success'); // Transiciona a estado de éxito para mostrar mensaje y animación
      console.log('TicketFormInModal: Server action SUCCESS. Transitioning to success phase visual.');
    } 
    else if (formState.error) {
      setSuccessMessage(formState.error); 
      setModalInternalState('form'); 
      submissionStartTimeRef.current = null; 
      isSubmitting.current = false; 
      console.log('TicketFormInModal: Server action ERROR. Back to form.');
    } 
    else if (!isSubmitting.current) { 
      setModalInternalState('form'); 
      setSuccessMessage('');
      submissionStartTimeRef.current = null;
      console.log('TicketFormInModal: State -> Form (initial/reset or after action finished)');
    }
  }, [formState]); // onCompletion removed from dependency array, called only at final completion


  // Función para manejar el envío del formulario (captura el inicio del envío)
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); 
    if (isSubmitting.current) return; 

    isSubmitting.current = true; 
    submissionStartTimeRef.current = Date.now(); 
    setModalInternalState('loading'); 
    
    formAction(new FormData(event.currentTarget));
    console.log('TicketFormInModal: Form Submitted. State -> Loading.');
  };


  // Efecto para la duración de la fase de 'loading' (spinner) y la transición a 'success' visual
  React.useEffect(() => {
    let loadingPhaseTimer: NodeJS.Timeout | undefined;
    if (modalInternalState === 'loading' && submissionStartTimeRef.current !== null) {
      const elapsedTime = Date.now() - submissionStartTimeRef.current;

      if (elapsedTime < LOADING_PHASE_DURATION_MS) {
        loadingPhaseTimer = setTimeout(() => {
          // Después de LOADING_PHASE_DURATION_MS, si la acción ya fue exitosa, transiciona a 'success' visual.
          // Si no (todavía pendiente o error no capturado), permanece en 'loading' o vuelve a 'form' si ya no está pendiente.
          if (formState.success) {
            setModalInternalState('success');
            console.log('TicketFormInModal: Loading phase timer finished (3s). Transitioning to SUCCESS visual.');
          } else if (!isSubmitting.current && !formState.error) { 
             // Si el spinner terminó, pero no hay éxito/error y no está enviando, algo salió mal o la acción fue muy rápida.
             setModalInternalState('form'); 
             console.error('TicketFormInModal: Loading phase timer finished, neither success/error nor pending. Back to form.');
          }
        }, LOADING_PHASE_DURATION_MS - elapsedTime);
      } else {
        // Si ya pasaron los LOADING_PHASE_DURATION_MS, transiciona inmediatamente si ya hay éxito.
        if (formState.success) {
          setModalInternalState('success');
          console.log('TicketFormInModal: Already past loading phase time, transitioning to SUCCESS visual immediately.');
        }
      }
    }
    return () => {
      if (loadingPhaseTimer) clearTimeout(loadingPhaseTimer);
    };
  }, [modalInternalState, formState.success, formState.error, isSubmitting.current]); 


  // Efecto para la duración total de la animación (desde el inicio de la sumisión hasta el final)
  // Aquí es donde se llama a `onCompletion` para que el padre cierre el modal.
  React.useEffect(() => {
    let totalAnimationTimer: NodeJS.Timeout | undefined;
    // Solo si estamos en la fase de loading o success y el tiempo de inicio está registrado
    if ((modalInternalState === 'loading' || modalInternalState === 'success') && submissionStartTimeRef.current !== null) {
      const elapsedTime = Date.now() - submissionStartTimeRef.current;
      const remainingTimeForTotal = TOTAL_ANIMATION_DURATION_MS - elapsedTime;

      totalAnimationTimer = setTimeout(() => {
        onCompletion(formState.ticket); // <--- CLAVE: Llama a onCompletion SOLO al final de la duración total
        formRef.current?.reset(); // Limpiar el formulario
        setModalInternalState('form'); // Volver al estado 'form' para la próxima apertura
        setSuccessMessage('');
        submissionStartTimeRef.current = null;
        isSubmitting.current = false; // Resetear la bandera de envío
        console.log('TicketFormInModal: TOTAL animation duration finished. Calling onCompletion and resetting internal state.');
      }, Math.max(0, remainingTimeForTotal)); // Asegura un retardo no negativo

    }
    return () => {
      if (totalAnimationTimer) clearTimeout(totalAnimationTimer);
    };
  }, [modalInternalState, onCompletion, formState.ticket]); // Depende de modalInternalState y formState.ticket (para asegurar que el ticket sea el correcto)


  // Efecto para restablecer el estado del modal cuando se abre o cierra (controlado por el padre)
  // Esto es vital para que el modal se muestre correctamente en su estado inicial cuando se reabre.
  React.useEffect(() => {
    if (isModalOpen) {
      setModalInternalState('form');
      setSuccessMessage('');
      submissionStartTimeRef.current = null;
      isSubmitting.current = false; 
      console.log('TicketFormInModal: Modal opened by parent. Resetting state.');
    }
  }, [isModalOpen]);


  const getLocalDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Determinar ancho/alto dinámico para transiciones del modal
  const modalWidth = 
    modalInternalState === 'loading' ? 'w-40' : 
    (modalInternalState === 'success' ? 'w-full max-w-sm' : 'w-full max-w-2xl'); 
  const modalHeight = 
    modalInternalState === 'loading' ? 'h-40' : 
    (modalInternalState === 'success' ? 'h-fit' : 'max-h-[90vh]'); 

  const cardClasses = `
    transition-all duration-300 ease-in-out 
    ${modalWidth} ${modalHeight}
    ${modalInternalState === 'loading' || modalInternalState === 'success' ? 'flex items-center justify-center p-4' : 'flex flex-col'}
  `;

  return (
    <Card className={`overflow-hidden shadow-none border-none ${cardClasses}`}>
        {/* Renderizado condicional basado en el estado interno del modal */}
        {modalInternalState === 'form' && (
            <>
                <CardHeader className="flex-shrink-0">
                    <CardTitle>Crear Nuevo Ticket</CardTitle>
                    <CardDescription>Ingresa la información detallada del problema.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto p-4 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6"> 
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
                            <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting.current}>Cancelar</Button>
                            <FormSubmitButton>Guardar Ticket</FormSubmitButton>
                        </CardFooter>
                    </form>
                </CardContent>
            </>
        )}

        {/* Contenido para el estado de carga */}
        {modalInternalState === 'loading' && (
            <div className="flex flex-col items-center justify-center text-primary-foreground min-h-full">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Creando ticket...</p>
            </div>
        )}

        {/* Contenido para el estado de éxito */}
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
