import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmpresaService, EmpresaCreateInput, EmpresaUpdateInput } from '../empresaService';
import { prisma } from '../../lib/prisma';
import { EstadoEmpresa, Prisma } from '@prisma/client';

// Mockeamos el módulo prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    empresa: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    direccion: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('EmpresaService', () => {
  // IDs con formato UUID válido para pasar la validación de Zod
  const VALID_EMPRESA_ID = 'e3b3b0b0-8c2c-4c2c-8c2c-8c2c8c2c8c2c';
  const VALID_COMUNA_ID = 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmpresas', () => {
    it('debe retornar solo las empresas ACTIVAS por defecto', async () => {
      const mockEmpresas = [{ id: VALID_EMPRESA_ID, nombre: 'Empresa Activa', estado: EstadoEmpresa.ACTIVA }];
      vi.mocked(prisma.empresa.findMany).mockResolvedValue(mockEmpresas as any);

      await EmpresaService.getEmpresas();

      expect(prisma.empresa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { estado: EstadoEmpresa.ACTIVA },
        })
      );
    });
  });

  describe('createEmpresa', () => {
    it('debe crear una nueva empresa y su dirección principal en una transacción', async () => {
      // CORRECCIÓN: Usamos un RUT válido sin puntos
      const input: EmpresaCreateInput = {
        nombre: 'Constructora XYZ',
        rut: '76123456-7', 
        direccionPrincipal: {
          calle: 'Av. Providencia',
          numero: '123',
          comunaId: VALID_COMUNA_ID,
        },
      };

      const mockDireccion = { id: 'd1e2f3a4-b5c6-d7e8-f9a0-b1c2d3e4f5a6' };
      const mockEmpresa = { id: VALID_EMPRESA_ID, ...input, direccionPrincipalId: mockDireccion.id };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          direccion: { create: vi.fn().mockResolvedValue(mockDireccion) },
          empresa: { create: vi.fn().mockResolvedValue(mockEmpresa) },
        };
        return await callback(tx);
      });
      
      const result = await EmpresaService.createEmpresa(input);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(VALID_EMPRESA_ID);
    });
  });
  
  describe('updateEmpresa', () => {
    it('debe actualizar los datos de una empresa', async () => {
      const updateData: EmpresaUpdateInput = { nombre: 'Nuevo Nombre Comercial' };
      const mockEmpresaActualizada = { id: VALID_EMPRESA_ID, nombre: 'Nuevo Nombre Comercial' };

      vi.mocked(prisma.empresa.update).mockResolvedValue(mockEmpresaActualizada as any);

      const result = await EmpresaService.updateEmpresa(VALID_EMPRESA_ID, updateData);

      expect(prisma.empresa.update).toHaveBeenCalledWith({
        where: { id: VALID_EMPRESA_ID },
        data: updateData,
      });
      expect(result.nombre).toBe('Nuevo Nombre Comercial');
    });
  });

  describe('deactivateEmpresa', () => {
    it('debe cambiar el estado de la empresa a INACTIVA', async () => {
      const mockEmpresaInactiva = { id: VALID_EMPRESA_ID, estado: EstadoEmpresa.INACTIVA };

      vi.mocked(prisma.empresa.update).mockResolvedValue(mockEmpresaInactiva as any);

      const result = await EmpresaService.deactivateEmpresa(VALID_EMPRESA_ID);

      expect(prisma.empresa.update).toHaveBeenCalledWith({
        where: { id: VALID_EMPRESA_ID },
        data: { estado: EstadoEmpresa.INACTIVA },
      });
      expect(result.estado).toBe(EstadoEmpresa.INACTIVA);
    });
  });
});
