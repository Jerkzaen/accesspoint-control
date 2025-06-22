// src/scripts/backup-geo.ts

// Importamos la instancia centralizada de PrismaClient
import { prisma } from "@/lib/prisma"; // <--- CORRECCIÓN CLAVE: Usar la instancia centralizada
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenemos el directorio actual de una manera compatible con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupFilePath = path.join(__dirname, 'geografia-backup.json');

/**
 * Función para crear un respaldo de los datos geográficos en un archivo JSON.
 */
async function backup() {
  console.log('Iniciando respaldo de datos geográficos...');
  try {
    const paises = await prisma.pais.findMany();
    const regiones = await prisma.region.findMany();
    const provincias = await prisma.provincia.findMany();
    const comunas = await prisma.comuna.findMany();

    const backupData = {
      paises,
      regiones,
      provincias,
      comunas,
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

    console.log(`✅ Respaldo completado con éxito. Archivo guardado en: ${backupFilePath}`);
    console.log(`   - ${paises.length} países`);
    console.log(`   - ${regiones.length} regiones`);
    console.log(`   - ${provincias.length} provincias`);
    console.log(`   - ${comunas.length} comunas`);

  } catch (error) {
    console.error('❌ Error durante el proceso de respaldo:', error);
  } finally {
    // Es importante desconectar Prisma si el script es un proceso de corta duración
    // que se ejecuta y termina, para liberar la conexión.
    await prisma.$disconnect(); 
  }
}

/**
 * Lógica principal para ejecutar el script desde la línea de comandos.
 */
async function main() {
  await backup();
}

main();
