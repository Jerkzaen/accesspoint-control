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
CREATE TABLE "empresas_clientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "contactos_clientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreCompleto" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "cargo" TEXT,
    "empresaClienteId" TEXT NOT NULL,
    "ubicacionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contactos_clientes_empresaClienteId_fkey" FOREIGN KEY ("empresaClienteId") REFERENCES "empresas_clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contactos_clientes_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombreReferencial" TEXT,
    "direccionCompleta" TEXT NOT NULL,
    "ciudad" TEXT,
    "region" TEXT,
    "pais" TEXT,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    "empresaClienteId" TEXT,
    "ubicacionId" TEXT,
    "tecnicoAsignadoId" TEXT,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSolucionEstimada" DATETIME,
    "fechaSolucionReal" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_solicitanteClienteId_fkey" FOREIGN KEY ("solicitanteClienteId") REFERENCES "contactos_clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_empresaClienteId_fkey" FOREIGN KEY ("empresaClienteId") REFERENCES "empresas_clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_tecnicoAsignadoId_fkey" FOREIGN KEY ("tecnicoAsignadoId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccionTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaAccion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    CONSTRAINT "AccionTicket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccionTicket_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipoInventario" (
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
    CONSTRAINT "EquipoInventario_ubicacionActualId_fkey" FOREIGN KEY ("ubicacionActualId") REFERENCES "Ubicacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "EquipoEnPrestamo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "EquipoInventario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquipoEnPrestamo_prestadoAContactoId_fkey" FOREIGN KEY ("prestadoAContactoId") REFERENCES "contactos_clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
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
CREATE UNIQUE INDEX "empresas_clientes_nombre_key" ON "empresas_clientes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_clientes_rut_key" ON "empresas_clientes"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_clientes_email_key" ON "empresas_clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contactos_clientes_email_key" ON "contactos_clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_numeroCaso_key" ON "Ticket"("numeroCaso");

-- CreateIndex
CREATE UNIQUE INDEX "EquipoInventario_identificadorUnico_key" ON "EquipoInventario"("identificadorUnico");
