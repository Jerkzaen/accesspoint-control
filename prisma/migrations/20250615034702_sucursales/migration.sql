/*
  Warnings:

  - You are about to drop the `contactos_clientes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `empresas_clientes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `empresaClienteId` on the `Ticket` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "contactos_clientes_email_key";

-- DropIndex
DROP INDEX "empresas_clientes_email_key";

-- DropIndex
DROP INDEX "empresas_clientes_rut_key";

-- DropIndex
DROP INDEX "empresas_clientes_nombre_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "contactos_clientes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "empresas_clientes";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT,
    "logoUrl" TEXT,
    "direccionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "empresas_direccionId_fkey" FOREIGN KEY ("direccionId") REFERENCES "direcciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contactos_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreCompleto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "cargo" TEXT,
    "empresaId" TEXT NOT NULL,
    "ubicacionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contactos_empresas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contactos_empresas_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "direcciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calle" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "comuna" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccionId" TEXT NOT NULL,
    "empresaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sucursales_direccionId_fkey" FOREIGN KEY ("direccionId") REFERENCES "direcciones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sucursales_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    CONSTRAINT "EquipoEnPrestamo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "EquipoInventario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquipoEnPrestamo_prestadoAContactoId_fkey" FOREIGN KEY ("prestadoAContactoId") REFERENCES "contactos_empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquipoEnPrestamo_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EquipoEnPrestamo" ("createdAt", "entregadoPorUsuarioId", "equipoId", "estadoPrestamo", "fechaDevolucionEstimada", "fechaDevolucionReal", "fechaPrestamo", "id", "notasDevolucion", "notasPrestamo", "personaResponsableEnSitio", "prestadoAContactoId", "recibidoPorUsuarioId", "ticketId", "updatedAt") SELECT "createdAt", "entregadoPorUsuarioId", "equipoId", "estadoPrestamo", "fechaDevolucionEstimada", "fechaDevolucionReal", "fechaPrestamo", "id", "notasDevolucion", "notasPrestamo", "personaResponsableEnSitio", "prestadoAContactoId", "recibidoPorUsuarioId", "ticketId", "updatedAt" FROM "EquipoEnPrestamo";
DROP TABLE "EquipoEnPrestamo";
ALTER TABLE "new_EquipoEnPrestamo" RENAME TO "EquipoEnPrestamo";
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
    "solicitanteClienteId" TEXT,
    "empresaId" TEXT,
    "ubicacionId" TEXT,
    "tecnicoAsignadoId" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSolucionEstimada" DATETIME,
    "fechaSolucionReal" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "equipoAfectado" TEXT,
    CONSTRAINT "Ticket_solicitanteClienteId_fkey" FOREIGN KEY ("solicitanteClienteId") REFERENCES "contactos_empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_tecnicoAsignadoId_fkey" FOREIGN KEY ("tecnicoAsignadoId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("descripcionDetallada", "equipoAfectado", "estado", "fechaCreacion", "fechaSolucionEstimada", "fechaSolucionReal", "id", "numeroCaso", "prioridad", "solicitanteClienteId", "solicitanteCorreo", "solicitanteNombre", "solicitanteTelefono", "tecnicoAsignadoId", "tipoIncidente", "titulo", "ubicacionId", "updatedAt") SELECT "descripcionDetallada", "equipoAfectado", "estado", "fechaCreacion", "fechaSolucionEstimada", "fechaSolucionReal", "id", "numeroCaso", "prioridad", "solicitanteClienteId", "solicitanteCorreo", "solicitanteNombre", "solicitanteTelefono", "tecnicoAsignadoId", "tipoIncidente", "titulo", "ubicacionId", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_numeroCaso_key" ON "Ticket"("numeroCaso");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "empresas_nombre_key" ON "empresas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "contactos_empresas_email_key" ON "contactos_empresas"("email");
