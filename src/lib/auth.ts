import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_DURATION_S,
  assinarSessao,
  verificarSessao,
  type Sessao,
} from "./session";

export async function iniciarSessao(sessao: Sessao) {
  const token = await assinarSessao(sessao);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_S,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function obterSessao() {
  return verificarSessao((await cookies()).get(SESSION_COOKIE)?.value);
}

// Usada em páginas e server actions: garante que há alguém logado.
export async function exigirSessao() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  return sessao;
}

// Páginas e ações restritas ao administrador (ex.: cadastro de usuários).
export async function exigirAdmin() {
  const sessao = await exigirSessao();
  if (sessao.papel !== "admin") redirect("/");
  return sessao;
}
