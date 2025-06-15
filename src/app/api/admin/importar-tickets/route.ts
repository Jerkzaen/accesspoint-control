// src/app/api/admin/importar-tickets/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RoleUsuario, EstadoTicket, PrioridadTicket, Prisma } from "@prisma/client";
import { z, ZodIssue } from "zod";
import { revalidatePath } from 'next/cache';

// Define el tipo de usuario esperado en la sesión para mayor seguridad de tipos.
interface SessionUser {
  id: string;
  rol?: RoleUsuario;
}

// Define el esquema de validación para cada fila que viene del frontend usando Zod.
// Esto asegura que los datos son correctos antes de intentar guardarlos.
const baseCsvRowSchema = z.object({
  tipo_registro: z.enum(["TICKET", "ACCION"], { errorMap: () => ({ message: "Tipo de registro inválido. Valores permitidos: TICKET, ACCION." }) }),
  numero_ticket_asociado: z.union([z.number().int(), z.string().regex(/^\d+$/, "Debe ser un número entero.")]).transform(val => typeof val === 'string' ? parseInt(val, 10) : val).optional().nullable(),
  titulo: z.string().optional().nullable(),
  descripcionDetallada: z.string().optional().nullable(),
  tipoIncidente: z.string().optional().nullable(),
  prioridad: z.nativeEnum(PrioridadTicket, { errorMap: () => ({ message: "Prioridad inválida. Valores permitidos: BAJA, MEDIA, ALTA, URGENTE." }) }).optional().nullable(),
  estado: z.nativeEnum(EstadoTicket, { errorMap: () => ({ message: "Estado inválido. Valores permitidos: ABIERTO, CERRADO, EN_PROGRESO, PENDIENTE_TERCERO, PENDIENTE_CLIENTE, RESUELTO, CANCELADO." }) }).optional().nullable(),
  solicitanteNombre: z.string().optional().nullable(),
  solicitanteTelefono: z.string().optional().nullable(),
  solicitanteCorreo: z.union([z.string().email("Correo del solicitante inválido."), z.literal(''), z.null()]).optional().nullable(),
  empresaClienteNombre: z.string().optional().nullable(),
  tecnicoAsignadoEmail: z.string().email("Email del técnico inválido.").optional().or(z.literal('')).nullable(),
  // Nuevos campos para la ubicación geográfica y sucursal
  pais: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  comuna: z.string().optional().nullable(),
  calle: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  nombreSucursal: z.string().optional().nullable(),
  nombreUbicacionReferencial: z.string().optional().nullable(),
  notasUbicacion: z.string().optional().nullable(),
  fechaCreacion: z.string().refine((val) => val === '' || val === null || !isNaN(Date.parse(val)), { message: "Formato de fecha de creación inválido (YYYY-MM-DD HH:MM:SS)." }).optional().nullable(),
  fechaSolucionEstimada: z.string().refine((val) => val === '' || val === null || !isNaN(Date.parse(val)), { message: "Formato de fecha de solución estimada inválido (YYYY-MM-DD)." }).optional().nullable(),
  equipoAfectado: z.string().optional().nullable(),
  accion_descripcion: z.string().optional().nullable(),
  accion_fecha: z.string().refine((val) => val === '' || val === null || !isNaN(Date.parse(val)), { message: "Formato de fecha de acción inválido (YYYY-MM-DD HH:MM:SS)." }).optional().nullable(),
  accion_usuario_email: z.string().optional().nullable(),
  accion_categoria: z.string().optional().nullable(),
});

const ticketCsvRowSchema = baseCsvRowSchema.extend({
  tipo_registro: z.literal("TICKET"),
  titulo: z.string().min(1, "El título es obligatorio para tickets."),
  tipoIncidente: z.string().min(1, "El tipo de incidente es obligatorio para tickets."),
  prioridad: z.nativeEnum(PrioridadTicket, { errorMap: () => ({ message: "Prioridad inválida. Valores permitidos: BAJA, MEDIA, ALTA, URGENTE." }) }),
  estado: z.nativeEnum(EstadoTicket, { errorMap: () => ({ message: "Estado inválido. Valores permitidos: ABIERTO, CERRADO, EN_PROGRESO, PENDIENTE_TERCERO, PENDIENTE_CLIENTE, RESUELTO, CANCELADO." }) }),
  solicitanteNombre: z.string().min(1, "El nombre del solicitante es obligatorio para tickets."),
  pais: z.string().min(1, "El país es obligatorio para tickets."),
  region: z.string().min(1, "La región es obligatoria para tickets."),
  provincia: z.string().min(1, "La provincia es obligatoria para tickets."),
  comuna: z.string().min(1, "La comuna es obligatoria para tickets."),
  calle: z.string().min(1, "La calle es obligatoria para tickets."),
  numero: z.string().min(1, "El número de dirección es obligatorio para tickets."),
  nombreSucursal: z.string().min(1, "El nombre de la sucursal es obligatorio para tickets."),
  fechaCreacion: z.string().min(1, "La fecha de creación es obligatoria para tickets.").refine((val) => !isNaN(Date.parse(val)), { message: "Formato de fecha de creación inválido (YYYY-MM-DD HH:MM:SS) para tickets." }),
});

const accionCsvRowSchema = baseCsvRowSchema.extend({
  tipo_registro: z.literal("ACCION"),
  numero_ticket_asociado: z.union([z.number().int().min(1, "El número de ticket asociado es obligatorio para acciones."), z.string().regex(/^\d+$/, "Debe ser un número entero.").transform(val => parseInt(val, 10)).refine(val => val >= 1, "El número de ticket asociado debe ser al menos 1.")]),
  accion_descripcion: z.string().min(1, "La descripción de la acción es obligatoria."),
  accion_fecha: z.string().min(1, "La fecha de acción es obligatoria.").refine((val) => !isNaN(Date.parse(val)), { message: "Formato de fecha de acción inválido (YYYY-MM-DD HH:MM:SS)." }),
  accion_usuario_email: z.string().email("Email del usuario de la acción inválido.").optional().or(z.literal('')).nullable(),
  // Nuevos campos para la ubicación geográfica y sucursal (opcionales para acciones)
  pais: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  comuna: z.string().optional().nullable(),
  calle: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  nombreSucursal: z.string().optional().nullable(),
  nombreUbicacionReferencial: z.string().optional().nullable(),
  notasUbicacion: z.string().optional().nullable(),
});

type CsvRow = z.infer<typeof baseCsvRowSchema>;
type TicketCsvRow = z.infer<typeof ticketCsvRowSchema>;
type AccionCsvRow = z.infer<typeof accionCsvRowSchema>;

export async function POST(request: NextRequest) {
  let responseData: { message: string; successfulCount: number; failedCount: number; errors: any[] };
  let statusCode: number;

  // 1. Verificación de sesión y rol de administrador.
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user || user.rol !== RoleUsuario.ADMIN) {
    return NextResponse.json({ message: "Acceso denegado. Se requiere rol de Administrador." }, { status: 403 });
  }

  // 2. Recepción y validación del cuerpo de la solicitud (se espera un JSON).
  let records: CsvRow[];
  try {
    records = await request.json();
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ message: "No se proporcionaron registros o el formato es incorrecto." }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: "Error al parsear el cuerpo de la solicitud JSON." }, { status: 400 });
  }

  const errors: { row: number; data: any; error: string }[] = [];
  let successfulCount = 0;

  try {
    // 3. Optimización: Pre-cargamos en memoria los datos que se consultarán repetidamente.
    const [empresas, tecnicos, clientes, paises, regiones, provincias, comunas, lastTicket] = await Promise.all([
      prisma.empresa.findMany({ select: { id: true, nombre: true } }),
      prisma.user.findMany({ where: { rol: RoleUsuario.TECNICO }, select: { id: true, email: true } }),
      prisma.contactoEmpresa.findMany({ select: { id: true, email: true } }),
      prisma.pais.findMany({ select: { id: true, nombre: true } }),
      prisma.region.findMany({ select: { id: true, nombre: true, paisId: true } }),
      prisma.provincia.findMany({ select: { id: true, nombre: true, regionId: true } }),
      prisma.comuna.findMany({ select: { id: true, nombre: true, provinciaId: true } }),
      prisma.ticket.findFirst({ orderBy: { numeroCaso: 'desc' }, select: { numeroCaso: true } })
    ]);

    const empresaMap = new Map(empresas.map(e => [e.nombre.toLowerCase(), e.id]));
    const tecnicoMap = new Map(tecnicos.map(t => [t.email?.toLowerCase(), t.id]));
    const clienteMap = new Map(clientes.map(c => [c.email?.toLowerCase(), c.id]));

    const paisMap = new Map(paises.map(p => [p.nombre.toLowerCase(), p.id]));
    const regionMap = new Map(regiones.map(r => [`${r.nombre.toLowerCase()}-${r.paisId}`, r.id]));
    const provinciaMap = new Map(provincias.map(p => [`${p.nombre.toLowerCase()}-${p.regionId}`, p.id]));
    const comunaMap = new Map(comunas.map(c => [`${c.nombre.toLowerCase()}-${c.provinciaId}`, c.id]));

    let currentNumeroCaso = lastTicket?.numeroCaso || 0;

    // 4. Lógica de Negocio dentro de una Transacción Atómica.
    // O todo se guarda, o no se guarda nada. Esto previene datos corruptos.
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowIndex = i + 2; // Simula la línea en el CSV para los mensajes de error.

        const cleanedRecord = Object.fromEntries(
          Object.entries(record as Record<string, unknown>).map(([key, value]) => [key, value === '' ? null : value])
        ) as CsvRow;

        // Validar el tipo de registro primero
        const baseValidation = baseCsvRowSchema.safeParse(cleanedRecord);
        if (!baseValidation.success) {
          errors.push({ row: rowIndex, data: record, error: baseValidation.error.errors.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') });
          continue;
        }

        const tipoRegistro = baseValidation.data.tipo_registro;

        if (tipoRegistro === "TICKET") {
          const validation = ticketCsvRowSchema.safeParse(cleanedRecord);
          if (!validation.success) {
            errors.push({ row: rowIndex, data: record, error: validation.error.errors.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') });
            continue;
          }

          const {
            titulo,
            descripcionDetallada,
            tipoIncidente,
            prioridad,
            estado,
            solicitanteNombre,
            solicitanteTelefono,
            solicitanteCorreo,
            fechaCreacion,
            fechaSolucionEstimada,
            equipoAfectado,
            empresaClienteNombre,
            tecnicoAsignadoEmail,
            pais,
            region,
            provincia,
            comuna,
            calle,
            numero,
            nombreSucursal,
            nombreUbicacionReferencial,
            notasUbicacion,
          } = validation.data;

          // Búsqueda o creación de País
          let paisId = pais ? paisMap.get(pais.toLowerCase()) : null;
          if (pais && !paisId) {
            const newPais = await tx.pais.create({ data: { nombre: pais } });
            paisId = newPais.id;
            paisMap.set(pais.toLowerCase(), paisId); // Actualizar mapa en memoria
          }
          if (pais && !paisId) { errors.push({ row: rowIndex, data: record, error: `El país '${pais}' no pudo ser encontrado o creado.` }); continue; }

          // Búsqueda o creación de Región
          let regionId = (region && paisId) ? regionMap.get(`${region.toLowerCase()}-${paisId}`) : null;
          if (region && paisId && !regionId) {
            const newRegion = await tx.region.create({ data: { nombre: region, paisId: paisId } });
            regionId = newRegion.id;
            regionMap.set(`${region.toLowerCase()}-${paisId}`, regionId); // Actualizar mapa en memoria
          }
          if (region && !regionId) { errors.push({ row: rowIndex, data: record, error: `La región '${region}' no pudo ser encontrada o creada.` }); continue; }

          // Búsqueda o creación de Provincia
          let provinciaId = (provincia && regionId) ? provinciaMap.get(`${provincia.toLowerCase()}-${regionId}`) : null;
          if (provincia && regionId && !provinciaId) {
            const newProvincia = await tx.provincia.create({ data: { nombre: provincia, regionId: regionId } });
            provinciaId = newProvincia.id;
            provinciaMap.set(`${provincia.toLowerCase()}-${regionId}`, provinciaId); // Actualizar mapa en memoria
          }
          if (provincia && !provinciaId) { errors.push({ row: rowIndex, data: record, error: `La provincia '${provincia}' no pudo ser encontrada o creada.` }); continue; }

          // Búsqueda o creación de Comuna
          let comunaId = (comuna && provinciaId) ? comunaMap.get(`${comuna.toLowerCase()}-${provinciaId}`) : null;
          if (comuna && provinciaId && !comunaId) {
            const newComuna = await tx.comuna.create({ data: { nombre: comuna, provinciaId: provinciaId } });
            comunaId = newComuna.id;
            comunaMap.set(`${comuna.toLowerCase()}-${provinciaId}`, comunaId); // Actualizar mapa en memoria
          }
          if (comuna && !comunaId) { errors.push({ row: rowIndex, data: record, error: `La comuna '${comuna}' no pudo ser encontrada o creada.` }); continue; }

          // Búsqueda o creación de Dirección
          let direccionId: string | null = null;
          if (calle && numero && comunaId) {
            let existingDireccion = await tx.direccion.findFirst({
              where: { calle: calle, numero: numero, comunaId: comunaId },
              select: { id: true }
            });
            if (existingDireccion) {
              direccionId = existingDireccion.id;
            } else {
              const newDireccion = await tx.direccion.create({ data: { calle, numero, comunaId } });
              direccionId = newDireccion.id;
            }
          }
          if ((calle || numero) && !direccionId) { errors.push({ row: rowIndex, data: record, error: `La dirección no pudo ser encontrada o creada.` }); continue; }

          // Búsqueda de IDs relacionados para Ticket
          const empresaId = empresaClienteNombre ? empresaMap.get(empresaClienteNombre.toLowerCase()) : null;
          if (empresaClienteNombre && !empresaId) {
            errors.push({ row: rowIndex, data: record, error: `La empresa '${empresaClienteNombre}' no fue encontrada.` });
            continue;
          }

          // Búsqueda o creación de Sucursal
          let sucursalId: string | null = null;
          if (nombreSucursal && direccionId) {
            let existingSucursal = await tx.sucursal.findFirst({
              where: { nombre: nombreSucursal, direccionId: direccionId },
              select: { id: true }
            });
            if (existingSucursal) {
              sucursalId = existingSucursal.id;
            } else {
              const newSucursal = await tx.sucursal.create({
                data: {
                  nombre: nombreSucursal,
                  direccionId: direccionId,
                  ...(empresaId && { empresaId: empresaId }), // Asignar empresaId solo si existe
                }
              });
              sucursalId = newSucursal.id;
            }
          }
          if (nombreSucursal && !sucursalId) { errors.push({ row: rowIndex, data: record, error: `La sucursal '${nombreSucursal}' no pudo ser encontrada o creada.` }); continue; }

          // Búsqueda o creación de Ubicación (ahora ligada a Sucursal)
          let ubicacionId: string | null = null;
          if (sucursalId) {
            let existingUbicacion = await tx.ubicacion.findFirst({
              where: {
                sucursalId: sucursalId,
                nombreReferencial: nombreUbicacionReferencial || null,
              },
              select: { id: true }
            });
            if (existingUbicacion) {
              ubicacionId = existingUbicacion.id;
            } else {
              const newUbicacion = await tx.ubicacion.create({
                data: {
                  sucursalId: sucursalId,
                  nombreReferencial: nombreUbicacionReferencial || null, // Asegurar que sea null si es string vacío
                  notas: notasUbicacion,
                }
              });
              ubicacionId = newUbicacion.id;
            }
          }
          if (!ubicacionId) { errors.push({ row: rowIndex, data: record, error: `La ubicación no pudo ser encontrada o creada.` }); continue; }

          const tecnicoAsignadoId = tecnicoAsignadoEmail ? tecnicoMap.get(tecnicoAsignadoEmail.toLowerCase()) : null;
          if (tecnicoAsignadoEmail && !tecnicoAsignadoId) {
            errors.push({ row: rowIndex, data: record, error: `El técnico con email '${tecnicoAsignadoEmail}' no fue encontrado.` });
            // Opcional: podrías decidir continuar y asignar al usuario actual.
          }

          let solicitanteClienteId = solicitanteCorreo ? clienteMap.get(solicitanteCorreo.toLowerCase()) || null : null;
          if (solicitanteCorreo && !solicitanteClienteId) {
            if (!empresaId) {
              errors.push({ row: rowIndex, data: record, error: `No se puede crear ContactoEmpresa sin un empresaId.` });
              continue;
            }
            // Intentar crear el ContactoEmpresa si no existe
            try {
              const newContacto = await tx.contactoEmpresa.create({
                data: {
                  nombreCompleto: solicitanteNombre || 'Desconocido',
                  email: solicitanteCorreo,
                  telefono: solicitanteTelefono || '', // Asegurar que sea un string
                  empresa: { connect: { id: empresaId } },
                },
              });
              solicitanteClienteId = newContacto.id;
              clienteMap.set(solicitanteCorreo.toLowerCase(), solicitanteClienteId); // Actualizar mapa en memoria
            } catch (createError) {
              errors.push({ row: rowIndex, data: record, error: `No se pudo crear el ContactoEmpresa para el email '${solicitanteCorreo}'.` });
              continue;
            }
          }

          const finalTecnicoAsignadoId = tecnicoAsignadoId || (user && user.id ? user.id : null);

          currentNumeroCaso++;

          // Explicitly build the data object for Prisma
          const ticketDataForPrisma: Prisma.TicketCreateInput = {
            numeroCaso: currentNumeroCaso,
            titulo: titulo,
            descripcionDetallada: descripcionDetallada,
            tipoIncidente: tipoIncidente,
            prioridad: prioridad,
            estado: estado,
            solicitanteNombre: solicitanteNombre,
            solicitanteTelefono: solicitanteTelefono,
            solicitanteCorreo: solicitanteCorreo,
            fechaCreacion: new Date(fechaCreacion),
            fechaSolucionEstimada: fechaSolucionEstimada ? new Date(fechaSolucionEstimada) : null,
            equipoAfectado: equipoAfectado,
            empresa: empresaId ? { connect: { id: empresaId } } : undefined,
            ubicacionReporte: ubicacionId ? { connect: { id: ubicacionId } } : undefined,
            tecnicoAsignado: finalTecnicoAsignadoId ? { connect: { id: finalTecnicoAsignadoId } } : undefined,
            solicitanteCliente: solicitanteClienteId ? { connect: { id: solicitanteClienteId } } : undefined,
          };

          const newTicket = await tx.ticket.create({
            data: ticketDataForPrisma,
            include: {
              acciones: true,
            },
          });

          // Crear una acción de tipo 'comment' para el ticket recién creado
          await tx.accionTicket.create({
            data: {
              ticketId: newTicket.id,
              fechaAccion: new Date(fechaCreacion), // Usar la fecha de creación del ticket para la acción inicial
                   descripcion: "Ticket creado mediante carga masiva.",
                   usuarioId: user?.id ?? null, // Asigna al usuario que realiza la importación
                   categoria: 'comment', // Usa la categoría del CSV o 'comment' por defecto
               },
           });
           successfulCount++;
         } else if (tipoRegistro === "ACCION") {
          const validation = accionCsvRowSchema.safeParse(cleanedRecord);
          if (!validation.success) {
            errors.push({ row: rowIndex, data: record, error: validation.error.errors.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') });
            continue;
          }

          const { numero_ticket_asociado, accion_descripcion, accion_fecha, accion_usuario_email, accion_categoria } = validation.data;

          // Buscar el ticket asociado por numeroCaso
          const associatedTicket = await tx.ticket.findUnique({
            where: { numeroCaso: numero_ticket_asociado },
            select: { id: true },
          });

          if (!associatedTicket) {
            errors.push({ row: rowIndex, data: record, error: `El ticket con número ${numero_ticket_asociado} no fue encontrado para asociar la acción.` });
            continue;
          }

          // Buscar el usuario de la acción por email
          let accionUsuarioId: string | null = null;
          if (accion_usuario_email) {
            const accionUser = await tx.user.findUnique({
              where: { email: accion_usuario_email },
              select: { id: true },
            });
            if (!accionUser) {
              errors.push({ row: rowIndex, data: record, error: `El usuario de la acción con email '${accion_usuario_email}' no fue encontrado.` });
              continue;
            }
            accionUsuarioId = accionUser.id;
          } else {
            accionUsuarioId = user?.id ?? null; // Si no se especifica, usa el usuario que importa
          }

          await tx.accionTicket.create({
            data: {
              ticketId: associatedTicket.id,
              fechaAccion: new Date(accion_fecha),
              descripcion: accion_descripcion,
              usuarioId: accionUsuarioId,
              categoria: accion_categoria || 'comment',
            },
          });
          successfulCount++;
        }
      }

      // Si se encuentra CUALQUIER error durante la validación, se lanza un error
        // para revertir (rollback) toda la transacción.
        if (errors.length > 0) {
            throw new Error(JSON.stringify({
                message: "Se encontraron errores de validación. La importación fue cancelada y revertida.",
                detailedErrors: errors,
            }));
        }

    });

    // 5. REVALIDACIÓN DE CACHÉ (LA SOLUCIÓN CLAVE)
    // Si llegamos aquí, la transacción fue exitosa.
    // Le ordenamos a Next.js que borre el caché de estas páginas.
    // La próxima vez que un usuario las visite, Next.js las generará de nuevo con los datos actualizados.
    console.log("Transacción exitosa. Revalidando rutas...");
    revalidatePath('/tickets/dashboard'); // Revalida la página principal del dashboard.
    revalidatePath('/tickets'); // Revalida la ruta base de tickets por si hay layouts cacheados.
    revalidatePath('/'); // Revalida la página de inicio por si muestra algún contador o resumen.

    // 6. Envío de respuesta exitosa al cliente.
    responseData = {
        message: "Proceso de importación finalizado con éxito.",
        successfulCount: successfulCount,
        failedCount: 0,
        errors: [],
    };
    statusCode = 200;

  } catch (error: any) {
    // 7. Manejo de Errores y Rollback.
    // Este bloque se ejecuta si la transacción falla.
    let mainMessage = "Error durante la transacción. No se importó ningún ticket.";
    let finalErrorsArray = errors; // Errores de validación que causaron el rollback.



    // Intenta parsear el error por si es el que lanzamos nosotros con detalles.
    try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.message && parsedError.detailedErrors) {
            mainMessage = parsedError.message;
            finalErrorsArray = parsedError.detailedErrors;
        }
    } catch (parseError) {
       // Si no es nuestro error JSON, es un error de base de datos u otro.
       mainMessage = "Error inesperado en la base de datos durante la transacción. Se ha realizado un rollback.";
       console.error("Error de importación (catch principal):", error.message);
    }
    
    // Logueamos los errores en el servidor para depuración.
    console.warn("Rollback de Importación de Tickets:", mainMessage);
    if (finalErrorsArray.length > 0) {
        console.table(finalErrorsArray.map((err: { row: number; error: string; data: any }) => ({ Línea: err.row, Error: err.error, Datos: JSON.stringify(err.data).substring(0, 80) + '...' })));
    }
    
    // Si el array de errores está vacío pero aún así hubo un error, añadimos un error genérico.
    if (finalErrorsArray.length === 0) {
      finalErrorsArray.push({ row: 0, data: {}, error: mainMessage });
    }

    responseData = {
      message: mainMessage,
      successfulCount: 0,
      failedCount: records.length,
      errors: finalErrorsArray,
    };
    statusCode = 400;
  }

  return NextResponse.json(responseData, { status: statusCode });
}
