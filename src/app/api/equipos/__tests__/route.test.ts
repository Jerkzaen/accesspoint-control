// src/app/api/equipos/__tests__/route.test.ts

// Importamos las funciones de las rutas API que vamos a probar
import { EquipoInventarioService } from '@/services/equipoInventarioService';
import { GET, POST } from '../route'; // Importa las funciones GET y POST de la ruta principal
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route'; // Importa las funciones de la ruta con ID

import { Prisma, TipoEquipoInventario, EstadoEquipoInventario } from '@prisma/client';

// Mockeamos el servicio de EquipoInventario
import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.mock('@/services/equipoInventarioService', () => ({
  EquipoInventarioService: {
    getEquiposInventario: vi.fn(),
    getEquipoInventarioById: vi.fn(),
    createEquipoInventario: vi.fn(),
    updateEquipoInventario: vi.fn(),
    deleteEquipoInventario: vi.fn()
  },
}));

const mockEquipoInventarioService = EquipoInventarioService as unknown as { [key: string]: vi.Mock };


describe('/api/equipos', () => {
  beforeEach(() => {
      vi.clearAllMocks();
   });
   // Datos de mock
  const mockDate = new Date();
  const mockEquipo = {
    id: 'equipo-test-id',
    nombreDescriptivo: 'Laptop Prueba',
    identificadorUnico: 'LAP-001',
    tipoEquipo: TipoEquipoInventario.NOTEBOOK,
    marca: 'MarcaX',
    modelo: 'ModeloY',
    descripcionAdicional: null,
    estadoEquipo: EstadoEquipoInventario.DISPONIBLE,
    fechaAdquisicion: mockDate,
    proveedor: 'ProveedorZ',
    ubicacionActualId: 'ubicacion-test-id',
    notasGenerales: 'Notas del equipo',
    panelVtsSerie: null,
    pedalVtsSerie: null,
    biarticTipoDispositivo: null,
    empresaId: 'empresa-test-id',
    createdAt: mockDate,
    updatedAt: mockDate,
    ubicacionActual: {
      id: 'ubicacion-test-id',
      nombreReferencial: 'Oficina Central',
      createdAt: mockDate,
      updatedAt: mockDate,
      sucursalId: 'sucursal-test-id',
      notas: null
    },
    empresa: {
      id: 'empresa-test-id',
      nombre: 'Empresa Cliente',
      email: null,
      telefono: null,
      createdAt: mockDate,
      updatedAt: mockDate,
      rut: '',
      logoUrl: null,
      direccionPrincipalId: null
    },
    prestamos: [],
  };

  // Utilidad para convertir fechas a string en el mock de equipo para los tests
  function equipoMockToJson(equipo: any) {
    return {
      ...equipo,
      createdAt: equipo.createdAt?.toISOString?.() || equipo.createdAt,
      updatedAt: equipo.updatedAt?.toISOString?.() || equipo.updatedAt,
      fechaAdquisicion: equipo.fechaAdquisicion?.toISOString?.() || equipo.fechaAdquisicion,
      ubicacionActual: equipo.ubicacionActual ? {
        ...equipo.ubicacionActual,
        createdAt: equipo.ubicacionActual.createdAt?.toISOString?.() || equipo.ubicacionActual.createdAt,
        updatedAt: equipo.ubicacionActual.updatedAt?.toISOString?.() || equipo.ubicacionActual.updatedAt,
      } : null,
      empresa: equipo.empresa ? {
        ...equipo.empresa,
        createdAt: equipo.empresa.createdAt?.toISOString?.() || equipo.empresa.createdAt,
        updatedAt: equipo.empresa.updatedAt?.toISOString?.() || equipo.empresa.updatedAt,
      } : null,
      // `prestamos` es un array, sus objetos internos podrían necesitar serialización si tienen fechas
      // pero para este nivel, si son solo IDs o strings, no es necesario.
    };
  }

  // --- Pruebas para GET /api/equipos ---
  describe('GET', () => {
    it('debe retornar una lista de equipos con status 200', async () => {
      mockEquipoInventarioService.getEquiposInventario.mockResolvedValue([mockEquipo]);

      const response = await GET(new Request('http://localhost/api/equipos'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual([equipoMockToJson(mockEquipo)]);
      expect(mockEquipoInventarioService.getEquiposInventario).toHaveBeenCalledTimes(1);
      expect(mockEquipoInventarioService.getEquiposInventario).toHaveBeenCalledWith(true); // Esperamos que incluya relaciones por defecto
    

    it('debe manejar errores y retornar status 500', async () => {
      mockEquipoInventarioService.getEquiposInventario.mockRejectedValue(new Error('Error de servicio'));

      const response = await GET(new Request('http://localhost/api/equipos'));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al obtener equipos de inventario');
      expect(mockEquipoInventarioService.getEquiposInventario).toHaveBeenCalledTimes(1);
    });
  });

  // --- Pruebas para POST /api/equipos ---
  describe('POST', () => {
    const newEquipoData = {
      nombreDescriptivo: 'Nuevo Teclado',
      identificadorUnico: 'TECLADO-001',
      tipoEquipo: TipoEquipoInventario.PERIFERICO,
      estadoEquipo: EstadoEquipoInventario.DISPONIBLE,
      ubicacionActualId: 'ubicacion-demo-id',
      empresaId: 'empresa-demo-id',
    };

    it('debe crear un nuevo equipo con status 201', async () => {
      mockEquipoInventarioService.createEquipoInventario.mockResolvedValue({
        id: 'new-equipo-id',
        nombreDescriptivo: newEquipoData.nombreDescriptivo,
        identificadorUnico: newEquipoData.identificadorUnico,
        tipoEquipo: newEquipoData.tipoEquipo,
        marca: null,
        modelo: null,
        descripcionAdicional: null,
        estadoEquipo: newEquipoData.estadoEquipo,
        fechaAdquisicion: mockDate,
        proveedor: null,
        ubicacionActualId: newEquipoData.ubicacionActualId,
        notasGenerales: null,
        panelVtsSerie: null,
        pedalVtsSerie: null,
        biarticTipoDispositivo: null,
        empresaId: newEquipoData.empresaId,
        createdAt: mockDate,
        updatedAt: mockDate
      });

      const request = new Request('http://localhost/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEquipoData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty('id', 'new-equipo-id');
      expect(mockEquipoInventarioService.createEquipoInventario).toHaveBeenCalledTimes(1);
      expect(mockEquipoInventarioService.createEquipoInventario).toHaveBeenCalledWith(newEquipoData);
    });

    it('debe retornar status 400 por error de validación', async () => {
      mockEquipoInventarioService.createEquipoInventario.mockRejectedValue(new Error('Error de validación al crear equipo: El identificador único es requerido.'));

      const invalidData = { ...newEquipoData, identificadorUnico: '' };
      const request = new Request('http://localhost/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'Error de validación al crear equipo: El identificador único es requerido.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      mockEquipoInventarioService.createEquipoInventario.mockRejectedValue(new Error('Error desconocido'));

      const request = new Request('http://localhost/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEquipoData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al crear equipo de inventario');
    });

    it('debe retornar status 409 por identificador único duplicado', async () => {
      mockEquipoInventarioService.createEquipoInventario.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));

      const request = new Request('http://localhost/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEquipoData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json).toHaveProperty('message', 'El identificador único ya existe.');
    });
    });

    it('debe retornar status 409 por identificador único duplicado', async () => {
      mockEquipoInventarioService.createEquipoInventario.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));

      const request = new Request('http://localhost/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEquipoData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json).toHaveProperty('message', 'Error al crear equipo: El identificador único ya existe.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      mockEquipoInventarioService.createEquipoInventario.mockRejectedValue(new Error('Error desconocido'));

      const request = new Request('http://localhost/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEquipoData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al crear equipo');
    });
  });

  // --- Pruebas para GET /api/equipos/[id] ---
  describe('GET /api/equipos/[id]', () => {
    it('debe retornar un equipo por ID con status 200', async () => {
      mockEquipoInventarioService.getEquipoInventarioById.mockResolvedValue(mockEquipo);

      const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`);
      const response = await getById(request, { params: { id: mockEquipo.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(equipoMockToJson(mockEquipo));
      expect(mockEquipoInventarioService.getEquipoInventarioById).toHaveBeenCalledTimes(1);
      expect(mockEquipoInventarioService.getEquipoInventarioById).toHaveBeenCalledWith(mockEquipo.id);
    });

    it('debe retornar status 404 si el equipo no se encuentra', async () => {
      mockEquipoInventarioService.getEquipoInventarioById.mockResolvedValue(null);

      const request = new Request(`http://localhost/api/equipos/non-existent-id`);
      const response = await getById(request, { params: { id: 'non-existent-id' } });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty('message', 'Equipo no encontrado');
    });

    it('debe manejar errores y retornar status 500', async () => {
      mockEquipoInventarioService.getEquipoInventarioById.mockRejectedValue(new Error('Error de servicio'));

      const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`);
      const response = await getById(request, { params: { id: mockEquipo.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al obtener equipo');
    });
  });

  // --- Pruebas para PUT /api/equipos/[id] ---
  describe('PUT /api/equipos/[id]', () => {
    const updateData = { nombreDescriptivo: 'Laptop Gaming', marca: 'MSI' };

    it('debe actualizar un equipo y retornar status 200', async () => {
      mockEquipoInventarioService.updateEquipoInventario.mockResolvedValue({ ...mockEquipo, ...updateData });

      const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await putById(request, { params: { id: mockEquipo.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('nombreDescriptivo', 'Laptop Gaming');
      expect(mockEquipoInventarioService.updateEquipoInventario).toHaveBeenCalledTimes(1);
      expect(mockEquipoInventarioService.updateEquipoInventario).toHaveBeenCalledWith({ id: mockEquipo.id, ...updateData });
    });

    it('debe retornar status 400 por error de validación', async () => {
      mockEquipoInventarioService.updateEquipoInventario.mockRejectedValue(new Error('Error de validación al actualizar equipo: El tipo de equipo es inválido.'));

      const invalidData = { tipoEquipo: 'INVALIDO' };
      const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await putById(request, { params: { id: mockEquipo.id } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'Error de validación al actualizar equipo: El tipo de equipo es inválido.');
    });

    it('debe retornar status 409 por identificador único duplicado', async () => {
      mockEquipoInventarioService.updateEquipoInventario.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }));

      const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await putById(request, { params: { id: mockEquipo.id } });
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json).toHaveProperty('message', 'Error al actualizar equipo: El identificador único ya existe.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      mockEquipoInventarioService.updateEquipoInventario.mockRejectedValue(new Error('Error desconocido'));

      const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await putById(request, { params: { id: mockEquipo.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al actualizar equipo');
    });
  });

  // --- Pruebas para DELETE /api/equipos/[id] ---
  describe('DELETE /api/equipos/[id]', () => {
    it('debe eliminar un equipo y retornar status 200', async () => {
      mockEquipoInventarioService.deleteEquipoInventario.mockResolvedValue({ success: true, message: 'Equipo de inventario eliminado exitosamente.' });

      const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, {
        method: 'DELETE',
      });

      const response = await deleteById(request, { params: { id: mockEquipo.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('message', 'Equipo de inventario eliminado exitosamente');
      expect(mockEquipoInventarioService.deleteEquipoInventario).toHaveBeenCalledTimes(1);
      expect(mockEquipoInventarioService.deleteEquipoInventario).toHaveBeenCalledWith(mockEquipo.id);
    });

    it('debe retornar status 400 por error de regla de negocio (préstamos asociados)', async () => {
      mockEquipoInventarioService.deleteEquipoInventario.mockRejectedValue(new Error('No se puede eliminar el equipo porque tiene registros de préstamos asociados.'));

      const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, {
        method: 'DELETE',
      });

      const response = await deleteById(request, { params: { id: mockEquipo.id } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'No se puede eliminar el equipo porque tiene registros de préstamos asociados.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      mockEquipoInventarioService.deleteEquipoInventario.mockRejectedValue(new Error('Error desconocido'));

      const request = new Request(`http://localhost/api/equipos/${mockEquipo.id}`, {
        method: 'DELETE',
      });

      const response = await deleteById(request, { params: { id: mockEquipo.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al eliminar equipo');
    });
  });
});
