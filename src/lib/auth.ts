import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DURATION_S, assinarSessao, type Sessao } from "./session";
import { sessaoDoCookie } from "./sessao-atual";
import { situacaoDaSessao } from "./db";

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
  return sessaoDoCookie();
}

// Usada em páginas e server actions: garante que há alguém logado.
export async function exigirSessao() {
  const { sessao, situacao } = await situacaoDaSessao();
  if (!sessao) redirect("/login");
  if (situacao !== "ok") redirect(`/sair?motivo=${situacao}`);
  return sessao;
}

// Páginas e ações restritas ao administrador (ex.: cadastro de usuários).
export async function exigirAdmin() {
  const sessao = await exigirSessao();
  if (sessao.papel !== "admin") redirect("/");
  return sessao;
}

// Painel da plataforma: só o dono do sistema.
export async function exigirSuperadmin() {
  const sessao = await exigirSessao();
  if (!sessao.superadmin) redirect("/");
  return sessao;
}
