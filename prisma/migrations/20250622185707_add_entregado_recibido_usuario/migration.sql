-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EquipoEnPrestamo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipoId" TEXT NOT NULL,
    "prestadoAContactoId" TEXT NOT NULL,
    "personaResponsableEnSitio" TEXT NOT NULL,
    "fechaPrestamo" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaDevolucionEstimada" DATETIME NOT NULL,
    "fechaDevolucionReal" DATETIME,
    "estadoPrestamo" TEXT NOT NULL DEFAULT 'PRESTADO',
    "ticketId" TEXT,
    "notasPrestamo" TEXT,
    "notasDevolucion" TEXT,
    "entregadoPorUsuarioId" TEXT,
    "recibidoPorUsuarioId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EquipoEnPrestamo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "equipos_inventario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquipoEnPrestamo_prestadoAContactoId_fkey" FOREIGN KEY ("prestadoAContactoId") REFERENCES "contactos_empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquipoEnPrestamo_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EquipoEnPrestamo_entregadoPorUsuarioId_fkey" FOREIGN KEY ("entregadoPorUsuarioId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EquipoEnPrestamo_recibidoPorUsuarioId_fkey" FOREIGN KEY ("recibidoPorUsuarioId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EquipoEnPrestamo" ("createdAt", "entregadoPorUsuarioId", "equipoId", "estadoPrestamo", "fechaDevolucionEstimada", "fechaDevolucionReal", "fechaPrestamo", "id", "notasDevolucion", "notasPrestamo", "personaResponsableEnSitio", "prestadoAContactoId", "recibidoPorUsuarioId", "ticketId", "updatedAt") SELECT "createdAt", "entregadoPorUsuarioId", "equipoId", "estadoPrestamo", "fechaDevolucionEstimada", "fechaDevolucionReal", "fechaPrestamo", "id", "notasDevolucion", "notasPrestamo", "personaResponsableEnSitio", "prestadoAContactoId", "recibidoPorUsuarioId", "ticketId", "updatedAt" FROM "EquipoEnPrestamo";
DROP TABLE "EquipoEnPrestamo";
ALTER TABLE "new_EquipoEnPrestamo" RENAME TO "EquipoEnPrestamo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
