/*
  Warnings:

  - Added the required column `creadoPorUsuarioId` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroCaso" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcionDetallada" TEXT,
    "tipoIncidente" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "solicitanteNombre" TEXT NOT NULL,
    "solicitanteTelefono" TEXT,
    "solicitanteCorreo" TEXT,
    "contactoId" TEXT,
    "empresaId" TEXT,
    "sucursalId" TEXT,
    "tecnicoAsignadoId" TEXT,
    "creadoPorUsuarioId" TEXT NOT NULL,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSolucionEstimada" DATETIME,
    "fechaSolucionReal" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "equipoAfectado" TEXT,
    CONSTRAINT "Ticket_contactoId_fkey" FOREIGN KEY ("contactoId") REFERENCES "contactos_empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_tecnicoAsignadoId_fkey" FOREIGN KEY ("tecnicoAsignadoId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_creadoPorUsuarioId_fkey" FOREIGN KEY ("creadoPorUsuarioId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("contactoId", "descripcionDetallada", "empresaId", "equipoAfectado", "estado", "fechaCreacion", "fechaSolucionEstimada", "fechaSolucionReal", "id", "numeroCaso", "prioridad", "solicitanteCorreo", "solicitanteNombre", "solicitanteTelefono", "sucursalId", "tecnicoAsignadoId", "tipoIncidente", "titulo", "updatedAt") SELECT "contactoId", "descripcionDetallada", "empresaId", "equipoAfectado", "estado", "fechaCreacion", "fechaSolucionEstimada", "fechaSolucionReal", "id", "numeroCaso", "prioridad", "solicitanteCorreo", "solicitanteNombre", "solicitanteTelefono", "sucursalId", "tecnicoAsignadoId", "tipoIncidente", "titulo", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_numeroCaso_key" ON "Ticket"("numeroCaso");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
