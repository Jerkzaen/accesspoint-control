// src/components/TicketFormInModal.tsx
"use client";

import * as React from "react";
import { useRef, useEffect } from "react"; 
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
import { AlertCircle, Loader2 } from "lucide-react"; 
import { FormSubmitButton } from "@/components/ui/FormSubmitButton"; 

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
  onFormSubmitSuccess: () => void;
  onCancel: () => void;
  empresasClientes: EmpresaClienteOption[];    
  ubicacionesDisponibles: UbicacionOption[]; 
}

interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
  ticketId?: string;
}

const initialState: ActionState = {
  error: undefined,
  success: undefined,
  message: undefined,
  ticketId: undefined,
};

export function TicketFormInModal({ 
  nextNroCaso, 
  onFormSubmitSuccess, 
  onCancel,
  empresasClientes,      
  ubicacionesDisponibles 
}: TicketFormInModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formState, formAction] = useFormState(createNewTicketAction, initialState);

  useEffect(() => {
    if (formState?.success) {
      onFormSubmitSuccess(); 
    }
  }, [formState, onFormSubmitSuccess]);

  return (
    <Card className="overflow-hidden shadow-none border-none">
      <CardHeader>
        <CardTitle>Crear Nuevo Ticket</CardTitle>
        <CardDescription>Ingresa la información detallada del problema.</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
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
              <Input type="date" name="fechaCreacion" id="fechaCreacionModal" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresaClienteModal">Empresa Cliente</Label>
              <Select name="empresaClienteId" /* Podrías hacerlo 'required' si es mandatorio */ > 
                <SelectTrigger id="empresaClienteModal"><SelectValue placeholder="Seleccione Empresa Cliente" /></SelectTrigger>
                <SelectContent>
                  {/* Opción para no seleccionar, si el campo es opcional */}
                  {/* <SelectItem value="ID_NULO_O_VACIO_PERO_NO_CADENA_VACIA" disabled>Ninguna</SelectItem>  // Ejemplo, pero mejor manejarlo con campo no requerido */}
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
              <Select name="ubicacionId" /* No es 'required' para permitir no seleccionar */ > 
                <SelectTrigger id="ubicacionIdModal"><SelectValue placeholder="Seleccione Ubicación (Opcional)" /></SelectTrigger>
                <SelectContent>
                  {/* Ya no se incluye el <SelectItem value="">...</em></SelectItem> problemático */}
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
          
          <CardFooter className="px-0 pt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onCancel} >Cancelar</Button>
            <FormSubmitButton>Guardar Ticket</FormSubmitButton>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

