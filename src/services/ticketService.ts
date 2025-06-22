// src/services/ticketService.ts

import { prisma } from "@/lib/prisma";
import {
  Prisma,
  Ticket,
  AccionTicket,
  PrioridadTicket,
  EstadoTicket,
  EquipoEnPrestamo,
  EquipoInventario,
  EstadoEquipoInventario,
  TipoEquipoInventario,
  ContactoEmpresa,
  Empresa,
  Sucursal,
  User,
  EstadoPrestamoEquipo,
} from "@prisma/client";

/**
 * Define los tipos de entrada para las operaciones CRUD de Ticket.
 */
export type TicketCreateInput = {
  // numeroCaso es opcional al crear, se genera en el servicio si no se proporciona (ej. en carga masiva)
  numeroCaso?: number;
  titulo: string;
  descripcionDetallada?: string | null;
  tipoIncidente: string;
  prioridad?: PrioridadTicket;
  estado?: EstadoTicket;
  solicitanteNombre: string;
  solicitanteTelefono?: string | null;
  solicitanteCorreo?: string | null;
  contactoId?: string | null; // ID de ContactoEmpresa
  empresaId?: string | null; // ID de Empresa
  sucursalId?: string | null; // ID de Sucursal
  creadoPorUsuarioId: string; // ID del User que crea el ticket (DIRECTO - ahora existe en el esquema)
  tecnicoAsignadoId?: string | null; // ID del User técnico asignado
  fechaSolucionEstimada?: Date | null;
  equipoAfectado?: string | null;
  // Opcional: para crear un préstamo de equipo junto con el ticket
  equipoPrestamo?: {
    equipoId: string;
    prestadoAContactoId: string;
    personaResponsableEnSitio: string;
    fechaDevolucionEstimada: Date;
    notasPrestamo?: string | null;
  };
};

export type TicketUpdateInput = {
  id: string; // ID del ticket a actualizar
  titulo?: string;
  descripcionDetallada?: string | null;
  tipoIncidente?: string;
  prioridad?: PrioridadTicket;
  estado?: EstadoTicket;
  solicitanteNombre?: string;
  solicitanteTelefono?: string | null;
  solicitanteCorreo?: string | null;
  contactoId?: string | null;
  empresaId?: string | null;
  sucursalId?: string | null;
  tecnicoAsignadoId?: string | null;
  // creadoPorUsuarioId no se suele actualizar después de la creación, si lo necesitas, agrégalo.
  fechaSolucionEstimada?: Date | null;
  fechaSolucionReal?: Date | null;
  equipoAfectado?: string | null;
};

/**
 * Define los tipos de entrada para las operaciones CRUD de AccionTicket.
 */
export type AccionTicketCreateInput = {
  ticketId: string;
  descripcion: string;
  usuarioId: string; // ID del User que realiza la acción
  categoria?: string | null;
};

/**
 * Tipo para un Ticket con sus relaciones.
 * Se alinea con las interfaces de relación definidas en src/types/ticket.ts si es posible,
 * pero mantiene la estructura completa que devuelve Prisma.
 */
export type TicketWithRelations = Ticket & {
  contacto?: ContactoEmpresa | null;
  empresa?: Empresa | null;
  sucursal?: Sucursal | null;
  creadoPorUsuario?: User | null; // `User?` en el esquema, puede ser null
  tecnicoAsignado?: User | null;
  acciones?: (AccionTicket & { realizadaPor: User | null })[]; // Incluye el usuario que realizó la acción
  equiposEnPrestamo?: (EquipoEnPrestamo & { equipo: EquipoInventario; prestadoAContacto: ContactoEmpresa | null })[]; // prestadoAContacto puede ser null
};

/**
 * Servicio para la gestión de Tickets y Acciones de Ticket.
 * También gestiona las operaciones de EquipoEnPrestamo directamente relacionadas con los tickets.
 */
export class TicketService {

  /**
   * Genera el próximo número de caso único para un ticket.
   * @returns El próximo número de caso.
   */
  static async _generateNextNumeroCaso(): Promise<number> {
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { numeroCaso: 'desc' },
      select: { numeroCaso: true },
    });
    return (lastTicket?.numeroCaso || 0) + 1;
  }

  /**
   * Obtiene todos los tickets, con relaciones opcionales.
   * @param includeRelations Indica si se deben incluir las relaciones comunes.
   * @returns Un array de objetos Ticket o TicketWithRelations.
   */
  static async getTickets(includeRelations: boolean = false): Promise<Ticket[]> {
    try {
      const tickets = await prisma.ticket.findMany({
        // Usamos 'select' explícito para definir explícitamente las propiedades a incluir.
        // Aseguramos que creadoPorUsuarioId esté siempre en el select.
        select: {
          id: true,
          numeroCaso: true,
          titulo: true,
          descripcionDetallada: true,
          tipoIncidente: true,
          prioridad: true,
          estado: true,
          solicitanteNombre: true,
          solicitanteTelefono: true,
          solicitanteCorreo: true,
          contactoId: true,
          empresaId: true,
          sucursalId: true,
          creadoPorUsuarioId: true, // <-- CORRECCIÓN: Siempre incluir el ID escalar
          tecnicoAsignadoId: true,
          fechaCreacion: true,
          fechaSolucionEstimada: true,
          fechaSolucionReal: true,
          updatedAt: true,
          equipoAfectado: true,
          // Incluimos los objetos de relación solo si `includeRelations` es verdadero
          ...(includeRelations && {
            contacto: { select: { id: true, nombreCompleto: true, email: true, telefono: true } },
            empresa: { select: { id: true, nombre: true } },
            sucursal: { select: { id: true, nombre: true } },
            creadoPorUsuario: { select: { id: true, name: true, email: true } }, // Incluir el objeto de relación
            tecnicoAsignado: { select: { id: true, name: true, email: true } },
          }),
        },
        orderBy: { fechaCreacion: 'desc' },
      });
      return tickets as Ticket[];
    } catch (error) {
      console.error("Error al obtener tickets en TicketService:", error);
      throw new Error("No se pudieron obtener los tickets.");
    }
  }

  /**
   * Obtiene un ticket por su ID, incluyendo todas sus relaciones.
   * @param id El ID del ticket.
   * @returns El objeto TicketWithRelations o null si no se encuentra.
   */
  static async getTicketById(id: string): Promise<TicketWithRelations | null> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          contacto: true,
          empresa: true,
          sucursal: true,
          creadoPorUsuario: true, // Incluir el objeto de relación
          tecnicoAsignado: true,
          acciones: {
            orderBy: { fechaAccion: 'desc' },
            include: { realizadaPor: true }
          },
          equiposEnPrestamo: {
            include: { equipo: true, prestadoAContacto: true }
          },
        },
      });
      return ticket;
    } catch (error) {
      console.error(`Error al obtener ticket con ID ${id} en TicketService:`, error);
      throw new Error("No se pudo obtener el ticket.");
    }
  }

  /**
   * Crea un nuevo ticket, opcionalmente con un registro de préstamo de equipo.
   * Utiliza una transacción para asegurar la atomicidad.
   * @param data Los datos para crear el ticket.
   * @returns El objeto Ticket creado.
   */
  static async createTicket(data: TicketCreateInput): Promise<Ticket> {
    try {
      const newTicket = await prisma.$transaction(async (tx) => {
        // Generar numeroCaso si no se proporciona (ej. para creación individual)
        const numeroCaso = data.numeroCaso || await this._generateNextNumeroCaso();

        const ticket = await tx.ticket.create({
          data: {
            numeroCaso: numeroCaso,
            titulo: data.titulo,
            descripcionDetallada: data.descripcionDetallada,
            tipoIncidente: data.tipoIncidente,
            prioridad: data.prioridad,
            estado: data.estado,
            solicitanteNombre: data.solicitanteNombre,
            solicitanteTelefono: data.solicitanteTelefono,
            solicitanteCorreo: data.solicitanteCorreo,
            // <-- CORRECCIÓN: Usar el spread operator condicional para propiedades opcionales
            ...(data.contactoId && { contacto: { connect: { id: data.contactoId } } }),
            ...(data.empresaId && { empresa: { connect: { id: data.empresaId } } }),
            ...(data.sucursalId && { sucursal: { connect: { id: data.sucursalId } } }),
            creadoPorUsuario: { connect: { id: data.creadoPorUsuarioId } }, // Usar connect para relación User
            ...(data.tecnicoAsignadoId && { tecnicoAsignado: { connect: { id: data.tecnicoAsignadoId } } }),
            
            fechaSolucionEstimada: data.fechaSolucionEstimada,
            equipoAfectado: data.equipoAfectado,
          },
        });

        // Si se proporciona información de préstamo de equipo, crear el registro de préstamo
        if (data.equipoPrestamo) {
          await tx.equipoEnPrestamo.create({
            data: {
              equipo: { connect: { id: data.equipoPrestamo.equipoId } },
              prestadoAContacto: { connect: { id: data.equipoPrestamo.prestadoAContactoId } },
              personaResponsableEnSitio: data.equipoPrestamo.personaResponsableEnSitio,
              fechaPrestamo: new Date(), // Fecha actual
              fechaDevolucionEstimada: data.equipoPrestamo.fechaDevolucionEstimada,
              estadoPrestamo: EstadoPrestamoEquipo.PRESTADO,
              ticketAsociado: { connect: { id: ticket.id } }, // Vincular al ticket recién creado
              notasPrestamo: data.equipoPrestamo.notasPrestamo,
            },
          });
          // Opcional: Actualizar el estado del equipo a "PRESTADO" en EquipoInventario
          await tx.equipoInventario.update({
            where: { id: data.equipoPrestamo.equipoId },
            data: { estadoEquipo: EstadoEquipoInventario.PRESTADO },
          });
        }
        return ticket;
      });
      return newTicket;
    } catch (error) {
      console.error("Error al crear ticket en TicketService:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && error.meta?.target === 'Ticket_numeroCaso_key') {
          throw new Error("Error al crear ticket: El número de caso ya existe. Intente nuevamente.");
        }
      }
      throw new Error("Error al crear el ticket. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Actualiza un ticket existente.
   * @param data Los datos para actualizar el ticket (incluyendo el ID).
   * @returns El objeto Ticket actualizado.
   */
  static async updateTicket(data: TicketUpdateInput): Promise<Ticket> {
    try {
      const updatedTicket = await prisma.$transaction(async (tx) => {
        // Corregido: Usar spread operator condicional para propiedades opcionales
        const updateData: Prisma.TicketUpdateInput = {
          titulo: data.titulo,
          descripcionDetallada: data.descripcionDetallada,
          tipoIncidente: data.tipoIncidente,
          prioridad: data.prioridad,
          estado: data.estado,
          solicitanteNombre: data.solicitanteNombre,
          solicitanteTelefono: data.solicitanteTelefono,
          solicitanteCorreo: data.solicitanteCorreo,
          
          ...(data.contactoId !== undefined ? (data.contactoId === null ? { contacto: { disconnect: true } } : { contacto: { connect: { id: data.contactoId } } }) : {}),
          ...(data.empresaId !== undefined ? (data.empresaId === null ? { empresa: { disconnect: true } } : { empresa: { connect: { id: data.empresaId } } }) : {}),
          ...(data.sucursalId !== undefined ? (data.sucursalId === null ? { sucursal: { disconnect: true } } : { sucursal: { connect: { id: data.sucursalId } } }) : {}),
          // Para tecnicoAsignado, usa el mismo patrón ya que es una relación User opcional.
          ...(data.tecnicoAsignadoId !== undefined ? (data.tecnicoAsignadoId === null ? { tecnicoAsignado: { disconnect: true } } : { tecnicoAsignado: { connect: { id: data.tecnicoAsignadoId } } }) : {}),
          
          fechaSolucionEstimada: data.fechaSolucionEstimada,
          fechaSolucionReal: data.fechaSolucionReal,
          equipoAfectado: data.equipoAfectado,
        };

        const ticket = await tx.ticket.update({
          where: { id: data.id },
          data: updateData,
        });
        return ticket;
      });
      return updatedTicket;
    } catch (error) {
      console.error(`Error al actualizar ticket con ID ${data.id} en TicketService:`, error);
      throw new Error("Error al actualizar el ticket. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Elimina un ticket.
   * También eliminará sus AccionTicket asociados (por CASCADE en Prisma).
   * Antes de eliminar, desvincula cualquier EquipoEnPrestamo.
   * @param id El ID del ticket a eliminar.
   * @returns Un objeto de éxito o error.
   */
  static async deleteTicket(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await prisma.$transaction(async (tx) => {
        // Desvincular cualquier EquipoEnPrestamo asociado a este ticket
        await tx.equipoEnPrestamo.updateMany({
          where: { ticketId: id },
          data: { ticketId: null }
        });

        // Eliminar el ticket (esto eliminará las AccionTicket por CASCADE)
        await tx.ticket.delete({
          where: { id },
        });
      });
      return { success: true, message: "Ticket eliminado exitosamente." };
    } catch (error) {
      console.error(`Error al eliminar ticket con ID ${id} en TicketService:`, error);
      throw new Error("Error al eliminar el ticket. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Añade una nueva acción a un ticket.
   * @param data Los datos de la nueva acción.
   * @returns El objeto AccionTicket creado.
   */
  static async addAccionToTicket(data: AccionTicketCreateInput): Promise<AccionTicket> {
    try {
      const newAccion = await prisma.accionTicket.create({
        data: {
          ticket: { connect: { id: data.ticketId } },
          descripcion: data.descripcion,
          realizadaPor: { connect: { id: data.usuarioId } },
          categoria: data.categoria,
        },
      });
      return newAccion;
    } catch (error) {
      console.error("Error al añadir acción a ticket en TicketService:", error);
      throw new Error("Error al añadir acción al ticket. Detalles: " + (error as Error).message);
    }
  }

  /**
   * Obtiene todas las acciones de un ticket específico.
   * @param ticketId El ID del ticket.
   * @returns Un array de objetos AccionTicket.
   */
  static async getAccionesByTicketId(ticketId: string): Promise<AccionTicket[]> {
    try {
      const acciones = await prisma.accionTicket.findMany({
        where: { ticketId },
        orderBy: { fechaAccion: 'asc' },
        include: { realizadaPor: true }
      });
      return acciones;
    } catch (error) {
      console.error(`Error al obtener acciones para el ticket ${ticketId} en TicketService:`, error);
      throw new Error("No se pudieron obtener las acciones del ticket.");
    }
  }

  /**
   * **Implementación para carga masiva de tickets.**
   * Esta función recibirá un array de datos de tickets y los creará en una transacción.
   * Se asume que los datos ya vienen validados y preprocesados.
   * @param ticketsData Array de datos de tickets para importar.
   * @returns Un objeto con el recuento de tickets importados.
   */
  static async importTicketsMassive(ticketsData: TicketCreateInput[]): Promise<{ count: number }> {
    try {
      // Corregido: Eliminar las opciones (maxWait, timeout) cuando se pasa un array de operaciones.
      // Estas opciones son solo para la sobrecarga de $transaction con un callback.
      const results = await prisma.$transaction(
        ticketsData.map(data => {
          const numeroCaso = data.numeroCaso === undefined || data.numeroCaso === 0
            ? 0 // Placeholder, idealmente se generaría aquí o se validaría que ya viene.
            : data.numeroCaso;

          return prisma.ticket.create({
            data: {
              numeroCaso: numeroCaso,
              titulo: data.titulo,
              descripcionDetallada: data.descripcionDetallada,
              tipoIncidente: data.tipoIncidente,
              prioridad: data.prioridad,
              estado: data.estado,
              solicitanteNombre: data.solicitanteNombre,
              solicitanteTelefono: data.solicitanteTelefono,
              solicitanteCorreo: data.solicitanteCorreo,
              // Corregido: Usar spread operator condicional para propiedades opcionales.
              ...(data.contactoId && { contacto: { connect: { id: data.contactoId } } }),
              ...(data.empresaId && { empresa: { connect: { id: data.empresaId } } }),
              ...(data.sucursalId && { sucursal: { connect: { id: data.sucursalId } } }),
              creadoPorUsuario: { connect: { id: data.creadoPorUsuarioId } }, // Ya que es requerido y está en el esquema
              ...(data.tecnicoAsignadoId && { tecnicoAsignado: { connect: { id: data.tecnicoAsignadoId } } }),
              fechaSolucionEstimada: data.fechaSolucionEstimada,
              equipoAfectado: data.equipoAfectado,
            }
          });
        })
        // No hay segundo argumento para opciones aquí.
      );
      return { count: results.length };
    } catch (error) {
      console.error("Error en importTicketsMassive en TicketService:", error);
      throw new Error("Error al importar tickets masivamente. Detalles: " + (error as Error).message);
    }
  }

  // Métodos para EquipoInventario y EquipoEnPrestamo (inicialmente aquí, se pueden mover a equipoService.ts)

  /**
   * Obtiene todos los equipos en inventario.
   * @returns Un array de objetos EquipoInventario.
   */
  static async getEquiposInventario(): Promise<EquipoInventario[]> {
    try {
      return await prisma.equipoInventario.findMany({
        orderBy: { nombreDescriptivo: 'asc' },
      });
    }
    catch (error) {
      console.error("Error al obtener equipos de inventario en TicketService:", error);
      throw new Error("No se pudieron obtener los equipos de inventario.");
    }
  }

  /**
   * Obtiene los préstamos de equipos.
   * @returns Un array de objetos EquipoEnPrestamo.
   */
  static async getEquiposEnPrestamo(): Promise<EquipoEnPrestamo[]> {
    try {
      const prestamos = await prisma.equipoEnPrestamo.findMany({
        // Usamos 'include' con 'true' si queremos todos los campos de la relación,
        // o 'select' si queremos campos específicos. Ambos son válidos aquí.
        include: {
          equipo: true,
          prestadoAContacto: true,
          ticketAsociado: true,
        },
        orderBy: { fechaPrestamo: 'desc' },
      });
      return prestamos;
    } catch (error) {
      console.error("Error al obtener equipos en préstamo en TicketService:", error);
      throw new Error("No se pudieron obtener los equipos en préstamo.");
    }
  }
}
