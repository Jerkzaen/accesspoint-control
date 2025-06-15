/*
  Warnings:

  - You are about to drop the `Ubicacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `direcciones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `ubicacionActualId` on the `EquipoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacionId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacionId` on the `contactos_empresas` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Ubicacion";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "direcciones";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Pais" (
    "pais_id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Region" (
    "region_id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "paisId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Region_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "Pais" ("pais_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Provincia" (
    "provincia_id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Provincia_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("region_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comuna" (
    "comuna_id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comuna_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia" ("provincia_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Direccion" (
    "direccion_id" TEXT NOT NULL PRIMARY KEY,
    "calle" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "departamento" TEXT,
    "comunaId" TEXT NOT NULL,
    "codigoPostal" TEXT,
    "referencia" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Direccion_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "Comuna" ("comuna_id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "notasGenerales" TEXT,
    "panel_vts_serie" TEXT,
    "pedal_vts_serie" TEXT,
    "biartic_tipo_dispositivo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    "sucursalId" TEXT,
    "tecnicoAsignadoId" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSolucionEstimada" DATETIME,
    "fechaSolucionReal" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "equipoAfectado" TEXT,
    CONSTRAINT "Ticket_solicitanteClienteId_fkey" FOREIGN KEY ("solicitanteClienteId") REFERENCES "contactos_empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contactos_empresas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "empresas_direccionId_fkey" FOREIGN KEY ("direccionId") REFERENCES "Direccion" ("direccion_id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "sucursales_direccionId_fkey" FOREIGN KEY ("direccionId") REFERENCES "Direccion" ("direccion_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sucursales_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sucursales" ("createdAt", "direccionId", "email", "empresaId", "id", "nombre", "telefono", "updatedAt") SELECT "createdAt", "direccionId", "email", "empresaId", "id", "nombre", "telefono", "updatedAt" FROM "sucursales";
DROP TABLE "sucursales";
ALTER TABLE "new_sucursales" RENAME TO "sucursales";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Pais_nombre_key" ON "Pais"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Region_nombre_key" ON "Region"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Provincia_nombre_key" ON "Provincia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Comuna_nombre_key" ON "Comuna"("nombre");
