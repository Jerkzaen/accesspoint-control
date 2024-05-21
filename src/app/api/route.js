import NextResponse from "next-response";

export function GET() {
  return NextResponse.json({
    message: "Hello World!",
  });
}
