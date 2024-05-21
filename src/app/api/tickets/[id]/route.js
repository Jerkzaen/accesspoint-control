import { NextResponse } from "next/server";

//CRUD 

// OBTENER UN TICKET
export function GET(request, { params }) {
return NextResponse.json({
    message: `Obteniendo un ticket ${params.id}`,
});
}

// ELIMINAR UN TICKET
export function DELETE(request, { params }) {
return NextResponse.json({
    message: `Eliminando un ticket ${params.id}`,
});
}

// ACTUALIZAR UN TICKET
export function PUT(request, { params }) {
return NextResponse.json({
    message: `Actualizando un ticket ${params.id}`,
});
}
