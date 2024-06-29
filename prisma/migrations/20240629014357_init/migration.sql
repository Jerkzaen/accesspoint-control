-- CreateTable
CREATE TABLE "hubUsb" (
    "_id" TEXT NOT NULL PRIMARY KEY,
    "modeloHubUsb" TEXT NOT NULL,
    "hubEnUso" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
