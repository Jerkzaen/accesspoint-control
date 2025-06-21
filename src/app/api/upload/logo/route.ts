//src/app/api/upload/logo/route.ts
import { NextRequest, NextResponse } from "next/server";

// Se define el tamaño máximo permitido para el archivo SVG (en bytes)
// 100KB es un tamaño razonable para logos SVG.
const MAX_FILE_SIZE = 100 * 1024; // 100 KB

/**
 * Maneja las solicitudes POST para la subida de archivos de logo.
 * Este endpoint recibe un archivo SVG, lo valida, lo convierte a una Data URI (Base64)
 * y devuelve esta URI.
 *
 * @param request La solicitud NextRequest que contiene el FormData con el archivo.
 * @returns NextResponse con la Data URI del logo o un mensaje de error.
 */
export async function POST(request: NextRequest) {
  try {
    // Se espera que la solicitud contenga un FormData
    const formData = await request.formData();
    const file = formData.get("logo") as File; // Se obtiene el archivo usando la clave "logo"

    // 1. Validación básica: Verificar si se recibió un archivo
    if (!file) {
      return NextResponse.json(
        { message: "No se proporcionó ningún archivo." },
        { status: 400 }
      );
    }

    // 2. Validación de tipo de archivo (MIME Type)
    // Se asegura que el archivo sea un SVG.
    if (file.type !== "image/svg+xml") {
      return NextResponse.json(
        { message: "Tipo de archivo no permitido. Solo se aceptan archivos SVG." },
        { status: 400 }
      );
    }

    // 3. Validación de tamaño de archivo
    // Se previene la subida de archivos excesivamente grandes.
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: `El archivo es demasiado grande. El tamaño máximo permitido es ${MAX_FILE_SIZE / 1024} KB.` },
        { status: 400 }
      );
    }

    // 4. Leer el contenido del archivo como ArrayBuffer
    const buffer = await file.arrayBuffer();
    // Se convierte el ArrayBuffer a un Buffer de Node.js para codificación Base64
    const fileBuffer = Buffer.from(buffer);

    // 5. Convertir el Buffer a Base64
    const base64Svg = fileBuffer.toString("base64");

    // 6. Construir la Data URI
    // Formato: data:[<MIME-type>][;charset=<encoding>][;base64],<data>
    const dataUri = `data:${file.type};base64,${base64Svg}`;

    // 7. Devolver la Data URI en la respuesta
    return NextResponse.json({ dataUri });

  } catch (error) {
    console.error("Error al procesar la subida del logo:", error);
    return NextResponse.json(
      { message: "Error interno del servidor al procesar el archivo." },
      { status: 500 }
    );
  }
}
