import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Encerra a sessão e volta para o login (usado quando o usuário foi
// desativado ou a autoescola foi suspensa).
export function GET(req: NextRequest) {
  const destino = new URL("/login", req.url);
  const motivo = req.nextUrl.searchParams.get("motivo");
  if (motivo === "suspensa" || motivo === "desativado") destino.searchParams.set("motivo", motivo);
  const resposta = NextResponse.redirect(destino);
  resposta.cookies.delete(SESSION_COOKIE);
  return resposta;
}
