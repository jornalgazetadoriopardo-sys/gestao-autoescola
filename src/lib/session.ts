import { SignJWT, jwtVerify } from "jose";

// Funções de sessão sem dependência do Node, usadas também pelo middleware.

export const SESSION_COOKIE = "sessao";
export const SESSION_DURATION_S = 60 * 60 * 12; // 12 horas

export type Sessao = {
  usuarioId: number;
  nome: string;
  papel: string;
};

function chave() {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) throw new Error("SESSION_SECRET não definido no .env");
  return new TextEncoder().encode(segredo);
}

export async function assinarSessao(sessao: Sessao) {
  return new SignJWT(sessao)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_S}s`)
    .sign(chave());
}

export async function verificarSessao(token: string | undefined): Promise<Sessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave());
    return {
      usuarioId: Number(payload.usuarioId),
      nome: String(payload.nome),
      papel: String(payload.papel),
    };
  } catch {
    return null;
  }
}
