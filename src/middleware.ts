import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verificarSessao } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const sessao = await verificarSessao(req.cookies.get(SESSION_COOKIE)?.value);
  const naLogin = req.nextUrl.pathname === "/login";

  if (!sessao && !naLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (sessao && naLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
