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
  numero_ticket_asociado: z.union([z.number().int(), z.string().regex(/^\d+$/, "Debe ser un número entero.")]).transform((val: string | number) => typeof val === 'string' ? parseInt(val, 10) : val).optional().nullable(),
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
  fechaCreacion: z.string().refine((val: string) => val === '' || val === null || !isNaN(Date.parse(val)), { message: "Formato de fecha de creación inválido (YYYY-MM-DD HH:MM:SS)." }).optional().nullable(),
  fechaSolucionEstimada: z.string().refine((val: string) => val === '' || val === null || !isNaN(Date.parse(val)), { message: "Formato de fecha de solución estimada inválido (YYYY-MM-DD)." }).optional().nullable(),
  equipoAfectado: z.string().optional().nullable(),
  accion_descripcion: z.string().optional().nullable(),
  accion_fecha: z.string().refine((val: string) => val === '' || val === null || !isNaN(Date.parse(val)), { message: "Formato de fecha de acción inválido (YYYY-MM-DD HH:MM:SS)." }).optional().nullable(),
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
  pais: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  comuna: z.string().min(1, "La comuna es obligatoria para tickets."),
  calle: z.string().min(1, "La calle es obligatoria para tickets."),
  numero: z.string().min(1, "El número de dirección es obligatorio para tickets."),
  nombreSucursal: z.string().min(1, "El nombre de la sucursal es obligatorio para tickets."),
  fechaCreacion: z.string().min(1, "La fecha de creación es obligatoria para tickets.").refine((val: string) => !isNaN(Date.parse(val)), { message: "Formato de fecha de creación inválido (YYYY-MM-DD HH:MM:SS) para tickets." }),
});

const accionCsvRowSchema = baseCsvRowSchema.extend({
  tipo_registro: z.literal("ACCION"),
  numero_ticket_asociado: z.union([z.number().int().min(1, "El número de ticket asociado es obligatorio para acciones."), z.string().regex(/^\d+$/, "Debe ser un número entero.").transform((val: string) => parseInt(val, 10))]).refine((val: number) => val >= 1, "El número de ticket asociado debe ser al menos 1."),
  accion_descripcion: z.string().min(1, "La descripción de la acción es obligatoria."),
  accion_fecha: z.string().min(1, "La fecha de acción es obligatoria.").refine((val: string) => !isNaN(Date.parse(val)), { message: "Formato de fecha de acción inválido (YYYY-MM-DD HH:MM:SS)." }),
  accion_usuario_email: z.string().email("Email del usuario de la acción inválido.").optional().or(z.literal('')).nullable(),
  // Los campos de ubicación son opcionales para las acciones y no obligatorios para la creación
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
  // Inicializamos responseData y statusCode aquí para que sean accesibles en todo el ámbito de la función.
  let responseData: { message: string; successfulCount: number; failedCount: number; errors: any[] } = {
    message: "",
    successfulCount: 0,
    failedCount: 0,
    errors: [],
  };
  let statusCode: number;

  // 1. Verificación de sesión y rol de administrador.
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user || user.rol !== RoleUsuario.ADMIN) {
    responseData = { message: "Acceso denegado. Se requiere rol de Administrador.", successfulCount: 0, failedCount: 0, errors: [] };
    statusCode = 403;
    return NextResponse.json(responseData, { status: statusCode });
  }

  // 2. Recepción y validación del cuerpo de la solicitud (se espera un JSON).
  let records: CsvRow[];
  try {
    records = await request.json();
    if (!Array.isArray(records) || records.length === 0) {
      responseData = { message: "No se proporcionaron registros o el formato es incorrecto.", successfulCount: 0, failedCount: 0, errors: [] };
      statusCode = 400;
      return NextResponse.json(responseData, { status: statusCode });
    }
  } catch (error: any) {
    responseData = { message: "Error al parsear el cuerpo de la solicitud JSON.", successfulCount: 0, failedCount: 0, errors: [] };
    statusCode = 400;
    return NextResponse.json(responseData, { status: statusCode });
  }

  // Usamos un array separado para los errores acumulados durante el procesamiento
  const processingErrors: { row: number; data: any; error: string }[] = [];
  let currentSuccessfulCount = 0; // Contador de éxitos dentro de la lógica principal

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

        // Limpiar el registro, convirtiendo strings vacíos a null
        const cleanedRecord = Object.fromEntries(
          Object.entries(record as Record<string, unknown>).map(([key, value]) => [key, value === '' ? null : value])
        ) as CsvRow;

        // Validar el tipo de registro primero
        const baseValidation = baseCsvRowSchema.safeParse(cleanedRecord);
        if (!baseValidation.success) {
          processingErrors.push({ row: rowIndex, data: record, error: baseValidation.error.errors.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') });
          continue;
        }

        const tipoRegistro = baseValidation.data.tipo_registro;

        if (tipoRegistro === "TICKET") {
          const validation = ticketCsvRowSchema.safeParse(cleanedRecord);
          if (!validation.success) {
            processingErrors.push({ row: rowIndex, data: record, error: validation.error.errors.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') });
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
          } = validation.data as TicketCsvRow; // Asegurarse de que el tipo sea TicketCsvRow

          let paisId: string | null = null;
          let regionId: string | null = null;
          let provinciaId: string | null = null;
          let comunaId: string | null = null;

          // Si se proporciona comuna, intentar obtener sus relaciones (provincia, región, país)
          if (comuna) {
            const existingComuna = await tx.comuna.findFirst({
              where: { nombre: comuna },
              include: {
                provincia: {
                  include: {
                    region: {
                      include: {
                        pais: true,
                      },
                    },
                  },
                },
              },
            });

            if (existingComuna) {
              comunaId = existingComuna.id;
              provinciaId = existingComuna.provinciaId || null;
              regionId = existingComuna.provincia?.regionId || null;
              paisId = existingComuna.provincia?.region?.pais?.id || null;
            }
          }

          // Si no se pudo derivar el paisId de la comuna, intentar buscarlo/crearlo si se proporcionó explícitamente
          if (!paisId && pais) {
            paisId = paisMap.get(pais.toLowerCase()) || null;
            if (!paisId) {
              try {
                const newPais = await tx.pais.create({ data: { nombre: pais } });
                paisId = newPais.id;
                paisMap.set(pais.toLowerCase(), paisId); // Actualizar mapa en memoria
              } catch (e) {
                processingErrors.push({ row: rowIndex, data: record, error: `Error creando país '${pais}': ${e instanceof Error ? e.message : String(e)}` });
                continue;
              }
            }
          }
          if (!paisId && pais) { processingErrors.push({ row: rowIndex, data: record, error: `El país '${pais}' no pudo ser encontrado o creado.` }); continue; }

          // Si no se pudo derivar el regionId de la comuna, intentar buscarlo/crearlo si se proporcionó explícitamente
          if (!regionId && region) {
            if (!paisId) { processingErrors.push({ row: rowIndex, data: record, error: `No se puede crear la región '${region}' sin un país asociado.` }); continue; }
            regionId = regionMap.get(`${region.toLowerCase()}-${paisId}`) || null;
            if (!regionId) {
              try {
                const newRegion = await tx.region.create({ data: { nombre: region, paisId: paisId } });
                regionId = newRegion.id;
                regionMap.set(`${region.toLowerCase()}-${paisId}`, regionId); // Actualizar mapa en memoria
              } catch (e) {
                processingErrors.push({ row: rowIndex, data: record, error: `Error creando región '${region}': ${e instanceof Error ? e.message : String(e)}` });
                continue;
              }
            }
          }
          if (!regionId && region) { processingErrors.push({ row: rowIndex, data: record, error: `La región '${region}' no pudo ser encontrada o creada.` }); continue; }

          // Si no se pudo derivar el provinciaId de la comuna, intentar buscarlo/crearlo si se proporcionó explícitamente
          if (!provinciaId && provincia) {
            if (!regionId) { processingErrors.push({ row: rowIndex, data: record, error: `No se puede crear la provincia '${provincia}' sin una región asociada.` }); continue; }
            provinciaId = provinciaMap.get(`${provincia.toLowerCase()}-${regionId}`) || null;
            if (!provinciaId) {
              try {
                const newProvincia = await tx.provincia.create({ data: { nombre: provincia, regionId: regionId } });
                provinciaId = newProvincia.id;
                provinciaMap.set(`${provincia.toLowerCase()}-${regionId}`, provinciaId); // Actualizar mapa en memoria
              } catch (e) {
                processingErrors.push({ row: rowIndex, data: record, error: `Error creando provincia '${provincia}': ${e instanceof Error ? e.message : String(e)}` });
                continue;
              }
            }
          }
          if (!provinciaId && provincia) { processingErrors.push({ row: rowIndex, data: record, error: `La provincia '${provincia}' no pudo ser encontrada o creada.` }); continue; }

          // Si no se pudo derivar el comunaId de la comuna, intentar buscarlo/crearlo si se proporcionó explícitamente
          if (!comunaId && comuna) {
            if (!provinciaId) { processingErrors.push({ row: rowIndex, data: record, error: `No se puede crear la comuna '${comuna}' sin una provincia asociada.` }); continue; }
            comunaId = comunaMap.get(`${comuna.toLowerCase()}-${provinciaId}`) || null;
            if (!comunaId) {
              try {
                const newComuna = await tx.comuna.create({ data: { nombre: comuna, provinciaId: provinciaId } });
                comunaId = newComuna.id;
                comunaMap.set(`${comuna.toLowerCase()}-${provinciaId}`, comunaId); // Actualizar mapa en memoria
              } catch (e) {
                processingErrors.push({ row: rowIndex, data: record, error: `Error creando comuna '${comuna}': ${e instanceof Error ? e.message : String(e)}` });
                continue;
              }
            }
          }
          if (!comunaId && comuna) { processingErrors.push({ row: rowIndex, data: record, error: `La comuna '${comuna}' no pudo ser encontrada o creada.` }); continue; }

          // Si la comuna es obligatoria y no se pudo determinar, generar error
          if (!comunaId) { processingErrors.push({ row: rowIndex, data: record, error: `La comuna es obligatoria y no pudo ser determinada.` }); continue; }

          // Búsqueda o creación de Sucursal
          let sucursalId: string | null = null;
          let direccionId: string | null = null; // Asumiendo que Direccion es un modelo separado relacionado con Sucursal
          let ubicacionReporteId: string | null = null; // Variable para almacenar el ID de la Ubicacion para el ticket

          if (nombreSucursal) {
            // Primero, intentar encontrar la dirección basada en comuna, calle, numero
            const existingDireccion = await tx.direccion.findFirst({
              where: {
                comunaId: comunaId,
                calle: calle || '',
                numero: numero || '',
              },
            });

            if (existingDireccion) {
              direccionId = existingDireccion.id;
              // Ahora, intentar encontrar una sucursal con esta dirección y nombre
              const existingSucursal = await tx.sucursal.findFirst({
                where: {
                  nombre: nombreSucursal,
                  direccionId: direccionId,
                },
                include: {
                  ubicaciones: true // Incluir las ubicaciones para obtener su ID si existe
                }
              });

              if (existingSucursal) {
                sucursalId = existingSucursal.id;
                // Si la sucursal ya tiene ubicaciones, usamos la primera o creamos una si no se especificó un nombre referencial
                if (existingSucursal.ubicaciones.length > 0 && !nombreUbicacionReferencial) {
                  ubicacionReporteId = existingSucursal.ubicaciones[0].id;
                } else {
                  // Si existe sucursal pero no la ubicacion referencial, o si se especificó una nueva
                  const existingUbicacion = existingSucursal.ubicaciones.find(u => u.nombreReferencial === nombreUbicacionReferencial);
                  if (existingUbicacion) {
                    ubicacionReporteId = existingUbicacion.id;
                  } else {
                    try {
                      const newUbicacion = await tx.ubicacion.create({
                        data: {
                          nombreReferencial: nombreUbicacionReferencial || null,
                          notas: notasUbicacion || null,
                          sucursalId: sucursalId,
                        },
                      });
                      ubicacionReporteId = newUbicacion.id;
                    } catch (e) {
                      processingErrors.push({ row: rowIndex, data: record, error: `Error creando ubicación para sucursal existente '${nombreSucursal}': ${e instanceof Error ? e.message : String(e)}` });
                      continue;
                    }
                  }
                }
              } else {
                // Si la dirección existe pero la sucursal no, crear nueva sucursal conectando a la dirección existente
                try {
                  const newSucursal = await tx.sucursal.create({
                    data: {
                      nombre: nombreSucursal,
                      direccion: { connect: { id: direccionId } },
                      ubicaciones: { // La creación de ubicaciones secundarias dentro de la sucursal
                        create: {
                          nombreReferencial: nombreUbicacionReferencial || null,
                          notas: notasUbicacion || null,
                        },
                      },
                    },
                    include: {
                      ubicaciones: true
                    }
                  });
                  sucursalId = newSucursal.id;
                  if (newSucursal.ubicaciones.length > 0) {
                    ubicacionReporteId = newSucursal.ubicaciones[0].id;
                  }
                } catch (e) {
                  processingErrors.push({ row: rowIndex, data: record, error: `Error creando sucursal '${nombreSucursal}' con dirección existente: ${e instanceof Error ? e.message : String(e)}` });
                  continue;
                }
              }
            } else {
              // Si la dirección no existe, crear nueva dirección y luego nueva sucursal
              try {
                const newDireccion = await tx.direccion.create({
                  data: {
                    calle: calle || '',
                    numero: numero || '',
                    comunaId: comunaId,
                  },
                });
                direccionId = newDireccion.id;

                const newSucursal = await tx.sucursal.create({
                  data: {
                    nombre: nombreSucursal,
                    direccion: { connect: { id: direccionId } },
                    ubicaciones: { // La creación de ubicaciones secundarias dentro de la sucursal
                      create: {
                        nombreReferencial: nombreUbicacionReferencial || null,
                        notas: notasUbicacion || null,
                      },
                    },
                  },
                  include: {
                    ubicaciones: true
                  }
                });
                sucursalId = newSucursal.id;
                if (newSucursal.ubicaciones.length > 0) {
                  ubicacionReporteId = newSucursal.ubicaciones[0].id;
                }
              } catch (e) {
                processingErrors.push({ row: rowIndex, data: record, error: `Error creando dirección o sucursal '${nombreSucursal}': ${e instanceof Error ? e.message : String(e)}` });
                continue;
              }
            }
          }

          if (!sucursalId && nombreSucursal) {
            processingErrors.push({ row: rowIndex, data: record, error: `La sucursal '${nombreSucursal}' no pudo ser encontrada o creada.` });
            continue;
          }

          // Búsqueda o creación de Empresa Cliente
          let empresaClienteId: string | null = null;
          if (empresaClienteNombre) {
            empresaClienteId = empresaMap.get(empresaClienteNombre.toLowerCase()) || null;
            if (!empresaClienteId) {
              try {
                const newEmpresa = await tx.empresa.create({ data: { nombre: empresaClienteNombre } });
                empresaClienteId = newEmpresa.id;
                empresaMap.set(empresaClienteNombre.toLowerCase(), empresaClienteId); // Actualizar mapa en memoria
              } catch (e) {
                processingErrors.push({ row: rowIndex, data: record, error: `Error creando empresa '${empresaClienteNombre}': ${e instanceof Error ? e.message : String(e)}` });
                continue;
              }
            }
          }

          // Búsqueda o creación de Contacto Empresa (Solicitante)
          let solicitanteId: string | null = null;
          if (solicitanteCorreo) {
            solicitanteId = clienteMap.get(solicitanteCorreo.toLowerCase()) || null;
            if (!solicitanteId) {
              try {
                const newContacto = await tx.contactoEmpresa.create({
                  data: {
                    nombreCompleto: solicitanteNombre || 'Desconocido',
                    email: solicitanteCorreo,
                    telefono: solicitanteTelefono || '',
                    ...(empresaClienteId && { empresa: { connect: { id: empresaClienteId } } }) // Asociar al ID de la empresa si existe
                  },
                });
                solicitanteId = newContacto.id;
                clienteMap.set(solicitanteCorreo.toLowerCase(), solicitanteId); // Actualizar mapa en memoria
              } catch (e) {
                processingErrors.push({ row: rowIndex, data: record, error: `Error creando contacto de empresa para '${solicitanteCorreo}': ${e instanceof Error ? e.message : String(e)}` });
                continue;
              }
            }
          }

          // Búsqueda de Técnico Asignado
          let tecnicoAsignadoId: string | null = null;
          if (tecnicoAsignadoEmail) {
            tecnicoAsignadoId = tecnicoMap.get(tecnicoAsignadoEmail.toLowerCase()) || null;
            if (!tecnicoAsignadoId) {
              processingErrors.push({ row: rowIndex, data: record, error: `El técnico con email '${tecnicoAsignadoEmail}' no fue encontrado.` });
              continue;
            }
          }

          // Creación del Ticket
          currentNumeroCaso++;
          const newTicket = await tx.ticket.create({
            data: {
              numeroCaso: currentNumeroCaso,
              titulo: titulo,
              descripcionDetallada: descripcionDetallada || "Ticket creado mediante carga masiva.",
              tipoIncidente: tipoIncidente,
              prioridad: prioridad,
              estado: estado,
              fechaCreacion: new Date(fechaCreacion),
              fechaSolucionEstimada: fechaSolucionEstimada ? new Date(fechaSolucionEstimada) : null,
              equipoAfectado: equipoAfectado || null,
              // Usar los campos de ID directos.
              // Usamos aserción de no nulidad (!) para solicitanteNombre,
              // ya que Zod garantiza que no será nulo si la validación fue exitosa.
              solicitanteNombre: solicitanteNombre!,
              solicitanteTelefono: solicitanteTelefono, // Puede ser null
              solicitanteCorreo: solicitanteCorreo, // Puede ser null
              solicitanteClienteId: solicitanteId,
              empresaId: empresaClienteId,
              tecnicoAsignadoId: tecnicoAsignadoId,
              ubicacionId: ubicacionReporteId, // Aquí se usa ubicacionId
            },
          });
          currentSuccessfulCount++;

          // Crear una acción inicial para el ticket recién creado
          await tx.accionTicket.create({
            data: {
              ticketId: newTicket.id,
              fechaAccion: new Date(fechaCreacion), // Usar la fecha de creación del ticket para la acción inicial
              descripcion: "Ticket creado mediante carga masiva.",
              usuarioId: user?.id ?? null, // Asigna al usuario que realiza la importación, o null si no hay user.id
              categoria: 'comment', // Usar 'comment' por defecto para la acción inicial
            },
          });


        } else if (tipoRegistro === "ACCION") {
          const validation = accionCsvRowSchema.safeParse(cleanedRecord);
          if (!validation.success) {
            processingErrors.push({ row: rowIndex, data: record, error: validation.error.errors.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') });
            continue;
          }

          const {
            numero_ticket_asociado,
            accion_descripcion,
            accion_fecha,
            accion_usuario_email,
            accion_categoria,
          } = validation.data as AccionCsvRow; // Asegurarse de que el tipo sea AccionCsvRow

          // Buscar el ticket asociado
          const ticketAsociado = await tx.ticket.findFirst({
            where: { numeroCaso: numero_ticket_asociado },
          });

          if (!ticketAsociado) {
            processingErrors.push({ row: rowIndex, data: record, error: `Ticket asociado con número ${numero_ticket_asociado} no encontrado.` });
            continue;
          }

          // Búsqueda de usuario de acción
          let accionUsuarioId: string | null = null;
          if (accion_usuario_email) {
            accionUsuarioId = tecnicoMap.get(accion_usuario_email.toLowerCase()) || null;
            if (!accionUsuarioId) {
              processingErrors.push({ row: rowIndex, data: record, error: `El usuario de acción con email '${accion_usuario_email}' no fue encontrado.` });
              continue;
            }
          } else {
            // Si no se especifica usuario de acción, usa el usuario que realiza la importación
            accionUsuarioId = user?.id ?? null;
          }

          // Creación de la Acción
          await tx.accionTicket.create({
            data: {
              descripcion: accion_descripcion,
              fechaAccion: new Date(accion_fecha),
              ticketId: ticketAsociado.id,
              usuarioId: accionUsuarioId, // Esto es correcto si usuarioId en el schema es String?
              categoria: accion_categoria || 'comment',
            },
          });
          currentSuccessfulCount++;
        }
      }

      // Si se encuentra CUALQUIER error durante el procesamiento, se lanza un error
      // para revertir (rollback) toda la transacción.
      if (processingErrors.length > 0) {
        throw new Error(JSON.stringify({
          message: "Se encontraron errores de validación. La importación fue cancelada y revertida.",
          detailedErrors: processingErrors,
        }));
      }

    }); // Fin del prisma.$transaction

    // 5. REVALIDACIÓN DE CACHÉ
    // Si llegamos aquí, la transacción fue exitosa.
    console.log("Transacción exitosa. Revalidando rutas...");
    revalidatePath('/tickets/dashboard'); // Revalida la página principal del dashboard.
    revalidatePath('/tickets'); // Revalida la ruta base de tickets por si hay layouts cacheados.
    revalidatePath('/'); // Revalida la página de inicio por si muestra algún contador o resumen.

    // 6. Envío de respuesta exitosa al cliente.
    responseData = {
      message: "Proceso de importación finalizado con éxito.",
      successfulCount: currentSuccessfulCount, // Usar el contador actualizado
      failedCount: 0,
      errors: [],
    };
    statusCode = 200;

  } catch (error: any) {
    // 7. Manejo de Errores y Rollback.
    let mainMessage = "Error durante la transacción. No se importó ningún ticket.";
    let finalErrorsArray = [...processingErrors]; // Copiar los errores acumulados durante el procesamiento

    // Intenta parsear el error por si es el que lanzamos nosotros con detalles.
    if (error.message && error.message.startsWith('{')) { // Verificar si el mensaje es un JSON
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.message && parsedError.detailedErrors) {
          mainMessage = parsedError.message;
          finalErrorsArray = parsedError.detailedErrors; // Usar los errores detallados del error lanzado
        }
      } catch (parseError) {
        // Si no es nuestro error JSON, es un error de base de datos u otro.
        console.error("Error al parsear el mensaje de error JSON:", parseError);
        mainMessage = error.message || "Error de importación (catch principal):";
      }
    } else {
      mainMessage = error.message || "Error de importación (catch principal):";
    }

    console.error("Error de importación (catch principal):", error);
    console.warn("Errores de validación de tickets:", mainMessage);
    if (finalErrorsArray.length > 0) {
      console.table(finalErrorsArray.map((err: { row: number; error: string; data: any }) => ({ Línea: err.row, Error: err.error, Datos: JSON.stringify(err.data).substring(0, 80) + '...' })));
    }

    // Si el array de errores está vacío pero aún así hubo un error, añadimos un error genérico.
    if (finalErrorsArray.length === 0 && records) { // Asegurarse que records existe
      finalErrorsArray.push({ row: 0, data: {}, error: mainMessage });
    }

    responseData = {
      message: mainMessage,
      successfulCount: 0,
      failedCount: records ? records.length : 0, // Asegurarse que records existe
      errors: finalErrorsArray,
    };
    statusCode = 400;
  }

  return NextResponse.json(responseData, { status: statusCode });
}
