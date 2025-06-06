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
import { createNewTicketAction } =%gt; "@/app/actions/ticketActions"; 
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

type ModalInternalState = 'form' | 'loading' | 'success' | 'error'; // Added 'error' state for explicit visual handling

// Duraciones de las fases de animación en milisegundos (puedes ajustar estos valores)
const LOADING_PHASE_DURATION_MS = 3000; // Duración del spinner
const SUCCESS_MESSAGE_DISPLAY_DURATION_MS = 2000; // Duración que el mensaje de éxito se mantiene visible
// La duración total es la suma de las fases.
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
  const [displayMessage, setDisplayMessage] = useState<string>(''); // Usar displayMessage para mensajes de éxito/error

  const submissionStartTimeRef = useRef<number | null>(null);
  const isSubmitting = useRef(false); 
  const serverActionResponseRef = useRef<ActionState | null>(null); // Nuevo: Almacena la respuesta del servidor

  // Efecto: Captura la respuesta del servidor y la almacena
  React.useEffect(() => {
    if (formState && (formState.success || formState.error)) {
      serverActionResponseRef.current = formState; // Almacena la respuesta final
      isSubmitting.current = false; // La sumisión ya no está en curso
      console.log('TicketFormInModal: Server action completed. Response stored:', formState);
    } else {
      // Si formState no es final (e.g., inicial, o mientras está pendiente)
      // Asegurar que serverActionResponseRef.current esté limpio si no hay acción en curso
      if (!isSubmitting.current && !formState) { // Considera el caso inicial o después de un reset completo
        serverActionResponseRef.current = null;
      }
    }
  }, [formState]); 

  // Función para manejar el envío del formulario (captura el inicio del envío)
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); 
    if (isSubmitting.current) return; 

    isSubmitting.current = true; 
    serverActionResponseRef.current = null; // Limpiar respuesta anterior
    submissionStartTimeRef.current = Date.now(); 
    setModalInternalState('loading'); 
    
    formAction(new FormData(event.currentTarget));
    console.log('TicketFormInModal: Form Submitted. State -> Loading.');
  };

  // Efecto para la duración de la fase de 'loading' (spinner) y la transición a 'success' o 'error' visual
  React.useEffect(() => {
    let loadingPhaseTimer: NodeJS.Timeout | undefined;
    if (modalInternalState === 'loading' && submissionStartTimeRef.current !== null) {
      const elapsedTime = Date.now() - submissionStartTimeRef.current;

      if (elapsedTime < LOADING_PHASE_DURATION_MS) {
        loadingPhaseTimer = setTimeout(() => {
          // Después de LOADING_PHASE_DURATION_MS, verifica la respuesta del servidor
          if (serverActionResponseRef.current) {
            if (serverActionResponseRef.current.success) {
              setModalInternalState('success');
              setDisplayMessage(serverActionResponseRef.current.message || 'Ticket creado con éxito.');
              console.log('TicketFormInModal: Loading phase timer finished. Transitioning to SUCCESS visual.');
            } else if (serverActionResponseRef.current.error) {
              setModalInternalState('error'); // Transiciona a estado de error
              setDisplayMessage(serverActionResponseRef.current.error || 'Error desconocido.');
              console.log('TicketFormInModal: Loading phase timer finished, server error detected. Transitioning to ERROR visual.');
            }
          } else {
            // Si el tiempo de carga mínimo pasó pero el servidor no ha respondido,
            // el modalInternalState permanece 'loading' y el spinner sigue girando.
            console.log('TicketFormInModal: Loading phase timer finished, server response still pending. Remaining in LOADING state.');
          }
        }, LOADING_PHASE_DURATION_MS - elapsedTime);
      } else {
        // Si al entrar al useEffect ya pasaron los LOADING_PHASE_DURATION_MS:
        if (serverActionResponseRef.current) {
          if (serverActionResponseRef.current.success) {
            setModalInternalState('success');
            setDisplayMessage(serverActionResponseRef.current.message || 'Ticket creado con éxito.');
            console.log('TicketFormInModal: Already past loading time, server response SUCCESS. Transitioning to SUCCESS visual immediately.');
          } else if (serverActionResponseRef.current.error) {
            setModalInternalState('error');
            setDisplayMessage(serverActionResponseRef.current.error || 'Error desconocido.');
            console.log('TicketFormInModal: Already past loading time, server response ERROR. Transitioning to ERROR visual immediately.');
          }
        }
        // Si no hay respuesta del servidor, el modalInternalState se queda en 'loading'.
      }
    }
    return () => {
      if (loadingPhaseTimer) clearTimeout(loadingPhaseTimer);
    };
  }, [modalInternalState, formState]); // Dependencia de formState para reaccionar a cambios en la respuesta del servidor

  // Efecto para la duración de la fase de 'success' o 'error' visual
  // y para la señal final al padre (`onCompletion` si fue éxito).
  React.useEffect(() => {
    let finalPhaseTimer: NodeJS.Timeout | undefined;
    if ((modalInternalState === 'success' || modalInternalState === 'error') && submissionStartTimeRef.current !== null) {
      const elapsedTime = Date.now() - submissionStartTimeRef.current;
      const totalAnimationTimeForVisual = LOADING_PHASE_DURATION_MS + SUCCESS_MESSAGE_DISPLAY_DURATION_MS;
      const remainingTimeForTotal = totalAnimationTimeForVisual - elapsedTime;

      finalPhaseTimer = setTimeout(() => {
        // Si fue un éxito, llamamos a onCompletion
        if (modalInternalState === 'success' && serverActionResponseRef.current?.success) {
          onCompletion(serverActionResponseRef.current.ticket); // Emite el ticket creado
          console.log('TicketFormInModal: Animation completed. Calling onCompletion for success.');
        } else {
          // Si fue un error o una finalización sin éxito, solo reseteamos sin llamar onCompletion
          console.log('TicketFormInModal: Animation completed for error/non-success. No onCompletion call.');
        }
        
        // Resetear el estado interno del modal y el formulario
        formRef.current?.reset(); 
        setModalInternalState('form'); 
        setDisplayMessage('');
        submissionStartTimeRef.current = null;
        isSubmitting.current = false; 
        serverActionResponseRef.current = null; // Limpiar la respuesta almacenada
        
      }, Math.max(0, remainingTimeForTotal)); 
    }
    return () => {
      if (finalPhaseTimer) clearTimeout(finalPhaseTimer);
    };
  }, [modalInternalState, onCompletion, formState.ticket]); // Dependencia de formState.ticket para asegurar que el ticket sea el correcto

  // Efecto para restablecer el estado del modal cuando se abre o cierra (controlado por el padre)
  React.useEffect(() => {
    if (isModalOpen) {
      setModalInternalState('form');
      setDisplayMessage('');
      submissionStartTimeRef.current = null;
      isSubmitting.current = false; 
      serverActionResponseRef.current = null; // Reinicia la referencia de respuesta
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
    (modalInternalState === 'success' || modalInternalState === 'error' ? 'w-full max-w-sm' : 'w-full max-w-2xl'); 
  const modalHeight = 
    modalInternalState === 'loading' ? 'h-40' : 
    (modalInternalState === 'success' || modalInternalState === 'error' ? 'h-fit' : 'max-h-[90vh]'); 

  const cardClasses = `
    transition-all duration-300 ease-in-out 
    ${modalWidth} ${modalHeight}
    ${modalInternalState === 'loading' || modalInternalState === 'success' || modalInternalState === 'error' ? 'flex items-center justify-center p-4' : 'flex flex-col'}
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

                        {formState?.error && ( // Muestra el error si formState tiene uno (del submit anterior)
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
                <p className="text-muted-foreground text-sm max-w-sm">{displayMessage}</p> {/* Usa displayMessage aquí */}
            </div>
        )}

        {/* Nuevo: Contenido para el estado de error (si quieres una vista diferente a volver al formulario) */}
        {modalInternalState === 'error' && (
            <div className="flex flex-col items-center justify-center text-center p-6 min-h-full">
                <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
                <h3 className="text-xl font-semibold mb-2">Error al Crear Ticket</h3>
                <p className="text-muted-foreground text-sm max-w-sm">{displayMessage}</p> {/* Usa displayMessage aquí */}
                <Button onClick={() => setModalInternalState('form')} className="mt-4">Reintentar</Button>
            </div>
        )}
    </Card>
  );
}
