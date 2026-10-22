"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { dbGlobal } from "@/lib/db";
import { iniciarSessao, encerrarSessao } from "@/lib/auth";
import type { EstadoForm } from "@/components/form-acao";

export async function entrar(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const email = String(dados.get("email") ?? "").trim().toLowerCase();
  const senha = String(dados.get("senha") ?? "");

  // Ainda não há sessão: o usuário é procurado em todas as autoescolas.
  const usuario = await dbGlobal.usuario.findUnique({ where: { email }, include: { autoescola: true } });
  if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    return { erro: "E-mail ou senha incorretos." };
  }
  if (!usuario.autoescola.ativo) {
    return { erro: "O acesso desta autoescola está suspenso. Fale com o responsável pelo sistema." };
  }

  await iniciarSessao({
    usuarioId: usuario.id,
    autoescolaId: usuario.autoescolaId,
    nome: usuario.nome,
    papel: usuario.papel,
    superadmin: usuario.superadmin,
  });
  redirect("/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}
