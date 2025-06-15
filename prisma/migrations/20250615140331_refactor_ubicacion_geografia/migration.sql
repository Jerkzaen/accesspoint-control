/*
  Warnings:

  - You are about to drop the `Comuna` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Direccion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pais` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Provincia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Region` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `sucursalId` on the `Ticket` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Comuna_nombre_key";

-- DropIndex
DROP INDEX "Pais_nombre_key";

-- DropIndex
DROP INDEX "Provincia_nombre_key";

-- DropIndex
DROP INDEX "Region_nombre_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Comuna";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Direccion";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Pais";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Provincia";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Region";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "paises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "regiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "paisId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "regiones_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "paises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "provincias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "provincias_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comunas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "comunas_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "provincias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "direcciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calle" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "comunaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "direcciones_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "comunas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ubicaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreReferencial" TEXT,
    "sucursalId" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ubicaciones_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EquipoInventario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreDescriptivo" TEXT NOT NULL,
    "identificadorUnico" TEXT NOT NULL,
    "tipoEquipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "descripcionAdicional" TEXT,
    "estadoEquipo" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "fechaAdquisicion" DATETIME,
    "proveedor" TEXT,
    "ubicacionActualId" TEXT,
    "notasGenerales" TEXT,
    "panel_vts_serie" TEXT,
    "pedal_vts_serie" TEXT,
    "biartic_tipo_dispositivo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EquipoInventario_ubicacionActualId_fkey" FOREIGN KEY ("ubicacionActualId") REFERENCES "ubicaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EquipoInventario" ("biartic_tipo_dispositivo", "createdAt", "descripcionAdicional", "estadoEquipo", "fechaAdquisicion", "id", "identificadorUnico", "marca", "modelo", "nombreDescriptivo", "notasGenerales", "panel_vts_serie", "pedal_vts_serie", "proveedor", "tipoEquipo", "updatedAt") SELECT "biartic_tipo_dispositivo", "createdAt", "descripcionAdicional", "estadoEquipo", "fechaAdquisicion", "id", "identificadorUnico", "marca", "modelo", "nombreDescriptivo", "notasGenerales", "panel_vts_serie", "pedal_vts_serie", "proveedor", "tipoEquipo", "updatedAt" FROM "EquipoInventario";
DROP TABLE "EquipoInventario";
ALTER TABLE "new_EquipoInventario" RENAME TO "EquipoInventario";
CREATE UNIQUE INDEX "EquipoInventario_identificadorUnico_key" ON "EquipoInventario"("identificadorUnico");
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
    CONSTRAINT "Ticket_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "ubicaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_tecnicoAsignadoId_fkey" FOREIGN KEY ("tecnicoAsignadoId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("descripcionDetallada", "empresaId", "equipoAfectado", "estado", "fechaCreacion", "fechaSolucionEstimada", "fechaSolucionReal", "id", "numeroCaso", "prioridad", "solicitanteClienteId", "solicitanteCorreo", "solicitanteNombre", "solicitanteTelefono", "tecnicoAsignadoId", "tipoIncidente", "titulo", "updatedAt") SELECT "descripcionDetallada", "empresaId", "equipoAfectado", "estado", "fechaCreacion", "fechaSolucionEstimada", "fechaSolucionReal", "id", "numeroCaso", "prioridad", "solicitanteClienteId", "solicitanteCorreo", "solicitanteNombre", "solicitanteTelefono", "tecnicoAsignadoId", "tipoIncidente", "titulo", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_numeroCaso_key" ON "Ticket"("numeroCaso");
CREATE TABLE "new_contactos_empresas" (
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
    CONSTRAINT "contactos_empresas_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "ubicaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_contactos_empresas" ("cargo", "createdAt", "email", "empresaId", "id", "nombreCompleto", "telefono", "updatedAt") SELECT "cargo", "createdAt", "email", "empresaId", "id", "nombreCompleto", "telefono", "updatedAt" FROM "contactos_empresas";
DROP TABLE "contactos_empresas";
ALTER TABLE "new_contactos_empresas" RENAME TO "contactos_empresas";
CREATE UNIQUE INDEX "contactos_empresas_email_key" ON "contactos_empresas"("email");
CREATE TABLE "new_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT,
    "logoUrl" TEXT,
    "direccionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "empresas_direccionId_fkey" FOREIGN KEY ("direccionId") REFERENCES "direcciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_empresas" ("createdAt", "direccionId", "id", "logoUrl", "nombre", "rut", "updatedAt") SELECT "createdAt", "direccionId", "id", "logoUrl", "nombre", "rut", "updatedAt" FROM "empresas";
DROP TABLE "empresas";
ALTER TABLE "new_empresas" RENAME TO "empresas";
CREATE UNIQUE INDEX "empresas_nombre_key" ON "empresas"("nombre");
CREATE TABLE "new_sucursales" (
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
INSERT INTO "new_sucursales" ("createdAt", "direccionId", "email", "empresaId", "id", "nombre", "telefono", "updatedAt") SELECT "createdAt", "direccionId", "email", "empresaId", "id", "nombre", "telefono", "updatedAt" FROM "sucursales";
DROP TABLE "sucursales";
ALTER TABLE "new_sucursales" RENAME TO "sucursales";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "paises_nombre_key" ON "paises"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "regiones_nombre_paisId_key" ON "regiones"("nombre", "paisId");

-- CreateIndex
CREATE UNIQUE INDEX "provincias_nombre_regionId_key" ON "provincias"("nombre", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "comunas_nombre_provinciaId_key" ON "comunas"("nombre", "provinciaId");
