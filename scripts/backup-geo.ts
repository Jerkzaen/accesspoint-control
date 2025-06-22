// Guardar como scripts/backup-geo.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Forma moderna y compatible de obtener la ruta del directorio
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupFilePath = path.join(__dirname, 'geografia-backup.json');

const prisma = new PrismaClient();

async function main() {
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

    console.log(`✅ Respaldo completado con éxito. Archivo guardado en:`);
    console.log(`   ${backupFilePath}`);
  } catch (error) {
    console.error('❌ Error durante el proceso de respaldo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
