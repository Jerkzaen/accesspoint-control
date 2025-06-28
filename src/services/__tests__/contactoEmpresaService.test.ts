import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactoEmpresaService, ContactoEmpresaCreateInput, ContactoEmpresaUpdateInput } from '../contactoEmpresaService';
import { prisma } from '../../lib/prisma';
import { Prisma, EstadoContacto } from '@prisma/client';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    contactoEmpresa: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('ContactoEmpresaService', () => {
  const VALID_CONTACTO_ID = 'c1d2e3f4-a5b6-c7d8-e9f0-a1b2c3d4e5f6';
  const VALID_EMPRESA_ID = 'e3b3b0b0-8c2c-4c2c-8c2c-8c2c8c2c8c2c';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContactosEmpresa', () => {
    it('debe retornar solo los contactos ACTIVOS por defecto', async () => {
      await ContactoEmpresaService.getContactosEmpresa();
      expect(prisma.contactoEmpresa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { estado: EstadoContacto.ACTIVO },
        })
      );
    });
  });
  
  describe('createContactoEmpresa', () => {
    it('debe crear un nuevo contacto', async () => {
      const input: ContactoEmpresaCreateInput = {
        nombreCompleto: 'Ana Reyes',
        email: 'ana.reyes@empresa.com',
        telefono: '987654321',
        empresaId: VALID_EMPRESA_ID,
      };
      const mockContacto = { id: VALID_CONTACTO_ID, ...input, estado: EstadoContacto.ACTIVO };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = { contactoEmpresa: { create: vi.fn().mockResolvedValue(mockContacto) } };
        return await callback(tx);
      });

      const result = await ContactoEmpresaService.createContactoEmpresa(input);
      expect(result.nombreCompleto).toBe('Ana Reyes');
    });
  });

  describe('updateContactoEmpresa', () => {
    it('debe actualizar un contacto existente', async () => {
        const updateData: ContactoEmpresaUpdateInput = { id: VALID_CONTACTO_ID, nombreCompleto: 'Ana Reyes de Solís' };
        const mockContactoActualizado = { id: VALID_CONTACTO_ID, nombreCompleto: 'Ana Reyes de Solís' };
        
        vi.mocked(prisma.contactoEmpresa.update).mockResolvedValue(mockContactoActualizado as any);

        const result = await ContactoEmpresaService.updateContactoEmpresa(updateData);
        expect(result.nombreCompleto).toBe('Ana Reyes de Solís');
    });
  });

  // PRUEBA ACTUALIZADA: Ahora probamos la desactivación
  describe('deactivateContactoEmpresa', () => {
    it('debe cambiar el estado del contacto a INACTIVO', async () => {
      const mockContactoInactivo = { id: VALID_CONTACTO_ID, estado: EstadoContacto.INACTIVO };
      vi.mocked(prisma.contactoEmpresa.update).mockResolvedValue(mockContactoInactivo as any);
      
      const result = await ContactoEmpresaService.deactivateContactoEmpresa(VALID_CONTACTO_ID);
      
      expect(prisma.contactoEmpresa.update).toHaveBeenCalledWith({
        where: { id: VALID_CONTACTO_ID },
        data: { estado: EstadoContacto.INACTIVO },
      });
      expect(result.estado).toBe(EstadoContacto.INACTIVO);
    });
  });
});
