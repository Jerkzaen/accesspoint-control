// src/services/__tests__/contactoEmpresaService.test.ts

// Importamos el servicio que vamos a probar
import { ContactoEmpresaService, ContactoEmpresaCreateInput, ContactoEmpresaUpdateInput } from '../contactoEmpresaService';
import { prisma } from '../../lib/prisma';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, Prisma } from '@prisma/client';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    contactoEmpresa: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    equipoEnPrestamo: {
      count: vi.fn(),
    },
    ticket: {
      count: vi.fn(),
    },
    $transaction: vi.fn((callback: (prisma: Prisma.TransactionClient) => Promise<any>) => callback(mockPrisma as any)),
    $disconnect: vi.fn(),
  },
}));

const mockPrisma = prisma as unknown as vi.Mocked<typeof prisma>;

describe('ContactoEmpresaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDate = new Date();
  const mockEmpresaId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d01'; // UUID válido
  const mockUbicacionId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d04'; // UUID válido
  const mockContactoId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d10'; // UUID válido para contacto

  const mockEmpresa = {
    id: mockEmpresaId,
    nombre: 'Empresa Test',
    email: null,
    createdAt: mockDate,
    updatedAt: mockDate,
    telefono: null,
    rut: '12345678-9',
    logoUrl: null,
    direccionPrincipalId: null,
  };

  const mockUbicacion = {
    id: mockUbicacionId,
    nombreReferencial: 'Ubicacion Test',
    createdAt: mockDate,
    updatedAt: mockDate,
    sucursalId: null,
    direccionId: null,
  };

  const mockExistingContacto = {
    id: mockContactoId,
    nombreCompleto: 'Juan Perez',
    email: 'juan.perez@test.com',
    telefono: '987654321',
    cargo: 'Gerente',
    empresaId: mockEmpresaId,
    ubicacionId: mockUbicacionId,
    createdAt: mockDate,
    updatedAt: mockDate,
    empresa: mockEmpresa,
    ubicacion: mockUbicacion,
  };

  // --- Pruebas para getContactosEmpresa ---
  describe('getContactosEmpresa', () => {
    it('debe retornar una lista de contactos de empresa ordenados alfabéticamente', async () => {
      const mockContactos = [
        { ...mockExistingContacto, id: '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d11', nombreCompleto: 'Contacto B' },
        { ...mockExistingContacto, id: mockContactoId, nombreCompleto: 'Contacto A' },
      ];
      (mockPrisma.contactoEmpresa.findMany as vi.Mock).mockResolvedValue(mockContactos as any);

      const contactos = await ContactoEmpresaService.getContactosEmpresa();

      expect(mockPrisma.contactoEmpresa.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.contactoEmpresa.findMany).toHaveBeenCalledWith({
        include: { empresa: false, ubicacion: false }, // Se pasa false por defecto
        orderBy: { nombreCompleto: 'asc' },
      });
      expect(contactos).toEqual(mockContactos);
    });

    it('debe incluir las relaciones si se solicita', async () => {
      const mockContactoWithRelations = {
        ...mockExistingContacto,
        empresa: mockEmpresa,
        ubicacion: mockUbicacion,
      };
      (mockPrisma.contactoEmpresa.findMany as vi.Mock).mockResolvedValue([mockContactoWithRelations] as any);

      const contactos = await ContactoEmpresaService.getContactosEmpresa(true);

      expect(mockPrisma.contactoEmpresa.findMany).toHaveBeenCalledWith({
        include: { empresa: true, ubicacion: true },
        orderBy: { nombreCompleto: 'asc' },
      });
      expect(contactos[0]).toHaveProperty('empresa');
      expect(contactos[0]).toHaveProperty('ubicacion');
    });

    it('debe manejar errores cuando Prisma falla al obtener contactos', async () => {
      (mockPrisma.contactoEmpresa.findMany as vi.Mock).mockRejectedValue(new Error('DB Error'));
      await expect(ContactoEmpresaService.getContactosEmpresa()).rejects.toThrow('No se pudieron obtener los contactos de empresa.');
    });
  });

  // --- Pruebas para getContactoEmpresaById ---
  describe('getContactoEmpresaById', () => {
    it('debe retornar un contacto por su ID con todas las relaciones', async () => {
      const mockContactoWithAllRelations = {
        ...mockExistingContacto,
        empresa: { id: mockEmpresaId, nombre: 'Empresa Test' },
        ubicacion: { id: mockUbicacionId, nombreReferencial: 'Ubicacion Test' },
      };
      (mockPrisma.contactoEmpresa.findUnique as vi.Mock).mockResolvedValue(mockContactoWithAllRelations as any);

      const contacto = await ContactoEmpresaService.getContactoEmpresaById(mockContactoId);

      expect(mockPrisma.contactoEmpresa.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.contactoEmpresa.findUnique).toHaveBeenCalledWith({
        where: { id: mockContactoId },
        include: { empresa: true, ubicacion: true },
      });
      expect(contacto).toEqual(mockContactoWithAllRelations);
    });

    it('debe retornar null si el contacto no se encuentra', async () => {
      (mockPrisma.contactoEmpresa.findUnique as vi.Mock).mockResolvedValue(null as any);
      const contacto = await ContactoEmpresaService.getContactoEmpresaById('0a1c5d2c-5958-4a14-ad8e-1a5046bb5d99');
      expect(contacto).toBeNull();
    });

    it('debe manejar errores cuando Prisma falla al obtener contacto por ID', async () => {
      (mockPrisma.contactoEmpresa.findUnique as vi.Mock).mockRejectedValue(new Error('DB Error'));
      await expect(ContactoEmpresaService.getContactoEmpresaById(mockContactoId)).rejects.toThrow('No se pudo obtener el contacto de empresa.');
    });
  });

  // --- Pruebas para createContactoEmpresa ---
  describe('createContactoEmpresa', () => {
    const newContactoData: ContactoEmpresaCreateInput = {
      nombreCompleto: 'Nuevo Contacto',
      email: 'nuevo.contacto@test.com',
      telefono: '123123123',
      cargo: 'Analista',
      empresaId: mockEmpresaId,
      ubicacionId: mockUbicacionId,
    };

    it('debe crear un nuevo contacto de empresa y retornar el objeto creado', async () => {
      (mockPrisma.contactoEmpresa.create as vi.Mock).mockResolvedValue({
        ...mockExistingContacto,
        id: '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d12',
        ...newContactoData,
      } as any);

      const contacto = await ContactoEmpresaService.createContactoEmpresa(newContactoData);

      expect(mockPrisma.contactoEmpresa.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.contactoEmpresa.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nombreCompleto: newContactoData.nombreCompleto,
          email: newContactoData.email,
          telefono: newContactoData.telefono,
          cargo: newContactoData.cargo,
          empresa: { connect: { id: newContactoData.empresaId } },
          ubicacion: { connect: { id: newContactoData.ubicacionId } },
        }),
      });
      expect(contacto).toHaveProperty('id', '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d12');
      expect(contacto).toHaveProperty('nombreCompleto', 'Nuevo Contacto');
    });

    it('debe crear un contacto sin empresa y ubicación si no se proporcionan IDs', async () => {
      const dataWithoutRelations = { ...newContactoData, empresaId: null, ubicacionId: null };
      (mockPrisma.contactoEmpresa.create as vi.Mock).mockResolvedValue({
        ...mockExistingContacto,
        id: '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d13',
        ...dataWithoutRelations,
      } as any);

      const contacto = await ContactoEmpresaService.createContactoEmpresa(dataWithoutRelations);

      expect(mockPrisma.contactoEmpresa.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ empresa: expect.anything(), ubicacion: expect.anything() }),
        })
      );
      expect(contacto).toHaveProperty('id', '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d13');
    });

    it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
      const invalidData = { ...newContactoData, nombreCompleto: 'a' }; // Nombre muy corto
      await expect(ContactoEmpresaService.createContactoEmpresa(invalidData as any)).rejects.toThrow('Error de validación al crear contacto: El nombre completo es requerido.');
      expect(mockPrisma.contactoEmpresa.create).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Prisma por email duplicado', async () => {
      (mockPrisma.contactoEmpresa.create as vi.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));
      await expect(ContactoEmpresaService.createContactoEmpresa(newContactoData)).rejects.toThrow('Error al crear contacto: El correo electrónico ya existe.');
    });

    it('debe manejar otros errores de Prisma al crear contacto', async () => {
      (mockPrisma.contactoEmpresa.create as vi.Mock).mockRejectedValue(new Error('Other DB Error'));
      await expect(ContactoEmpresaService.createContactoEmpresa(newContactoData)).rejects.toThrow('Error al crear el contacto de empresa. Detalles: Other DB Error');
    });
  });

  // --- Pruebas para updateContactoEmpresa ---
  describe('updateContactoEmpresa', () => {
    it('debe actualizar los campos del contacto y retornar el objeto actualizado', async () => {
      const updateData: ContactoEmpresaUpdateInput = {
        id: mockContactoId,
        nombreCompleto: 'Contacto Actualizado',
        telefono: '999888777',
      };
      (mockPrisma.contactoEmpresa.update as vi.Mock).mockResolvedValue({ ...mockExistingContacto, ...updateData } as any);

      const contacto = await ContactoEmpresaService.updateContactoEmpresa(updateData);

      expect(mockPrisma.contactoEmpresa.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.contactoEmpresa.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          nombreCompleto: 'Contacto Actualizado',
          telefono: '999888777',
        }),
      });
      expect(contacto).toHaveProperty('nombreCompleto', 'Contacto Actualizado');
    });

    it('debe desvincular la empresa si empresaId se envía como null', async () => {
      const updateData: ContactoEmpresaUpdateInput = {
        id: mockContactoId,
        empresaId: null,
      };
      (mockPrisma.contactoEmpresa.update as vi.Mock).mockResolvedValue({ ...mockExistingContacto, empresaId: null } as any);

      const contacto = await ContactoEmpresaService.updateContactoEmpresa(updateData);

      expect(mockPrisma.contactoEmpresa.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          empresa: { disconnect: true },
        }),
      });
      expect(contacto).toHaveProperty('empresaId', null);
    });

    it('debe desvincular la ubicación si ubicacionId se envía como null', async () => {
      const updateData: ContactoEmpresaUpdateInput = {
        id: mockContactoId,
        ubicacionId: null,
      };
      (mockPrisma.contactoEmpresa.update as vi.Mock).mockResolvedValue({ ...mockExistingContacto, ubicacionId: null } as any);

      const contacto = await ContactoEmpresaService.updateContactoEmpresa(updateData);

      expect(mockPrisma.contactoEmpresa.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          ubicacion: { disconnect: true },
        }),
      });
      expect(contacto).toHaveProperty('ubicacionId', null);
    });

    it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
      const invalidData = { ...mockExistingContacto, id: mockContactoId, email: 'invalid-email' };
      await expect(ContactoEmpresaService.updateContactoEmpresa(invalidData as any)).rejects.toThrow('Error de validación al actualizar contacto: Formato de correo electrónico inválido.');
      expect(mockPrisma.contactoEmpresa.update).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Prisma por email duplicado al actualizar', async () => {
      (mockPrisma.contactoEmpresa.update as vi.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));
      await expect(ContactoEmpresaService.updateContactoEmpresa({ id: mockContactoId, email: 'duplicate@test.com' })).rejects.toThrow('El correo electrónico ya existe.');
    });

    it('debe manejar otros errores de Prisma al actualizar contacto', async () => {
      (mockPrisma.contactoEmpresa.update as vi.Mock).mockRejectedValue(new Error('Update DB Error'));
      await expect(ContactoEmpresaService.updateContactoEmpresa({ id: mockContactoId, nombreCompleto: 'Fail' })).rejects.toThrow('Error al actualizar el contacto de empresa. Detalles: Update DB Error');
    });
  });

  // --- Pruebas para deleteContactoEmpresa ---
  describe('deleteContactoEmpresa', () => {
    it('debe eliminar un contacto de empresa si no tiene préstamos ni tickets asociados', async () => {
      (mockPrisma.equipoEnPrestamo.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.ticket.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.contactoEmpresa.delete as vi.Mock).mockResolvedValue({} as any);

      const result = await ContactoEmpresaService.deleteContactoEmpresa(mockContactoId);

      expect(mockPrisma.equipoEnPrestamo.count).toHaveBeenCalledWith({ where: { prestadoAContactoId: mockContactoId } });
      expect(mockPrisma.ticket.count).toHaveBeenCalledWith({ where: { contactoId: mockContactoId } });
      expect(mockPrisma.contactoEmpresa.delete).toHaveBeenCalledWith({ where: { id: mockContactoId } });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Contacto de empresa eliminado exitosamente.');
    });

    it('NO debe eliminar el contacto si tiene equipos prestados asociados', async () => {
      (mockPrisma.equipoEnPrestamo.count as vi.Mock).mockResolvedValue(1); // Simula 1 préstamo
      await expect(ContactoEmpresaService.deleteContactoEmpresa(mockContactoId)).rejects.toThrow(/No se puede eliminar el contacto porque tiene equipos prestados asociados./);
      expect(mockPrisma.contactoEmpresa.delete).not.toHaveBeenCalled();
    });

    it('NO debe eliminar el contacto si tiene tickets asociados', async () => {
      (mockPrisma.equipoEnPrestamo.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.ticket.count as vi.Mock).mockResolvedValue(1); // Simula 1 ticket
      await expect(ContactoEmpresaService.deleteContactoEmpresa(mockContactoId)).rejects.toThrow(/No se puede eliminar el contacto porque tiene tickets asociados./);
      expect(mockPrisma.contactoEmpresa.delete).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Prisma al eliminar contacto', async () => {
      (mockPrisma.equipoEnPrestamo.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.ticket.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.contactoEmpresa.delete as vi.Mock).mockRejectedValue(new Error('Delete DB Error'));
      try {
        await ContactoEmpresaService.deleteContactoEmpresa(mockContactoId);
        // If the above line doesn't throw, the test should fail
        expect(true).toBe(false); // Force fail if no error is thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toMatch(/Error al eliminar el contacto de empresa. Detalles: Delete DB Error/);
      }
    });
  });
});
