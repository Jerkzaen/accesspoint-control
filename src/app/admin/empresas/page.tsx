// RUTA: src/app/actions/empresaActions.ts
'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// CORRECCIÓN CLAVE AQUÍ:
// 1. Importar el namespace 'Prisma' para tipos de operación (ej. Prisma.DireccionUpdateInput),
//    y para Prisma.TransactionClient.
// 2. Importar PrismaClientKnownRequestError directamente, ya que es una CLASE que se usa en runtime (con 'instanceof').
import { Prisma, PrismaClientKnownRequestError } from '@prisma/client';

// Para obtener los TIPOS de los modelos de Prisma, usamos Prisma.ModelNameGetPayload<{}>.
// Esto es la forma más segura y explícita de obtener los tipos de los modelos
// con sus relaciones incluidas si las especificas.
type PrismaEmpresaType = Prisma.EmpresaGetPayload<{}>;
type PrismaDireccionType = Prisma.DireccionGetPayload<{}>;
type PrismaComunaType = Prisma.ComunaGetPayload<{}>;

// Tipo para la Empresa con su relación de Dirección Comercial,
// AHORA INCLUYE LA COMUNA ANIDADA.
// Usamos los tipos auxiliares definidos arriba.
export type EmpresaWithDireccion = PrismaEmpresaType & { 
  direccionComercial: (PrismaDireccionType & { comuna?: PrismaComunaType | null }) | null;
};

// Tipo de entrada para la creación/actualización de Empresa.
// Los campos de 'data' en Prisma son opcionales para la actualización,
// por eso los definimos como 'string | null | undefined'.
export type EmpresaInput = {
  nombre: string;
  rut?: string | null;
  logoUrl?: string | null; 
  telefono?: string | null;
  email?: string | null;
  // Permitimos que los campos de dirección sean string | null en el input del frontend
  direccion?: {
    calle?: string | null; 
    numero?: string | null; 
    comunaId?: string | null; 
  } | null; // El objeto completo puede ser null si se quiere eliminar la dirección
};

// Resultado de la operación de obtener empresas
type GetEmpresasResult = { success: true; data: EmpresaWithDireccion[] } | { success: false; error: string };

/**
 * Obtiene todas las empresas con sus direcciones comerciales asociadas,
 * incluyendo la información de la comuna de esa dirección.
 * @returns Un objeto con éxito y los datos de las empresas, o un error.
 */
export async function getEmpresas(): Promise<GetEmpresasResult> {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { nombre: 'asc' },
      include: { 
        direccionComercial: { // Incluimos la relación de dirección comercial
          include: {
            comuna: true // Y dentro de ella, incluimos la comuna
          }
        } 
      }, 
    });
    // Realizamos un casting seguro porque sabemos que Prisma incluirá la comuna
    const typedEmpresas: EmpresaWithDireccion[] = empresas as EmpresaWithDireccion[]; 
    return { success: true, data: typedEmpresas };
  } catch (error: any) {
    console.error("Error al obtener empresas:", error);
    return { success: false, error: "Error al obtener empresas." };
  }
}

/**
 * Añade una nueva empresa, manejando la creación o vinculación de su dirección comercial.
 * @param data Los datos de la nueva empresa, incluyendo opcionalmente la dirección.
 * @returns Un objeto con éxito y los datos de la empresa creada, o un error.
 */
export async function addEmpresa(data: EmpresaInput) {
  try {
    let newDireccionId: string | undefined;

    // Si se proporciona información de dirección y al menos un campo relevante
    if (data.direccion && (data.direccion.calle !== undefined || data.direccion.numero !== undefined || data.direccion.comunaId !== undefined)) {
      // Antes de crear, verificamos si la comunaId es válida y requerida.
      if (!data.direccion.comunaId) {
        return { success: false, error: "La Comuna es requerida para la dirección comercial si se proporcionan otros detalles de dirección." };
      }
      // Acceder al modelo de Prisma directamente a través de 'prisma.comuna'.
      const comunaExists = await prisma.comuna.findUnique({
        where: { id: data.direccion.comunaId },
        select: { id: true }
      });
      if (!comunaExists) {
        return { success: false, error: `La Comuna con ID ${data.direccion.comunaId} no existe.` };
      }

      const createdDireccion = await prisma.direccion.create({
          data: {
            // Acceder al modelo de Prisma directamente para 'connect'.
            comuna: { connect: { id: data.direccion.comunaId } }, // ComunaId ya validada
            // Aseguramos que 'calle' y 'numero' sean siempre string.
            // Si el valor del input es null o undefined, se convierte a '' (string vacío).
            calle: data.direccion.calle ?? '', 
            numero: data.direccion.numero ?? '', 
          },
        });
        newDireccionId = createdDireccion.id;
    }

    const newEmpresa = await prisma.empresa.create({
      data: {
        nombre: data.nombre,
        rut: data.rut,
        logoUrl: data.logoUrl,
        telefono: data.telefono,
        email: data.email,
        // Conecta la dirección recién creada (si existe)
        direccionComercial: newDireccionId ? { connect: { id: newDireccionId } } : undefined,
      },
      include: { 
        direccionComercial: { // Incluimos la relación de dirección comercial
          include: {
            comuna: true // Y dentro de ella, incluimos la comuna para la respuesta
          }
        }
      }
    });

    revalidatePath('/admin/empresas'); // Revalida la ruta para actualizar la UI
    return { success: true, data: newEmpresa as EmpresaWithDireccion }; 
  } catch (error: any) {
    console.error("Error al añadir empresa:", error);
    // Usamos 'instanceof PrismaClientKnownRequestError' directamente
    if (error instanceof PrismaClientKnownRequestError) {
      // Aseguramos que 'meta' y 'target' existan y sea un array antes de usar 'includes'
      if (error.code === 'P2002' && Array.isArray(error.meta?.target) && error.meta.target.includes('nombre')) {
        return { success: false, error: "Ya existe una empresa con ese nombre." };
      }
       if (error.code === 'P2003') { // Foreign key constraint violation
        return { success: false, error: "Error de datos: Comuna o ID de relación inválido." };
      }
    }
    return { success: false, error: "Error al añadir empresa." };
  }
}

/**
 * Actualiza una empresa existente, manejando su dirección comercial.
 * @param id El ID de la empresa a actualizar.
 * @param data Los datos a actualizar de la empresa, incluyendo opcionalmente la dirección.
 * @returns Un objeto con éxito y los datos de la empresa actualizada, o un error.
 */
export async function updateEmpresa(id: string, data: EmpresaInput) {
  try {
    let updatedDireccionId: string | undefined | null;
    
    // Obtiene la empresa existente para verificar su dirección actual
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id },
      include: { direccionComercial: true } // Necesitamos la dirección completa para lógica de eliminación/actualización
    });

    if (!existingEmpresa) {
      return { success: false, error: "Empresa no encontrada para actualizar." };
    }

    // Determinar si se enviaron datos de dirección o si se quiere eliminar la dirección existente
    const hasNewDireccionData = data.direccion && (data.direccion.calle !== undefined || data.direccion.numero !== undefined || data.direccion.comunaId !== undefined);
    
    if (hasNewDireccionData) {
        // Validar que la comunaId sea válida si se proporciona
        if (!data.direccion?.comunaId) { // Si se proporcionan otros campos de dirección pero no la comunaId
            return { success: false, error: "La Comuna es requerida para la dirección comercial si se proporcionan otros detalles de dirección." };
        }
        const comunaExists = await prisma.comuna.findUnique({
            where: { id: data.direccion.comunaId },
            select: { id: true }
        });
        if (!comunaExists) {
            return { success: false, error: `La Comuna con ID ${data.direccion.comunaId} no existe.` };
        }

      if (existingEmpresa.direccionComercialId) {
        // Si ya tiene una dirección, la actualiza
        // Usamos Prisma.DireccionUpdateInput para tipar el objeto 'data' para el update de Prisma
        const updateDireccionData: Prisma.DireccionUpdateInput = {};

        // Solo actualizamos si el campo fue explícitamente provisto (no undefined)
        // Convertimos null a string vacío si es necesario, ya que calle y numero son requeridos en el schema
        if (data.direccion.calle !== undefined) {
          updateDireccionData.calle = data.direccion.calle === null ? '' : data.direccion.calle;
        }
        if (data.direccion.numero !== undefined) {
          updateDireccionData.numero = data.direccion.numero === null ? '' : data.direccion.numero;
        }
        if (data.direccion.comunaId !== undefined) { // Aunque ya sabemos que no será undefined aquí por la validación anterior
            updateDireccionData.comuna = { connect: { id: data.direccion.comunaId } };
        }
        
        const updatedDireccion = await prisma.direccion.update({
          where: { id: existingEmpresa.direccionComercialId },
          data: updateDireccionData,
        });
        updatedDireccionId = updatedDireccion.id;
      } else {
        // Si no tenía dirección, crea una nueva. Se asume que data.direccion.comunaId no es null aquí.
        const createdDireccion = await prisma.direccion.create({
          data: {
            comuna: { connect: { id: data.direccion.comunaId } }, // ComunaId ya validada
            // Aseguramos que 'calle' y 'numero' sean siempre string.
            calle: data.direccion.calle ?? '', 
            numero: data.direccion.numero ?? '', 
          },
        });
        updatedDireccionId = createdDireccion.id;
      }
    } else if (existingEmpresa.direccionComercialId && data.direccion === null) {
      // Si se envía data.direccion explícitamente como null, se interpreta como eliminación de la dirección
      await prisma.empresa.update({
        where: { id },
        data: {
          direccionComercial: { disconnect: true }
        }
      });
      await prisma.direccion.delete({
        where: { id: existingEmpresa.direccionComercialId }
      });
      updatedDireccionId = null; // Establecer a null para indicar que ya no tiene dirección
    } else {
      // Si no hay nueva data.direccion (undefined) y la empresa tenía una, mantenerla.
      // Si no hay nueva data.direccion (undefined) y la empresa no tenía una, mantener null.
      updatedDireccionId = existingEmpresa.direccionComercialId; 
    }

    // Usamos Prisma.EmpresaUpdateInput para tipar el objeto 'data' para el update de Prisma
    const updateEmpresaData: Prisma.EmpresaUpdateInput = {
        nombre: data.nombre !== undefined ? data.nombre : existingEmpresa.nombre,
        rut: data.rut !== undefined ? data.rut : existingEmpresa.rut,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : existingEmpresa.logoUrl,
        telefono: data.telefono !== undefined ? data.telefono : existingEmpresa.telefono,
        email: data.email !== undefined ? data.email : existingEmpresa.email,       
        // Conecta o desconecta la dirección basada en updatedDireccionId
        direccionComercial: updatedDireccionId ? { connect: { id: updatedDireccionId } } : (updatedDireccionId === null ? { disconnect: true } : undefined),
    };

    const updatedEmpresa = await prisma.empresa.update({
      where: { id },
      data: updateEmpresaData,
      include: { 
        direccionComercial: { // Incluimos la relación de dirección comercial
          include: {
            comuna: true // Y dentro de ella, incluimos la comuna para la respuesta
          }
        }
      }
    });

    revalidatePath('/admin/empresas'); // Revalida la ruta para actualizar la UI
    return { success: true, data: updatedEmpresa as EmpresaWithDireccion };
  } catch (error: any) {
    console.error("Error al actualizar empresa:", error);
    // Usamos 'instanceof PrismaClientKnownRequestError' directamente
    if (error instanceof PrismaClientKnownRequestError) {
      // Aseguramos que 'meta' y 'target' existan y sea un array antes de usar 'includes'
      if (error.code === 'P2002' && Array.isArray(error.meta?.target) && error.meta.target.includes('nombre')) {
        return { success: false, error: "Ya existe una empresa con ese nombre." };
      }
      if (error.code === 'P2003') { // Foreign key constraint violation
        return { success: false, error: "Error de datos: Comuna o ID de relación inválido." };
      }
    }
    return { success: false, error: "Error desconocido al actualizar empresa." };
  }
}

/**
 * Elimina una empresa por su ID, y también elimina su dirección comercial asociada si existe.
 * @param id El ID de la empresa a eliminar.
 * @returns Un objeto con éxito o un error.
 */
export async function deleteEmpresa(id: string) {
  try {
    // Obtiene la dirección comercialId antes de eliminar la empresa
    const empresaToDelete = await prisma.empresa.findUnique({
      where: { id },
      select: { direccionComercialId: true }
    });

    // Iniciar una transacción para asegurar atomicidad
    // Tipamos 'tx' explícitamente usando el tipo del namespace Prisma.
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Primero, buscar y desconectar cualquier sucursal vinculada a esta empresa
      // Esto es crucial para evitar errores de restricción de clave externa si la empresa tiene sucursales.
      await tx.sucursal.updateMany({
        where: { empresaId: id },
        data: { empresaId: null } // Desvincula las sucursales de la empresa
      });

      // Luego, buscar y desconectar cualquier contacto de empresa vinculado
      await tx.contactoEmpresa.updateMany({
        where: { empresaId: id },
        data: { empresaId: null } // Desvincula los contactos de la empresa
      });

      // Finalmente, buscar y desconectar cualquier ticket vinculado
      await tx.ticket.updateMany({
        where: { empresaId: id },
        data: { empresaId: null } // Desvincula los tickets de la empresa
      });

      // Ahora sí, eliminar la empresa
      await tx.empresa.delete({
        where: { id },
      });

      // Si la empresa tenía una dirección comercial, se elimina también ese registro de dirección
      if (empresaToDelete?.direccionComercialId) {
        await tx.direccion.delete({
          where: { id: empresaToDelete.direccionComercialId }
        });
      }
    });

    revalidatePath('/admin/empresas'); // Revalida la ruta para actualizar la UI
    return { success: true };
  } catch (error: any) { // Captura el error para proporcionar un mensaje específico
    console.error("Error al eliminar empresa:", error);
    // Usamos 'instanceof PrismaClientKnownRequestError' directamente
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2003') { // Falla de llave foránea genérica (si la desconexión anterior no fue suficiente)
        return { success: false, error: "Error al eliminar: Hay registros relacionados (sucursales, contactos o tickets) que impiden la eliminación. Intente desvincularlos manualmente si el problema persiste." };
      }
      if (error.code === 'P2025') { // Record not found
        return { success: false, error: "La empresa que intentas eliminar no fue encontrada." };
      }
    }
    return { success: false, error: "Error desconocido al eliminar empresa." };
  }
}
