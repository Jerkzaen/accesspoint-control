// Guardar como scripts/restore-geo.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline/promises'; // Usando la versión de promesas

// Forma moderna y compatible de obtener la ruta del directorio
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupFilePath = path.join(__dirname, 'geografia-backup.json');

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log('Iniciando restauración de datos geográficos...');

  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ No se encontró el archivo de respaldo: ${backupFilePath}`);
    rl.close();
    return;
  }
  
  const answer = await rl.question('❓ ¿Estás seguro de que quieres BORRAR los datos geográficos y restaurarlos desde el respaldo? Esta acción no se puede deshacer. (s/n): ');
  
  if (answer.toLowerCase() !== 's') {
    console.log('Operación cancelada.');
    rl.close();
    return;
  }
  rl.close(); // Cerramos la interfaz de lectura aquí

  try {
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
    
    console.log('🗑️ Limpiando tablas geográficas existentes...');
    await prisma.comuna.deleteMany({});
    await prisma.provincia.deleteMany({});
    await prisma.region.deleteMany({});
    await prisma.pais.deleteMany({});

    console.log('🌱 Insertando datos desde el respaldo...');
    await prisma.pais.createMany({ data: backupData.paises });
    await prisma.region.createMany({ data: backupData.regiones });
    await prisma.provincia.createMany({ data: backupData.provincias });
    await prisma.comuna.createMany({ data: backupData.comunas });
    
    console.log('✅ Restauración completada con éxito.');
  } catch (error) {
    console.error('❌ Error durante el proceso de restauración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
