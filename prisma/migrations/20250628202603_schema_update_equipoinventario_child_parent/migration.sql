-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_contactos_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreCompleto" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "cargo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
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
CREATE TABLE "new_empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "logoUrl" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "direccionPrincipalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "empresas_direccionPrincipalId_fkey" FOREIGN KEY ("direccionPrincipalId") REFERENCES "direcciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_empresas" ("createdAt", "direccionPrincipalId", "email", "id", "logoUrl", "nombre", "rut", "telefono", "updatedAt") SELECT "createdAt", "direccionPrincipalId", "email", "id", "logoUrl", "nombre", "rut", "telefono", "updatedAt" FROM "empresas";
DROP TABLE "empresas";
ALTER TABLE "new_empresas" RENAME TO "empresas";
CREATE UNIQUE INDEX "empresas_rut_key" ON "empresas"("rut");
CREATE UNIQUE INDEX "empresas_direccionPrincipalId_key" ON "empresas"("direccionPrincipalId");
CREATE TABLE "new_equipos_inventario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreDescriptivo" TEXT NOT NULL,
    "identificadorUnico" TEXT NOT NULL,
    "parent_equipo_id" TEXT,
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
    "empresaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "equipos_inventario_parent_equipo_id_fkey" FOREIGN KEY ("parent_equipo_id") REFERENCES "equipos_inventario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipos_inventario_ubicacionActualId_fkey" FOREIGN KEY ("ubicacionActualId") REFERENCES "ubicaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipos_inventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_equipos_inventario" ("biartic_tipo_dispositivo", "createdAt", "descripcionAdicional", "empresaId", "estadoEquipo", "fechaAdquisicion", "id", "identificadorUnico", "marca", "modelo", "nombreDescriptivo", "notasGenerales", "panel_vts_serie", "pedal_vts_serie", "proveedor", "tipoEquipo", "ubicacionActualId", "updatedAt") SELECT "biartic_tipo_dispositivo", "createdAt", "descripcionAdicional", "empresaId", "estadoEquipo", "fechaAdquisicion", "id", "identificadorUnico", "marca", "modelo", "nombreDescriptivo", "notasGenerales", "panel_vts_serie", "pedal_vts_serie", "proveedor", "tipoEquipo", "ubicacionActualId", "updatedAt" FROM "equipos_inventario";
DROP TABLE "equipos_inventario";
ALTER TABLE "new_equipos_inventario" RENAME TO "equipos_inventario";
CREATE UNIQUE INDEX "equipos_inventario_identificadorUnico_key" ON "equipos_inventario"("identificadorUnico");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
