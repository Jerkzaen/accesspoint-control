    // src/components/ticket-form.tsx
    'use client';

    import * as React from 'react';
    import { useFormState } from 'react-dom';
    import { redirect } from 'next/navigation'; // Se usará desde la Server Action
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
    import { FormSubmitButton } from '@/components/ui/FormSubmitButton'; // Importar el nuevo botón
    import { prisma } from '@/lib/prisma'; // Prisma se usa en la Server Action
    import { v4 as uuidv4 } from 'uuid';
    import { ActionEntry, Ticket as GlobalTicket } from '@/types/ticket';
    import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

    // Interfaz para los datos del formulario
    interface TicketFormFields {
      nroCaso: number; // Este vendrá como prop, pero se incluirá en el FormData
      empresa: string;
      ubicacion: string;
      contacto: string;
      prioridad: string;
      tecnico: string;
      tipo: string;
      tituloDelTicket: string;
      detalleAdicional?: string;
      accionInicial?: string;
      fechaSolucion?: string | null;
      createdAt: string;
    }

    // Tipo para el estado que devuelve la Server Action
    interface FormState {
      message: string;
      type: 'success' | 'error' | 'idle';
      errors?: Record<string, string[] | undefined>; // Para errores de validación por campo
      ticketId?: string; // Para redirigir o mostrar info del ticket creado
    }

    const initialState: FormState = {
      message: '',
      type: 'idle',
    };

    // --- SERVER ACTION ---
    // Esta acción ahora vive fuera del componente, pero en el mismo archivo para simplicidad.
    // Podría moverse a un archivo separado de "actions".
    async function createNewTicketAction(prevState: FormState, formdata: FormData): Promise<FormState> {
      // 'use server'; // No es necesario aquí si la acción se define y exporta desde un Client Component
      // pero si se mueve a su propio archivo .ts, sí se necesitaría el 'use server'; al inicio del archivo.

      const data: TicketFormFields = {
        nroCaso: parseInt(formdata.get('nroCaso') as string), // nroCaso ahora es un input hidden
        empresa: formdata.get('empresa') as string,
        prioridad: formdata.get('prioridad') as string,
        tecnico: formdata.get('tecnico') as string,
        tipo: formdata.get('tipo') as string,
        tituloDelTicket: formdata.get('tituloDelTicket') as string,
        detalleAdicional: formdata.get('detalleAdicional') as string | undefined,
        ubicacion: formdata.get('ubicacion') as string,
        contacto: formdata.get('contacto') as string,
        createdAt: formdata.get('createdAt') as string,
        accionInicial: formdata.get('accionInicial') as string | undefined,
        fechaSolucion: formdata.get('fechaSolucion') as string || null,
      };

      // Validación simple (puedes expandirla o usar una librería como Zod)
      if (!data.empresa || !data.prioridad || !data.tecnico || !data.tipo || !data.tituloDelTicket || !data.ubicacion || !data.contacto || !data.createdAt) {
        return {
          message: 'Faltan campos obligatorios.',
          type: 'error',
          // Podrías añadir errores específicos por campo aquí
        };
      }

      const accionesArray: ActionEntry[] = [];
      let descripcionPrincipalTicket = data.tituloDelTicket;
      let primeraAccionDesc = "";

      if (data.detalleAdicional?.trim()) {
        primeraAccionDesc += `Detalle del problema: ${data.detalleAdicional.trim()}`;
      }
      if (data.accionInicial?.trim()) {
        if (primeraAccionDesc) primeraAccionDesc += "\n";
        primeraAccionDesc += `Acción inicial realizada: ${data.accionInicial.trim()}`;
      }
      
      if (primeraAccionDesc.trim()) {
        accionesArray.push({
          id: uuidv4(),
          fecha: new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
          descripcion: primeraAccionDesc.trim(),
        });
      }

      const accionesParaGuardar = JSON.stringify(accionesArray);
      const createdAtDate = new Date(data.createdAt + "T00:00:00");
      const fechaSolucionDate = data.fechaSolucion ? new Date(data.fechaSolucion + "T00:00:00") : null;

      const ticketDataToSave = {
        nroCaso: data.nroCaso,
        empresa: data.empresa,
        prioridad: data.prioridad,
        tecnico: data.tecnico,
        tipo: data.tipo,
        descripcion: descripcionPrincipalTicket,
        ubicacion: data.ubicacion,
        contacto: data.contacto,
        acciones: accionesParaGuardar,
        createdAt: createdAtDate,
        fechaSolucion: fechaSolucionDate,
        estado: "Abierto",
      };

      try {
        const newTicket = await prisma.ticket.create({ data: ticketDataToSave });
        // console.log("Ticket creado con datos:", newTicket);
        // La redirección se manejará en el cliente si es necesario, o se puede hacer aquí.
        // Para una mejor UX con useFormState, es mejor no redirigir directamente desde la Server Action
        // a menos que sea un requisito absoluto. En su lugar, devuelve un estado de éxito.
        return {
          message: `Ticket #${newTicket.nroCaso} creado exitosamente.`,
          type: 'success',
          ticketId: newTicket.id,
        };
      } catch (error: any) {
        console.error("Error al crear ticket en Prisma:", error.message);
        return {
          message: `Error al crear el ticket: ${error.message}`,
          type: 'error',
        };
      }
    }
    // --- FIN SERVER ACTION ---


    // Definición de Props para TicketForm
    interface TicketFormProps {
      nextNroCaso: number;
    }

    export function TicketForm({ nextNroCaso }: TicketFormProps) {
      const [formState, formAction] = useFormState(createNewTicketAction, initialState);
      const formRef = React.useRef<HTMLFormElement>(null);

      React.useEffect(() => {
        if (formState.type === 'success' && formState.ticketId) {
          // Opcional: resetear el formulario después de un envío exitoso
          formRef.current?.reset(); 
          // Mostrar mensaje de éxito o redirigir
          // alert(formState.message); // Podrías usar un toast o un componente de mensaje más elegante
          // Si quieres redirigir después de mostrar el mensaje, podrías hacerlo aquí:
          // setTimeout(() => {
          //   redirect('/tickets/dashboard'); // O a la página del ticket recién creado
          // }, 2000); // Pequeño delay para que el usuario vea el mensaje
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
              {/* Input oculto para nroCaso */}
              <input type="hidden" name="nroCaso" value={nextNroCaso} />

              {/* Mostrar mensajes de estado del formulario */}
              {formState.type === 'error' && (
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800 flex items-center gap-2" role="alert">
                  <AlertCircle className="h-5 w-5"/>
                  <span className="font-medium">Error:</span> {formState.message}
                </div>
              )}
              {formState.type === 'success' && (
                <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800 flex items-center gap-2" role="alert">
                  <CheckCircle2 className="h-5 w-5"/>
                  <span className="font-medium">Éxito:</span> {formState.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nroCasoDisplay">N° de Caso</Label>
                  {/* Se muestra pero no se envía directamente, el valor se toma del input hidden */}
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
    