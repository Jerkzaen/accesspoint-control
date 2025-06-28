import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getServerSession } from 'next-auth';

// --- Mocks de Módulos ---
// No es necesario mockear el servicio porque la ruta ni siquiera lo llama.
vi.mock('next-auth');

// --- Importación de Rutas ---
// Las rutas para intentar modificar/borrar una acción individual
import { PUT as putAccion, DELETE as deleteAccion } from '../route';

describe('API Endpoint para GESTIONAR una Acción Específica', () => {

  beforeEach(() => {
    vi.resetAllMocks();
    // Aunque la ruta no usa la sesión para estos métodos, es buena práctica tenerla mockeada.
    (getServerSession as Mock).mockResolvedValue({ user: { id: 'admin-123' } });
  });

  // --- Pruebas de INMUTABILIDAD ---
  it('debe devolver 405 Method Not Allowed para PUT en una acción', async () => {
    // Usamos la función importada 'putAccion'
    const response = await putAccion();
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.message).toContain('método PUT no está permitido');
  });

  it('debe devolver 405 Method Not Allowed para DELETE en una acción', async () => {
    // Usamos la función importada 'deleteAccion'
    const response = await deleteAccion();
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.message).toContain('método DELETE no está permitido');
  });
});
