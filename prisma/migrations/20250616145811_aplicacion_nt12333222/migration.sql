-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "rol" TEXT NOT NULL DEFAULT 'TECNICO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

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
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT,
    "logoUrl" TEXT,
    "telefono" TEXT,
    "email" TEXT,
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
    "empresaId" TEXT,
    "ubicacionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contactos_empresas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contactos_empresas_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "ubicaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "sucursales_direccionId_fkey" FOREIGN KEY ("direccionId") REFERENCES "direcciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sucursales_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "Ticket" (
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

-- CreateTable
CREATE TABLE "AccionTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaAccion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "categoria" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccionTicket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccionTicket_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equipos_inventario" (
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
    "empresaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "equipos_inventario_ubicacionActualId_fkey" FOREIGN KEY ("ubicacionActualId") REFERENCES "ubicaciones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipos_inventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipoEnPrestamo" (
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
    CONSTRAINT "EquipoEnPrestamo_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "paises_nombre_key" ON "paises"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "regiones_nombre_paisId_key" ON "regiones"("nombre", "paisId");

-- CreateIndex
CREATE UNIQUE INDEX "provincias_nombre_regionId_key" ON "provincias"("nombre", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "comunas_nombre_provinciaId_key" ON "comunas"("nombre", "provinciaId");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_nombre_key" ON "empresas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "contactos_empresas_email_key" ON "contactos_empresas"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_direccionId_key" ON "sucursales"("direccionId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_numeroCaso_key" ON "Ticket"("numeroCaso");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_inventario_identificadorUnico_key" ON "equipos_inventario"("identificadorUnico");
