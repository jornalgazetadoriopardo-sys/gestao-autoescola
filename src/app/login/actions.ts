"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { iniciarSessao, encerrarSessao } from "@/lib/auth";
import type { EstadoForm } from "@/components/form-acao";

export async function entrar(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const email = String(dados.get("email") ?? "").trim().toLowerCase();
  const senha = String(dados.get("senha") ?? "");

  const usuario = await db.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    return { erro: "E-mail ou senha incorretos." };
  }

  await iniciarSessao({ usuarioId: usuario.id, nome: usuario.nome, papel: usuario.papel });
  redirect("/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}
