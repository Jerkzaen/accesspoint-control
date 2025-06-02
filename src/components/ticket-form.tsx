// src/components/ticket-form.tsx
'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
// import { redirect } from 'next/navigation'; // No se usa directamente aquí
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// IMPORTAR LA SERVER ACTION DESDE SU ARCHIVO
// Ruta actualizada asumiendo que ticketActions.ts está en src/app/actions/
import { createNewTicketAction } from '@/app/actions/ticketActions'; 

// Tipo para el estado que devuelve la Server Action createNewTicketAction
interface FormState {
  error?: string;
  success?: boolean;
  message?: string;
  ticketId?: string;
}

// Estado inicial para useFormState. Debe coincidir con la estructura de FormState.
const initialState: FormState = {
  error: undefined,
  success: undefined,
  message: undefined,
  ticketId: undefined,
};

interface TicketFormProps {
  nextNroCaso: number;
}

export function TicketForm({ nextNroCaso }: TicketFormProps) {
  const [formState, formAction] = useFormState(createNewTicketAction, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (formState?.success) {
      formRef.current?.reset();
      // Podrías mostrar formState.message aquí si lo deseas
      // Ejemplo: alert(formState.message || "Ticket creado exitosamente!");
    } else if (formState?.error) {
      // Ejemplo: alert(`Error: ${formState.error}`);
    }
  }, [formState]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Crear Nuevo Ticket</CardTitle>
        <CardDescription>Ingresa la información detallada del problema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-6">
          <input type="hidden" name="nroCaso" value={nextNroCaso} />

          {formState?.error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800 flex items-center gap-2" role="alert">
              <AlertCircle className="h-5 w-5"/>
              <span className="font-medium">Error:</span> {formState.error}
            </div>
          )}
          {formState?.success && (
            <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800 flex items-center gap-2" role="alert">
              <CheckCircle2 className="h-5 w-5"/>
              <span className="font-medium">Éxito:</span> {formState.message || "Ticket creado correctamente."}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nroCasoDisplay">N° de Caso</Label>
              <Input id="nroCasoDisplay" value={nextNroCaso} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="createdAt">Fecha Reporte</Label>
              <Input type="date" name="createdAt" id="createdAt" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresa">Empresa</Label>
              <Select name="empresa" required>
                <SelectTrigger id="empresa"><SelectValue placeholder="Seleccione Empresa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Achs">ACHS</SelectItem>
                  <SelectItem value="Esachs">ESACHS</SelectItem>
                  <SelectItem value="CMT">CMT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo de Incidente</Label>
              <Select name="tipo" required>
                <SelectTrigger id="tipo"><SelectValue placeholder="Seleccione Tipo" /></SelectTrigger>
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
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select name="prioridad" defaultValue="media" required>
                <SelectTrigger id="prioridad"><SelectValue placeholder="Prioridad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">BAJA</SelectItem>
                  <SelectItem value="media">MEDIA</SelectItem>
                  <SelectItem value="alta">ALTA</SelectItem>
                  <SelectItem value="urgente">URGENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tecnico">Técnico Asignado</Label>
              <Select name="tecnico" required>
                <SelectTrigger id="tecnico"><SelectValue placeholder="Seleccione Técnico" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Miguel Chervellino">M.Chervellino</SelectItem>
                  <SelectItem value="Christian Torrenss">C. Torrens</SelectItem>
                  <SelectItem value="jerson Armijo">J. Armijo</SelectItem>
                  <SelectItem value="No Asignado">No Asignado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ubicacion">Ubicación (Ej: Oficina, Piso, Ciudad)</Label>
              <Input name="ubicacion" id="ubicacion" placeholder="Detalle de la ubicación" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contacto">Contacto Solicitante (Nombre/Email)</Label>
              <Input name="contacto" id="contacto" placeholder="Persona que reporta" required />
            </div>
            
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="tituloDelTicket">Título del Ticket (Resumen Breve)</Label>
              <Input name="tituloDelTicket" id="tituloDelTicket" placeholder="Ej: Impresora no enciende en Contabilidad" required />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="detalleAdicional">Descripción Detallada del Problema</Label>
              <Textarea name="detalleAdicional" id="detalleAdicional" placeholder="Proporciona todos los detalles relevantes..." rows={5} />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="accionInicial">Acción Inicial Realizada (Si aplica)</Label>
              <Textarea name="accionInicial" id="accionInicial" placeholder="Si ya realizaste alguna acción..." rows={3} />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="fechaSolucion">Fecha Estimada/Solución (Opcional)</Label>
              <Input type="date" name="fechaSolucion" id="fechaSolucion" />
            </div>
          </div>
          <CardFooter className="px-0 pt-8 flex justify-end gap-3">
            <Button variant="outline" type="reset" onClick={() => formRef.current?.reset()}>Limpiar Campos</Button>
            <FormSubmitButton>Guardar Ticket</FormSubmitButton>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
