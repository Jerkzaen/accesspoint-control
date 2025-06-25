// src/services/__tests__/empresaService.test.ts

// Importamos el servicio que vamos a probar
import { EmpresaService, EmpresaCreateInput, EmpresaUpdateInput } from '../empresaService';
import { prisma } from '../../lib/prisma';
import { EstadoTicket, PrioridadTicket, Prisma } from '@prisma/client'; // <-- Agregado Prisma


// Mockeamos el módulo 'prisma' para controlar el comportamiento de sus métodos.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    empresa: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    direccion: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sucursal: { count: vi.fn() },
    ticket: { count: vi.fn() },
    contactoEmpresa: { deleteMany: vi.fn() },
    $transaction: vi.fn((callback: (prisma: Prisma.TransactionClient) => Promise<any>) => callback(prisma as any)),
    $disconnect: vi.fn(),
  },
}));

// Casteamos la instancia mockeada de prisma para un mejor tipado en las pruebas
const mockPrisma = prisma as unknown as vi.Mocked<typeof prisma>;

describe('EmpresaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Pruebas para getEmpresas ---
  describe('getEmpresas', () => {
    it('debe retornar una lista de empresas ordenadas alfabéticamente', async () => {
      const mockEmpresas = [
        { id: 'e2', nombre: 'Empresa B', rut: '11111111-1', createdAt: new Date(), updatedAt: new Date() },
        { id: 'e1', nombre: 'Empresa A', rut: '22222222-2', createdAt: new Date(), updatedAt: new Date() },
      ];
      (mockPrisma.empresa.findMany as vi.Mock).mockResolvedValue(mockEmpresas);

      const empresas = await EmpresaService.getEmpresas();

      expect(mockPrisma.empresa.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.empresa.findMany).toHaveBeenCalledWith({
        include: { direccionPrincipal: false }, // Se pasa false por defecto
        orderBy: { nombre: 'asc' },
      });
      expect(empresas).toEqual(mockEmpresas);
    });

    it('debe incluir la dirección principal si se solicita', async () => {
      const mockEmpresaWithDir = {
        id: 'e1',
        nombre: 'Empresa A',
        rut: '22222222-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        direccionPrincipal: {
          id: 'd1', calle: 'Calle Falsa', numero: '123', comunaId: 'c1', createdAt: new Date(), updatedAt: new Date()
        }
      };
      (mockPrisma.empresa.findMany as vi.Mock).mockResolvedValue([mockEmpresaWithDir]);

      const empresas = await EmpresaService.getEmpresas(true);

      expect(mockPrisma.empresa.findMany).toHaveBeenCalledWith({
        include: { direccionPrincipal: true },
        orderBy: { nombre: 'asc' },
      });
      expect(empresas[0]).toHaveProperty('direccionPrincipal');
    });

    it('debe manejar errores cuando Prisma falla al obtener empresas', async () => {
      (mockPrisma.empresa.findMany as vi.Mock).mockRejectedValue(new Error('DB Error'));
      await expect(EmpresaService.getEmpresas()).rejects.toThrow('No se pudieron obtener las empresas.');
    });
  });

  // --- Pruebas para getEmpresaById ---
  describe('getEmpresaById', () => {
    it('debe retornar una empresa por su ID con todas las relaciones', async () => {
      const mockEmpresa = {
        id: 'e1', nombre: 'Empresa Test', rut: '11111111-1', createdAt: new Date(), updatedAt: new Date(),
        direccionPrincipal: null, contactos: [], sucursales: [], tickets: [], equiposInventario: []
      };
      (mockPrisma.empresa.findUnique as vi.Mock).mockResolvedValue(mockEmpresa);

      const empresa = await EmpresaService.getEmpresaById('e1');

      expect(mockPrisma.empresa.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.empresa.findUnique).toHaveBeenCalledWith({
        where: { id: 'e1' },
        include: {
          direccionPrincipal: true, contactos: true, sucursales: true, tickets: true, equiposInventario: true
        },
      });
      expect(empresa).toEqual(mockEmpresa);
    });

    it('debe retornar null si la empresa no se encuentra', async () => {
      (mockPrisma.empresa.findUnique as vi.Mock).mockResolvedValue(null);
      const empresa = await EmpresaService.getEmpresaById('non-existent-id');
      expect(empresa).toBeNull();
    });

    it('debe manejar errores cuando Prisma falla al obtener empresa por ID', async () => {
      (mockPrisma.empresa.findUnique as vi.Mock).mockRejectedValue(new Error('DB Error'));
      await expect(EmpresaService.getEmpresaById('e1')).rejects.toThrow('No se pudo obtener la empresa.');
    });
  });

  // --- Pruebas para createEmpresa ---
  describe('createEmpresa', () => {
    // Usa un UUID válido de comuna y un RUT válido
    const validComunaId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d20';
    const validRut = '12345678-9';

    const newEmpresaData: EmpresaCreateInput = {
      nombre: 'Nueva Empresa',
      rut: validRut,
      email: 'nueva@empresa.com',
      telefono: '1234567',
      direccionPrincipal: {
        calle: 'Calle Nueva',
        numero: '456',
        comunaId: validComunaId
      }
    };
    it('debe crear una nueva empresa con una dirección principal y retornar el objeto creado', async () => {
      (mockPrisma.direccion.create as vi.Mock).mockResolvedValue({
        id: 'new-dir-id',
        ...newEmpresaData.direccionPrincipal,
        createdAt: new Date(), updatedAt: new Date()
      });
      (mockPrisma.empresa.create as vi.Mock).mockResolvedValue({
        id: 'new-emp-id',
        ...newEmpresaData,
        direccionPrincipalId: 'new-dir-id',
        createdAt: new Date(), updatedAt: new Date()
      });

      const empresa = await EmpresaService.createEmpresa(newEmpresaData);

      expect(mockPrisma.direccion.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.direccion.create).toHaveBeenCalledWith({
        data: {
          calle: newEmpresaData.direccionPrincipal!.calle,
          numero: newEmpresaData.direccionPrincipal!.numero,
          depto: undefined, // No se proporcionó depto, así que es undefined
          comuna: { connect: { id: validComunaId } },
        },
      });
      expect(mockPrisma.empresa.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.empresa.create).toHaveBeenCalledWith({
        data: {
          nombre: newEmpresaData.nombre,
          rut: newEmpresaData.rut,
          email: newEmpresaData.email,
          telefono: newEmpresaData.telefono,
          logoUrl: undefined,
          direccionPrincipal: { connect: { id: 'new-dir-id' } },
        },
      });
      expect(empresa).toHaveProperty('id', 'new-emp-id');
      expect(empresa).toHaveProperty('nombre', 'Nueva Empresa');
    });

    it('debe crear una empresa sin dirección principal si no se proporciona', async () => {
        const empresaDataWithoutDir = { ...newEmpresaData, direccionPrincipal: undefined };
        (mockPrisma.empresa.create as vi.Mock).mockResolvedValue({
            id: 'new-emp-id-no-dir', ...empresaDataWithoutDir, createdAt: new Date(), updatedAt: new Date()
        });

        const empresa = await EmpresaService.createEmpresa(empresaDataWithoutDir);

        expect(mockPrisma.direccion.create).not.toHaveBeenCalled();
        expect(mockPrisma.empresa.create).toHaveBeenCalledWith(
            expect.objectContaining({
            data: expect.not.objectContaining({ direccionPrincipal: expect.anything() }),
            })
        );
        expect(empresa).toHaveProperty('id', 'new-emp-id-no-dir');
        });

        it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
        const invalidData = { ...newEmpresaData, nombre: 'a' }; // Nombre muy corto
        await expect(EmpresaService.createEmpresa(invalidData)).rejects.toThrow(/Error de validación al crear empresa/);
        expect(mockPrisma.empresa.create).not.toHaveBeenCalled();
        });

        it('debe manejar errores de Prisma por RUT duplicado', async () => {
        (mockPrisma.empresa.create as vi.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));
        await expect(EmpresaService.createEmpresa(newEmpresaData)).rejects.toThrow('El RUT de la empresa ya existe.');
        });

        it('debe manejar otros errores de Prisma al crear empresa', async () => {
        (mockPrisma.empresa.create as vi.Mock).mockRejectedValue(new Error('Other DB Error'));
        await expect(EmpresaService.createEmpresa(newEmpresaData)).rejects.toThrow('Error al crear la empresa. Detalles: Other DB Error');
        });
    });

  // --- Pruebas para updateEmpresa ---
  describe('updateEmpresa', () => {
    const existingEmpresa = {
      id: 'e1', nombre: 'Old Name', rut: '11111111-1', email: 'old@test.com', telefono: '1234567',
      direccionPrincipalId: 'd1', createdAt: new Date(), updatedAt: new Date()
    };
    const existingDireccion = {
      id: '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d21', // UUID válido para tests
      calle: 'Old Street',
      numero: '1',
      comunaId: '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d20', // UUID válido para tests
      createdAt: new Date(),
      updatedAt: new Date()
    };

    beforeEach(() => {
      // Mockeamos findUnique para que always retorne la empresa existente para las comprobaciones internas de update
      (mockPrisma.empresa.findUnique as vi.Mock).mockResolvedValue(existingEmpresa);
    });

    it('debe actualizar los campos de la empresa y retornar el objeto actualizado', async () => {
    const updateData: EmpresaUpdateInput = { nombre: 'Updated Name', email: 'updated@test.com' };
    (mockPrisma.empresa.update as vi.Mock).mockResolvedValue({ ...existingEmpresa, ...updateData });

    const empresa = await EmpresaService.updateEmpresa('e1', updateData);

    expect(mockPrisma.empresa.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.empresa.update).toHaveBeenCalledWith(
        // CORRECCIÓN: el expect.objectContaining({ data: ... }) debe ser más preciso
        // para asegurar que direccionPrincipal no se pase si no se quiere actualizar
        expect.objectContaining({
            where: { id: 'e1' },
            data: {
                nombre: 'Updated Name',
                email: 'updated@test.com',
                // Aseguramos que direccionPrincipal no se incluye en el data si no se especifica
                // expect.not.objectContaining({ direccionPrincipal: expect.anything() }),
            },
        })
    );
    expect(empresa).toHaveProperty('nombre', 'Updated Name');
    expect(empresa).toHaveProperty('email', 'updated@test.com');
    }); 
    
    // Test original y corregido para actualizar la dirección principal si se proporciona con ID
    it('debe actualizar la dirección principal si se proporciona con ID', async () => {
        const updateData: EmpresaUpdateInput = {
            direccionPrincipal: {
                id: existingDireccion.id, // Usar el ID del mock existente
                calle: 'New Street',
                numero: '2',
                comunaId: existingDireccion.comunaId // Usar el ID del mock existente
            }
        };
        (mockPrisma.direccion.update as vi.Mock).mockResolvedValue({ ...existingDireccion, ...updateData.direccionPrincipal });
        (mockPrisma.empresa.update as vi.Mock).mockResolvedValue({ ...existingEmpresa, direccionPrincipalId: existingDireccion.id });

        const empresa = await EmpresaService.updateEmpresa('e1', updateData);

        expect(mockPrisma.direccion.update).toHaveBeenCalledTimes(1);
        expect(mockPrisma.direccion.update).toHaveBeenCalledWith({
          where: { id: existingDireccion.id },
          data: expect.objectContaining({
            calle: 'New Street',
            numero: '2',
            comuna: { connect: { id: existingDireccion.comunaId } },
            depto: undefined,
          }),
        });
        expect(mockPrisma.empresa.update).toHaveBeenCalledTimes(1);
        expect(empresa).toHaveProperty('direccionPrincipalId', existingDireccion.id);
        });


    it('debe crear una nueva dirección principal si se proporcionan datos sin ID', async () => {
    const validComunaId = '0a1c5d2c-5958-4a14-ad8e-1a5046bb5d20'; // Reafirmar UUID válido
    const updateData: EmpresaUpdateInput = {
        direccionPrincipal: { calle: 'New New Street', numero: '3', comunaId: validComunaId }
    };
    (mockPrisma.direccion.create as vi.Mock).mockResolvedValue({
        id: 'new-dir-id-created', ...updateData.direccionPrincipal, createdAt: new Date(), updatedAt: new Date()
    });
    (mockPrisma.empresa.update as vi.Mock).mockResolvedValue({ ...existingEmpresa, direccionPrincipalId: 'new-dir-id-created' });

    const empresa = await EmpresaService.updateEmpresa('e1', updateData);

    expect(mockPrisma.direccion.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.direccion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ calle: 'New New Street', numero: '3', comuna: { connect: { id: validComunaId } } }),
    });
    expect(mockPrisma.empresa.update).toHaveBeenCalledWith(
        expect.objectContaining({
        data: expect.objectContaining({ direccionPrincipal: { connect: { id: 'new-dir-id-created' } } }),
        })
    );
    expect(empresa).toHaveProperty('direccionPrincipalId', 'new-dir-id-created');
    });

    it('debe desvincular la dirección principal si se envía null', async () => {
      const updateData: EmpresaUpdateInput = { direccionPrincipal: null };
      (mockPrisma.empresa.update as vi.Mock).mockResolvedValue({ ...existingEmpresa, direccionPrincipalId: null });

      const empresa = await EmpresaService.updateEmpresa('e1', updateData);

    expect(mockPrisma.empresa.update).toHaveBeenCalledWith(
    expect.objectContaining({
        data: expect.objectContaining({ direccionPrincipal: { disconnect: true } }),
    })
    );
      expect(mockPrisma.direccion.update).not.toHaveBeenCalled(); // No se actualiza la dirección
      expect(empresa).toHaveProperty('direccionPrincipalId', null);
    });

    it('no debe modificar la dirección principal si no se proporciona en el payload', async () => {
      const updateData: EmpresaUpdateInput = { nombre: 'Only Name Update' };
      // Aseguramos que la llamada a findUnique para obtener el ID de la dirección actual funcione
      (mockPrisma.empresa.findUnique as vi.Mock).mockResolvedValue({ ...existingEmpresa, direccionPrincipalId: 'd1' });
      (mockPrisma.empresa.update as vi.Mock).mockResolvedValue({ ...existingEmpresa, nombre: 'Only Name Update' });

      const empresa = await EmpresaService.updateEmpresa('e1', updateData);

      expect(mockPrisma.direccion.update).not.toHaveBeenCalled();
      expect(mockPrisma.direccion.create).not.toHaveBeenCalled();
      expect(mockPrisma.empresa.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'e1' }, // Asegurarse de incluir el 'where' en el expect.objectContaining si es necesario
          data: expect.not.objectContaining({ direccionPrincipal: expect.anything() }),
        })
      );
      expect(empresa).toHaveProperty('nombre', 'Only Name Update');
    });

    it('debe lanzar un error de validación Zod si los datos son inválidos', async () => {
      const invalidData = { rut: 'invalid-rut' };
      await expect(EmpresaService.updateEmpresa('e1', invalidData)).rejects.toThrow(/Error de validación al actualizar empresa/);
      expect(mockPrisma.empresa.update).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Prisma por RUT duplicado', async () => {
      (mockPrisma.empresa.update as vi.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));
      await expect(EmpresaService.updateEmpresa('e1', { rut: '99999999-9' })).rejects.toThrow('El RUT de la empresa ya existe.');
    });

    it('debe manejar otros errores de Prisma al actualizar empresa', async () => {
      (mockPrisma.empresa.update as vi.Mock).mockRejectedValue(new Error('Update DB Error'));
      await expect(EmpresaService.updateEmpresa('e1', { nombre: 'Fail' })).rejects.toThrow('Error al actualizar la empresa. Detalles: Update DB Error');
    });
  });

  // --- Pruebas para deleteEmpresa ---
  describe('deleteEmpresa', () => {
    it('debe eliminar una empresa si no tiene sucursales ni tickets asociados', async () => {
      (mockPrisma.sucursal.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.ticket.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.contactoEmpresa.deleteMany as vi.Mock).mockResolvedValue({ count: 0 });
      (mockPrisma.empresa.update as vi.Mock).mockResolvedValue({}); // Para el disconnect
      (mockPrisma.empresa.delete as vi.Mock).mockResolvedValue({});

      await EmpresaService.deleteEmpresa('e1');

      expect(mockPrisma.sucursal.count).toHaveBeenCalledWith({ where: { empresaId: 'e1' } });
      expect(mockPrisma.ticket.count).toHaveBeenCalledWith({ where: { empresaId: 'e1' } });
      expect(mockPrisma.contactoEmpresa.deleteMany).toHaveBeenCalledWith({ where: { empresaId: 'e1' } });
      expect(mockPrisma.empresa.update).toHaveBeenCalledWith({ where: { id: 'e1' }, data: { direccionPrincipalId: null } });
      expect(mockPrisma.empresa.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
    });

    it('NO debe eliminar la empresa si tiene sucursales asociadas', async () => {
      (mockPrisma.sucursal.count as vi.Mock).mockResolvedValue(1); // Simula 1 sucursal
      // CORRECCIÓN: El servicio lanza un error, así que esperamos un reject, no un resolve.
      await expect(EmpresaService.deleteEmpresa('e1')).rejects.toThrow('No se puede eliminar la empresa porque tiene sucursales asociadas. Primero, desvincula o elimina sus sucursales.');
    });

    it('NO debe eliminar la empresa si tiene tickets asociados', async () => {
      (mockPrisma.sucursal.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.ticket.count as vi.Mock).mockResolvedValue(1); // Simula 1 ticket
      await expect(EmpresaService.deleteEmpresa('e1')).rejects.toThrow('No se puede eliminar la empresa porque tiene tickets asociados. Por favor, reasigna o cierra los tickets de esta empresa primero.');
      expect(mockPrisma.empresa.delete).not.toHaveBeenCalled();
    });

    it('debe manejar errores de Prisma al eliminar empresa', async () => {
      (mockPrisma.sucursal.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.ticket.count as vi.Mock).mockResolvedValue(0);
      (mockPrisma.empresa.delete as vi.Mock).mockRejectedValue(new Error('Delete DB Error'));
      await expect(EmpresaService.deleteEmpresa('e1')).rejects.toThrow('Delete DB Error');
    }); // <-- CIERRA el último test
  }); // Cierra describe('deleteEmpresa')
}); // Cierra describe('EmpresaService')