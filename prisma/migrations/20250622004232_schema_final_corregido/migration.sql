/*
  Warnings:

  - You are about to drop the column `direccionId` on the `empresas` table. All the data in the column will be lost.
  - Added the required column `empresaId` to the `direcciones` table without a default value. This is not possible if the table is not empty.
  - Made the column `rut` on table `empresas` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_comunas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "comunas_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "provincias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_comunas" ("createdAt", "id", "nombre", "provinciaId", "updatedAt") SELECT "createdAt", "id", "nombre", "provinciaId", "updatedAt" FROM "comunas";
DROP TABLE "comunas";
ALTER TABLE "new_comunas" RENAME TO "comunas";
CREATE UNIQUE INDEX "comunas_nombre_provinciaId_key" ON "comunas"("nombre", "provinciaId");
CREATE TABLE "new_contactos_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreCompleto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "cargo" TEXT,
    "empresaId" TEXT,
    "ubicacionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contactos_empresas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contactos_empresas_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "ubicaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_contactos_empresas" ("cargo", "createdAt", "email", "empresaId", "id", "nombreCompleto", "telefono", "ubicacionId", "updatedAt") SELECT "cargo", "createdAt", "email", "empresaId", "id", "nombreCompleto", "telefono", "ubicacionId", "updatedAt" FROM "contactos_empresas";
DROP TABLE "contactos_empresas";
ALTER TABLE "new_contactos_empresas" RENAME TO "contactos_empresas";
CREATE UNIQUE INDEX "contactos_empresas_email_key" ON "contactos_empresas"("email");
CREATE TABLE "new_direcciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calle" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "depto" TEXT,
    "comunaId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "direcciones_comunaId_fkey" FOREIGN KEY ("comunaId") REFERENCES "comunas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "direcciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_direcciones" ("calle", "comunaId", "createdAt", "id", "numero", "updatedAt") SELECT "calle", "comunaId", "createdAt", "id", "numero", "updatedAt" FROM "direcciones";
DROP TABLE "direcciones";
ALTER TABLE "new_direcciones" RENAME TO "direcciones";
CREATE UNIQUE INDEX "direcciones_empresaId_key" ON "direcciones"("empresaId");
CREATE TABLE "new_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "logoUrl" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_empresas" ("createdAt", "email", "id", "logoUrl", "nombre", "rut", "telefono", "updatedAt") SELECT "createdAt", "email", "id", "logoUrl", "nombre", "rut", "telefono", "updatedAt" FROM "empresas";
DROP TABLE "empresas";
ALTER TABLE "new_empresas" RENAME TO "empresas";
CREATE UNIQUE INDEX "empresas_rut_key" ON "empresas"("rut");
CREATE UNIQUE INDEX "empresas_email_key" ON "empresas"("email");
CREATE TABLE "new_provincias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "provincias_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regiones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_provincias" ("createdAt", "id", "nombre", "regionId", "updatedAt") SELECT "createdAt", "id", "nombre", "regionId", "updatedAt" FROM "provincias";
DROP TABLE "provincias";
ALTER TABLE "new_provincias" RENAME TO "provincias";
CREATE UNIQUE INDEX "provincias_nombre_regionId_key" ON "provincias"("nombre", "regionId");
CREATE TABLE "new_regiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "paisId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "regiones_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "paises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_regiones" ("createdAt", "id", "nombre", "paisId", "updatedAt") SELECT "createdAt", "id", "nombre", "paisId", "updatedAt" FROM "regiones";
DROP TABLE "regiones";
ALTER TABLE "new_regiones" RENAME TO "regiones";
CREATE UNIQUE INDEX "regiones_nombre_paisId_key" ON "regiones"("nombre", "paisId");
CREATE TABLE "new_sucursales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccionId" TEXT NOT NULL,
    "empresaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sucursales_direccionId_fkey" FOREIGN KEY ("direccionId") REFERENCES "direcciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sucursales_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sucursales" ("createdAt", "direccionId", "email", "empresaId", "id", "nombre", "telefono", "updatedAt") SELECT "createdAt", "direccionId", "email", "empresaId", "id", "nombre", "telefono", "updatedAt" FROM "sucursales";
DROP TABLE "sucursales";
ALTER TABLE "new_sucursales" RENAME TO "sucursales";
CREATE UNIQUE INDEX "sucursales_direccionId_key" ON "sucursales"("direccionId");
CREATE TABLE "new_ubicaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreReferencial" TEXT,
    "sucursalId" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ubicaciones_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ubicaciones" ("createdAt", "id", "nombreReferencial", "notas", "sucursalId", "updatedAt") SELECT "createdAt", "id", "nombreReferencial", "notas", "sucursalId", "updatedAt" FROM "ubicaciones";
DROP TABLE "ubicaciones";
ALTER TABLE "new_ubicaciones" RENAME TO "ubicaciones";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
