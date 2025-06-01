import * as React from "react";
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
    import { redirect } from "next/navigation";
    import { prisma } from "@/lib/prisma";
    import { v4 as uuidv4 } from 'uuid'; // Para generar IDs únicos

    // Usar la interfaz Ticket importada sería ideal, pero si es un Server Component
    // y necesita el tipo Date para Prisma, mantenemos una local o la adaptamos.
    // Por ahora, la ajustamos para que las fechas sean string como en el resto del frontend.
    interface TicketFormData { // Renombrada para evitar confusión con el tipo global Ticket
      id?: string; // Opcional, ya que Prisma lo genera
      nroCaso: number;
      empresa: string;
      ubicacion: string;
      contacto: string;
      prioridad: string;
      tecnico: string;
      tipo: string;
      descripcion: string; // Título del ticket
      acciones: string; // JSON string de ActionEntry[]
      estado?: string; // Prisma le da un default
      fechaSolucion: string | null; // String para el formulario
      createdAt: string; // String para el formulario
    }
    
    // No necesitamos ActionEntry aquí si solo creamos una descripción simple

    async function loadTickets(): Promise<Pick<TicketFormData, 'nroCaso'>[]> { // Solo necesitamos nroCaso
      try {
        const tickets = await prisma.ticket.findMany({
          orderBy: { nroCaso: "desc" },
          select: { nroCaso: true }, // Solo seleccionar nroCaso
        });
        return tickets;
      } catch (error) {
        console.error("Error al cargar nroCaso de tickets con Prisma:", error);
        return [];
      }
    }

    export async function TicketForm() {
      const ticketsNroCaso = await loadTickets();
      const nextNroCaso = ticketsNroCaso.length > 0 && ticketsNroCaso[0] 
                          ? ticketsNroCaso[0].nroCaso + 1 
                          : 1;

      async function newTicket(formdata: FormData) {
        "use server";

        const nroCaso = parseInt(formdata.get("nroCaso")?.toString() || "0");
        const empresa = formdata.get("empresa")?.toString() || "";
        const prioridad = formdata.get("prioridad")?.toString() || "";
        const tecnico = formdata.get("tecnico")?.toString() || "";
        const tipo = formdata.get("tipo")?.toString() || "";
        // El campo 'descripcion' del formulario es el título del ticket
        const tituloDelTicket = formdata.get("titulo")?.toString() || ""; 
        // El campo 'detalle' del formulario es la descripción detallada
        const detalleAdicional = formdata.get("detalle")?.toString() || ""; 
        const ubicacion = formdata.get("ubicacion")?.toString() || "";
        const contacto = formdata.get("contacto")?.toString() || "";
        const createdAtForm = formdata.get("createdAt")?.toString(); 
        // La "acción inicial" del formulario se convierte en la primera entrada de la bitácora
        const accionInicialInput = formdata.get("accionInicial")?.toString() || ""; 
        const fechaSolucionForm = formdata.get("fechaSolucion")?.toString();

        if (
          !nroCaso || !empresa || !prioridad || !tecnico || !tipo ||
          !tituloDelTicket || !ubicacion || !contacto || !createdAtForm
        ) {
          console.error("Faltan campos obligatorios para el ticket.");
          return; 
        }

        const accionesArray = [];
        // Si se ingresó una acción inicial, se añade a la bitácora.
        // También se podría concatenar con el detalleAdicional si se desea.
        let descripcionParaGuardar = tituloDelTicket;
        if (detalleAdicional) {
            // Podrías decidir si el detalle va en el campo 'descripcion' del ticket
            // o si necesitas otro campo en la BD. Por ahora, lo concatenamos o lo ignoramos.
            // Si 'descripcion' es solo el título, entonces detalleAdicional se podría perder
            // o necesitaría su propio campo.
            // Para este ejemplo, asumimos que 'descripcion' en la BD es el título.
        }


        if (accionInicialInput.trim()) {
          accionesArray.push({
            id: uuidv4(), // Generar ID único para la acción
            fecha: new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
            descripcion: accionInicialInput,
          });
        }
        // Si no hay acción inicial pero sí detalle, podrías crear una acción con el detalle:
        else if (detalleAdicional.trim() && accionesArray.length === 0) {
             accionesArray.push({
                id: uuidv4(),
                fecha: new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
                descripcion: `Detalle inicial: ${detalleAdicional}`,
            });
        }


        const accionesParaGuardar = JSON.stringify(accionesArray);
        const createdAtDate = new Date(createdAtForm + "T00:00:00"); // Asegurar que se interprete como inicio del día local
        const fechaSolucionDate = fechaSolucionForm ? new Date(fechaSolucionForm + "T00:00:00") : null;

        const ticketData = {
          nroCaso: nroCaso,
          empresa: empresa,
          prioridad: prioridad,
          tecnico: tecnico,
          tipo: tipo,
          descripcion: tituloDelTicket, // El título va al campo 'descripcion' de la BD
          ubicacion: ubicacion,
          contacto: contacto,
          acciones: accionesParaGuardar, // La acción inicial (si existe) va a la bitácora
          createdAt: createdAtDate.toISOString(),
          fechaSolucion: fechaSolucionDate ? fechaSolucionDate.toISOString() : null,
          estado: "Abierto", // Estado por defecto
          // Si tienes un campo para 'detalleAdicional' en tu BD, añádelo aquí.
        };

        try {
          // El endpoint POST /api/tickets espera que 'acciones' sea un string JSON
          await prisma.ticket.create({ data: ticketData });
          console.log("Ticket creado:", ticketData);
          redirect("/tickets/dashboard");
        } catch (error: any) {
          if (error.digest?.includes('NEXT_REDIRECT')) {
            throw error;
          }
          console.error("Error al crear ticket:", error.message);
        }
      }

      return (
        // El Card ahora es más ancho y centrado, con padding en la página
        <Card className="w-full max-w-2xl mx-auto"> 
          <CardHeader>
            <CardTitle>Crear Nuevo Ticket</CardTitle>
            <CardDescription>Ingresa la información detallada del problema.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={newTicket} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nroCaso">N° de Caso</Label>
                  <Input name="nroCaso" id="nroCaso" defaultValue={nextNroCaso} readOnly />
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
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select name="tipo" required>
                    <SelectTrigger id="tipo"><SelectValue placeholder="Seleccione Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Aplicaciones">Aplicaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select name="prioridad" required>
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input name="ubicacion" id="ubicacion" placeholder="Ej: Oficina 201, Bodega Central" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contacto">Contacto Solicitante</Label>
                  <Input name="contacto" id="contacto" placeholder="Nombre o email del solicitante" required />
                </div>
                
                {/* Campo para el TÍTULO del ticket */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="titulo">Título del Ticket</Label>
                  <Input name="titulo" id="titulo" placeholder="Resumen breve del problema (ej: Impresora no funciona)" required />
                </div>

                {/* Campo para la DESCRIPCIÓN DETALLADA del ticket */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="detalle">Descripción Detallada del Problema</Label>
                  <Textarea name="detalle" id="detalle" placeholder="Proporciona todos los detalles relevantes sobre el incidente, pasos para reproducirlo, mensajes de error, etc." rows={4}/>
                </div>

                {/* Campo para la ACCIÓN INICIAL realizada */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="accionInicial">Acción Inicial Realizada (Opcional)</Label>
                  <Textarea name="accionInicial" id="accionInicial" placeholder="Si ya realizaste alguna acción para intentar solucionar el problema, descríbela aquí." rows={2}/>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fechaSolucion">Fecha Estimada/Solución</Label>
                  <Input type="date" name="fechaSolucion" id="fechaSolucion" />
                </div>
              </div>
              <CardFooter className="px-0 pt-6 flex justify-end gap-2">
                <Button variant="outline" type="reset">Limpiar Campos</Button>
                <Button type="submit">Guardar Ticket</Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      );
    }
    