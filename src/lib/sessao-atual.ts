import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verificarSessao } from "./session";

// Sessão da requisição atual, lida do cookie (uma vez por requisição).
export const sessaoDoCookie = cache(async () => verificarSessao((await cookies()).get(SESSION_COOKIE)?.value));
