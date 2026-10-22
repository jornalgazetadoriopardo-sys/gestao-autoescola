"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { dbGlobal } from "@/lib/db";
import { exigirSuperadmin } from "@/lib/auth";
import type { EstadoForm } from "@/components/form-acao";

function texto(dados: FormData, campo: string) {
  const v = String(dados.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

// Cria uma autoescola nova, já com o primeiro administrador dela.
export async function criarAutoescola(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSuperadmin();

  const nome = texto(dados, "nome");
  const cidade = texto(dados, "cidade");
  const uf = texto(dados, "uf")?.toUpperCase().slice(0, 2) ?? null;
  const adminNome = texto(dados, "adminNome");
  const email = texto(dados, "email")?.toLowerCase();
  const senha = String(dados.get("senha") ?? "");

  if (!nome) return { erro: "Informe o nome da autoescola." };
  if (!adminNome) return { erro: "Informe o nome do administrador." };
  if (!email || !email.includes("@")) return { erro: "Informe um e-mail válido para o administrador." };
  if (senha.length < 8) return { erro: "A senha deve ter pelo menos 8 caracteres." };

  const senhaHash = await bcrypt.hash(senha, 10);
  try {
    await dbGlobal.$transaction(async (tx) => {
      const autoescola = await tx.autoescola.create({ data: { nome } });
      await tx.configuracao.create({ data: { id: autoescola.id, nome, cidade, uf } });
      await tx.usuario.create({
        data: { autoescolaId: autoescola.id, nome: adminNome, email, senhaHash, papel: "admin" },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Este e-mail já é usado por outro usuário do sistema." };
    }
    throw e;
  }
  revalidatePath("/plataforma");
  return { ok: `Autoescola ${nome} criada. O administrador já pode entrar com ${email}.` };
}

// Suspende ou reativa o acesso de uma autoescola (os dados continuam guardados).
export async function alternarAutoescola(autoescolaId: number) {
  const sessao = await exigirSuperadmin();
  if (autoescolaId === sessao.autoescolaId) throw new Error("Você não pode suspender a sua própria autoescola.");
  const autoescola = await dbGlobal.autoescola.findUnique({ where: { id: autoescolaId } });
  if (!autoescola) return;
  await dbGlobal.autoescola.update({ where: { id: autoescolaId }, data: { ativo: !autoescola.ativo } });
  revalidatePath("/plataforma");
}
