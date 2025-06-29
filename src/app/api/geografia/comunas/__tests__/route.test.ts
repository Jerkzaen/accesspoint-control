import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GeografiaService } from '@/services/geografiaService';
import { GET } from '../route';

// --- MOCKS ---
vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/services/geografiaService');

describe('API Endpoint: GET /api/geografia/comunas', () => {

  const mockAdminSession = { user: { id: 'admin-123' } };
  const mockComunas = [
    { id: '1', nombre: 'Santiago', provincia: { id: 'p1', nombre: 'Santiago', region: { id: 'r1', nombre: 'Metropolitana' } } },
    { id: '2', nombre: 'Las Condes', provincia: { id: 'p1', nombre: 'Santiago', region: { id: 'r1', nombre: 'Metropolitana' } } },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    (getServerSession as Mock).mockResolvedValue(mockAdminSession);
  });

  it('debe devolver una lista de comunas cuando se proporciona un término de búsqueda válido', async () => {
    (GeografiaService.searchComunas as Mock).mockResolvedValue(mockComunas);
    
    // Este request ahora funciona porque la API usa request.url
    const request = new Request('http://localhost/api/geografia/comunas?search=santiago');
    const response = await GET(request as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.length).toBe(2);
    expect(GeografiaService.searchComunas).toHaveBeenCalledWith('santiago');
  });

  it('debe devolver un error 401 si el usuario no está autenticado', async () => {
    (getServerSession as Mock).mockResolvedValue(null);

    const request = new Request('http://localhost/api/geografia/comunas?search=santiago');
    const response = await GET(request as NextRequest);
    
    expect(response.status).toBe(401);
  });

  it('debe devolver un error 400 si no se proporciona el parámetro "search"', async () => {
    const request = new Request('http://localhost/api/geografia/comunas');
    const response = await GET(request as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("El parámetro 'search' es requerido.");
  });

  it('debe devolver un array vacío si el término de búsqueda no encuentra resultados', async () => {
    (GeografiaService.searchComunas as Mock).mockResolvedValue([]);

    const request = new Request('http://localhost/api/geografia/comunas?search=termino_inexistente');
    const response = await GET(request as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

});
