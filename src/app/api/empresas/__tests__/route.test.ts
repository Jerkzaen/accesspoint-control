// RUTA: /src/app/api/empresas/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 1. IMPORTA los módulos a mockear
import { getServerSession } from 'next-auth';
import { EmpresaService } from '@/services/empresaService';
import { type NextRequest } from 'next/server';

// 2. MOCKEA los módulos ANTES de importar las rutas
vi.mock('@/services/empresaService');
vi.mock('next-auth'); // Usa el mock de __mocks__/next-auth.ts

// 3. IMPORTA los handlers de la API DESPUÉS de los mocks
import { GET, POST } from '../route';
import { GET as getById, PUT as putById, DELETE as deleteById } from '../[id]/route';

describe('API Endpoints para /api/empresas', () => {

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // --- Pruebas para GET /api/empresas ---
  describe('GET /api/empresas', () => {
    it('debería devolver error 401 si el usuario no está autenticado', async () => {
      // Configuración: Sin sesión
      (getServerSession as vi.Mock).mockResolvedValue(null);
      const request = new Request('http://localhost/api/empresas') as NextRequest;
      
      // Ejecución y Aserción
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('debería devolver una lista de empresas si el usuario está autenticado', async () => {
      // Configuración: Con sesión y datos del servicio
      const mockSession = { user: { id: 'user-123', role: 'ADMIN' } };
      (getServerSession as vi.Mock).mockResolvedValue(mockSession);

      const mockEmpresas = [{ id: 'empresa-1', nombre: 'Empresa de Prueba' }];
      (EmpresaService.getEmpresas as vi.Mock).mockResolvedValue(mockEmpresas);
      
      const request = new Request('http://localhost/api/empresas') as NextRequest;
      
      // Ejecución
      const response = await GET(request);
      const body = await response.json();

      // Aserción
      expect(response.status).toBe(200);
      expect(body).toEqual(mockEmpresas);
      expect(EmpresaService.getEmpresas).toHaveBeenCalledTimes(1);
    });
  });

  // --- Pruebas para GET /api/empresas/[id] ---
  describe('GET /api/empresas/[id]', () => {
    it('debería devolver una empresa por su ID si el usuario está autenticado', async () => {
        // Configuración
        const mockSession = { user: { id: 'user-123' } };
        (getServerSession as vi.Mock).mockResolvedValue(mockSession);
        
        const mockEmpresa = { id: 'empresa-1', nombre: 'Empresa Específica' };
        (EmpresaService.getEmpresaById as vi.Mock).mockResolvedValue(mockEmpresa);

        const request = new Request('http://localhost/api/empresas/empresa-1') as NextRequest;
        
        // Ejecución (el `params` se pasa como segundo argumento al handler)
        const response = await getById(request, { params: { id: 'empresa-1' } });
        const body = await response.json();

        // Aserción
        expect(response.status).toBe(200);
        expect(body).toEqual(mockEmpresa);
        expect(EmpresaService.getEmpresaById).toHaveBeenCalledWith('empresa-1');
    });
  });

  // --- Pruebas para POST /api/empresas ---
  describe('POST /api/empresas', () => {
    it('debería crear una empresa si los datos son válidos y el usuario es admin', async () => {
        // Configuración
        const mockSession = { user: { id: 'user-123', role: 'ADMIN' } };
        (getServerSession as vi.Mock).mockResolvedValue(mockSession);

        const newEmpresaData = { nombre: 'Nueva Empresa', rut: '12345678-9' };
        const createdEmpresa = { id: 'new-id', ...newEmpresaData };
        (EmpresaService.createEmpresa as vi.Mock).mockResolvedValue(createdEmpresa);

        const request = new Request('http://localhost/api/empresas', {
            method: 'POST',
            body: JSON.stringify(newEmpresaData),
        }) as NextRequest;
        
        // Ejecución
        const response = await POST(request);
        const body = await response.json();
        
        // Aserción
        expect(response.status).toBe(201);
        expect(body).toEqual(createdEmpresa);
        expect(EmpresaService.createEmpresa).toHaveBeenCalledWith(newEmpresaData);
    });
  });

});
