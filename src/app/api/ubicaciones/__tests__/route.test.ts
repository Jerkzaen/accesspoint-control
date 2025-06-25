// src/app/api/ubicaciones/__tests__/route.test.ts



// Importamos las funciones de las rutas API que vamos a probar
import { UbicacionService } from '@/services/ubicacionService';
import { GET, POST } from '../route'; // Importa las funciones GET y POST de la ruta principal
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route'; // Importa las funciones de la ruta con ID

// Importamos y mockeamos el UbicacionService para controlar su comportamiento en las pruebas de API.
import { Prisma } from '@prisma/client';
 
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/services/ubicacionService', () => ({
  UbicacionService: {
    getAll: vi.fn(),
    getUbicaciones: vi.fn(),
    createUbicacion: vi.fn(),
    getUbicacionById: vi.fn(),
    updateUbicacion: vi.fn(),
    deleteUbicacion: vi.fn(),
  },
}));

const mockUbicacionService = UbicacionService as unknown as vi.Mocked<typeof UbicacionService>;

describe('/api/ubicaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Datos de mock
  const mockDate = new Date();
  const mockUbicacion = {
    id: 'ubicacion-test-id',
    nombreReferencial: 'Oficina Principal',
    sucursalId: 'sucursal-test-id',
    notas: 'Notas de la ubicación',
    createdAt: mockDate,
    updatedAt: mockDate,
    sucursal: {
      id: 'sucursal-test-id', nombre: 'Sucursal Test', telefono: null, email: null, direccionId: 'dir-test-id', empresaId: 'empresa-test-id',
      createdAt: mockDate, updatedAt: mockDate
    },
    contactos: [],
    equiposInventario: [],
  };

  // Utilidad para convertir fechas a string en el mock de ubicación para los tests
  function ubicacionMockToJson(ubicacion: any) {
    return {
      ...ubicacion,
      createdAt: ubicacion.createdAt?.toISOString?.() || ubicacion.createdAt,
      updatedAt: ubicacion.updatedAt?.toISOString?.() || ubicacion.updatedAt,
      sucursal: ubicacion.sucursal ? {
        ...ubicacion.sucursal,
        createdAt: ubicacion.sucursal.createdAt?.toISOString?.() || ubicacion.sucursal.createdAt,
        updatedAt: ubicacion.sucursal.updatedAt?.toISOString?.() || ubicacion.sucursal.updatedAt,
      } : null,
      // Los arrays de relaciones como contactos y equiposInventario no necesitan serialización de fechas aquí
      // a menos que sus objetos internos también tengan fechas y se incluyan en el select/include real.
    };
  }

  // --- Pruebas para GET /api/ubicaciones ---
  describe('GET', () => {
    it('debe retornar una lista de ubicaciones con status 200', async () => {
      mockUbicacionService.getUbicaciones.mockResolvedValue([mockUbicacion]);

      const response = await GET(new Request('http://localhost/api/ubicaciones'));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual([ubicacionMockToJson(mockUbicacion)]);
      expect(mockUbicacionService.getUbicaciones).toHaveBeenCalledTimes(1);
      expect(mockUbicacionService.getUbicaciones).toHaveBeenCalledWith(true); // Esperamos que incluya relaciones por defecto
    });

    it('debe manejar errores y retornar status 500', async () => {
      mockUbicacionService.getUbicaciones.mockRejectedValue(new Error('Error de servicio'));

      const response = await GET(new Request('http://localhost/api/ubicaciones'));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al obtener ubicaciones');
      expect(mockUbicacionService.getUbicaciones).toHaveBeenCalledTimes(1);
    });
  });

  // --- Pruebas para POST /api/ubicaciones ---
  describe('POST', () => {
    const newUbicacionData = {
      nombreReferencial: 'Nueva Ubicación Demo',
      sucursalId: 'sucursal-demo-id',
      notas: 'Notas de la demo',
    };

    it('debe crear una nueva ubicación con status 201', async () => {
      mockUbicacionService.createUbicacion.mockResolvedValue({ id: 'new-ubicacion-id', ...newUbicacionData, createdAt: mockDate, updatedAt: mockDate });

      const request = new Request('http://localhost/api/ubicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUbicacionData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toHaveProperty('id', 'new-ubicacion-id');
      expect(mockUbicacionService.createUbicacion).toHaveBeenCalledTimes(1);
      expect(mockUbicacionService.createUbicacion).toHaveBeenCalledWith(newUbicacionData);
    });

    it('debe retornar status 400 por error de validación', async () => {
      mockUbicacionService.createUbicacion.mockRejectedValue(new Error('Error de validación al crear ubicación: El ID de la sucursal es requerido.'));

      const invalidData = { ...newUbicacionData, sucursalId: '' };
      const request = new Request('http://localhost/api/ubicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'Error de validación al crear ubicación: El ID de la sucursal es requerido.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      mockUbicacionService.createUbicacion.mockRejectedValue(new Error('Error desconocido'));

      const request = new Request('http://localhost/api/ubicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUbicacionData),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al crear ubicación');
    });
  });

  // --- Pruebas para GET /api/ubicaciones/[id] ---
  describe('GET /api/ubicaciones/[id]', () => {
    it('debe retornar una ubicación por ID con status 200', async () => {
      mockUbicacionService.getUbicacionById.mockResolvedValue(mockUbicacion);

      const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`);
      const response = await getById(request, { params: { id: mockUbicacion.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(ubicacionMockToJson(mockUbicacion));
      expect(mockUbicacionService.getUbicacionById).toHaveBeenCalledTimes(1);
      expect(mockUbicacionService.getUbicacionById).toHaveBeenCalledWith(mockUbicacion.id);
    });

    it('debe retornar status 404 si la ubicación no se encuentra', async () => {
      mockUbicacionService.getUbicacionById.mockResolvedValue(null);

      const request = new Request(`http://localhost/api/ubicaciones/non-existent-id`);
      const response = await getById(request, { params: { id: 'non-existent-id' } });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty('message', 'Ubicación no encontrada');
    });

    it('debe manejar errores y retornar status 500', async () => {
      mockUbicacionService.getUbicacionById.mockRejectedValue(new Error('Error de servicio'));

      const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`);
      const response = await getById(request, { params: { id: mockUbicacion.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al obtener ubicación');
    });
  });

  // --- Pruebas para PUT /api/ubicaciones/[id] ---
  describe('PUT /api/ubicaciones/[id]', () => {
    const updateData = { nombreReferencial: 'Ubicación Actualizada', notas: 'Notas Actualizadas' };

    it('debe actualizar una ubicación y retornar status 200', async () => {
      mockUbicacionService.updateUbicacion.mockResolvedValue({ ...mockUbicacion, ...updateData });

      const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await putById(request, { params: { id: mockUbicacion.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('nombreReferencial', 'Ubicación Actualizada');
      expect(mockUbicacionService.updateUbicacion).toHaveBeenCalledTimes(1);
      expect(mockUbicacionService.updateUbicacion).toHaveBeenCalledWith({ id: mockUbicacion.id, ...updateData });
    });

    it('debe retornar status 400 por error de validación', async () => {
      mockUbicacionService.updateUbicacion.mockRejectedValue(new Error('Error de validación al actualizar ubicación: El nombre referencial es requerido.'));

      const invalidData = { nombreReferencial: 'a' };
      const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await putById(request, { params: { id: mockUbicacion.id } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'Error de validación al actualizar ubicación: El nombre referencial es requerido.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      mockUbicacionService.updateUbicacion.mockRejectedValue(new Error('Error desconocido'));

      const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await putById(request, { params: { id: mockUbicacion.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al actualizar ubicación');
    });
  });

  // --- Pruebas para DELETE /api/ubicaciones/[id] ---
  describe('DELETE /api/ubicaciones/[id]', () => {
    it('debe eliminar una ubicación y retornar status 200', async () => {
      mockUbicacionService.deleteUbicacion.mockResolvedValue({ success: true, message: 'Ubicación eliminada exitosamente.' });

      const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
        method: 'DELETE',
      });

      const response = await deleteById(request, { params: { id: mockUbicacion.id } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('message', 'Ubicación eliminada exitosamente');
      expect(mockUbicacionService.deleteUbicacion).toHaveBeenCalledTimes(1);
      expect(mockUbicacionService.deleteUbicacion).toHaveBeenCalledWith(mockUbicacion.id);
    });

    it('debe retornar status 400 por error de regla de negocio (contactos asociados)', async () => {
      mockUbicacionService.deleteUbicacion.mockRejectedValue(new Error('No se puede eliminar la ubicación porque tiene contactos asociados.'));

      const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
        method: 'DELETE',
      });

      const response = await deleteById(request, { params: { id: mockUbicacion.id } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'No se puede eliminar la ubicación porque tiene contactos asociados.');
    });

    it('debe retornar status 400 por error de regla de negocio (equipos asociados)', async () => {
      mockUbicacionService.deleteUbicacion.mockRejectedValue(new Error('No se puede eliminar la ubicación porque tiene equipos de inventario asociados.'));

      const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
        method: 'DELETE',
      });

      const response = await deleteById(request, { params: { id: mockUbicacion.id } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('message', 'No se puede eliminar la ubicación porque tiene equipos de inventario asociados.');
    });

    it('debe manejar otros errores y retornar status 500', async () => {
      mockUbicacionService.deleteUbicacion.mockRejectedValue(new Error('Error desconocido'));

      const request = new Request(`http://localhost/api/ubicaciones/${mockUbicacion.id}`, {
        method: 'DELETE',
      });

      const response = await deleteById(request, { params: { id: mockUbicacion.id } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty('message', 'Error al eliminar ubicación');
    });
  });
});
