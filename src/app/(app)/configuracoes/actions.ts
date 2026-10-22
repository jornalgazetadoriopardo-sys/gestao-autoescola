"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirAdmin, exigirSessao } from "@/lib/auth";
import type { EstadoForm } from "@/components/form-acao";

function texto(dados: FormData, campo: string) {
  const v = String(dados.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

const LOGO_MAX = 600_000; // ~450 KB de imagem; o navegador já reduz antes de enviar

export async function salvarConfig(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirAdmin();

  const nome = texto(dados, "nome");
  if (!nome) return { erro: "Informe o nome da autoescola." };

  const logo = String(dados.get("logo") ?? "");
  if (logo && (!/^data:image\/(png|jpeg|webp);base64,/.test(logo) || logo.length > LOGO_MAX)) {
    return { erro: "Logotipo inválido. Use uma imagem PNG ou JPG." };
  }

  const uf = texto(dados, "uf")?.toUpperCase().slice(0, 2) ?? null;

  // Expediente: horários oferecidos ao agendar aulas.
  const horaInicio = String(dados.get("horaInicio") ?? "");
  const horaFim = String(dados.get("horaFim") ?? "");
  const intervaloMin = Number(dados.get("intervaloMin"));
  if (!/^\d{2}:\d{2}$/.test(horaInicio) || !/^\d{2}:\d{2}$/.test(horaFim) || horaFim <= horaInicio) {
    return { erro: "Expediente inválido: o fim deve ser depois do início." };
  }
  if (![10, 15, 20, 30, 45, 50, 60, 90, 100, 120].includes(intervaloMin)) {
    return { erro: "Escolha o intervalo entre os horários das aulas." };
  }
  const campos = {
    nome,
    razaoSocial: texto(dados, "razaoSocial"),
    cnpj: texto(dados, "cnpj"),
    endereco: texto(dados, "endereco"),
    bairro: texto(dados, "bairro"),
    cidade: texto(dados, "cidade"),
    uf,
    cep: texto(dados, "cep"),
    telefone: texto(dados, "telefone"),
    whatsapp: texto(dados, "whatsapp"),
    email: texto(dados, "email"),
    chavePix: texto(dados, "chavePix"),
    avisoCarne: texto(dados, "avisoCarne"),
    orientacoesAluno: texto(dados, "orientacoesAluno"),
    horaInicio,
    horaFim,
    intervaloMin,
    logo: logo || null,
  };

  await db.configuracao.upsert({ where: { id: 1 }, create: { id: 1, ...campos }, update: campos });
  revalidatePath("/", "layout");
  return { ok: "Dados da autoescola salvos!" };
}

export async function criarUsuario(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirAdmin();

  const nome = texto(dados, "nome");
  const email = texto(dados, "email")?.toLowerCase();
  const senha = String(dados.get("senha") ?? "");
  const papel = dados.get("papel") === "admin" ? "admin" : "secretaria";

  if (!nome) return { erro: "Informe o nome." };
  if (!email || !email.includes("@")) return { erro: "Informe um e-mail válido." };
  if (senha.length < 8) return { erro: "A senha deve ter pelo menos 8 caracteres." };

  try {
    await db.usuario.create({ data: { nome, email, papel, senhaHash: await bcrypt.hash(senha, 10) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Já existe um usuário com este e-mail." };
    }
    throw e;
  }
  revalidatePath("/configuracoes");
  return { ok: `Usuário ${nome} criado. Ele já pode entrar com o e-mail e a senha informados.` };
}

export async function alternarUsuario(usuarioId: number) {
  const sessao = await exigirAdmin();
  if (usuarioId === sessao.usuarioId) throw new Error("Você não pode desativar o seu próprio usuário.");
  const usuario = await db.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) return;
  await db.usuario.update({ where: { id: usuarioId }, data: { ativo: !usuario.ativo } });
  revalidatePath("/configuracoes");
}

export async function trocarSenha(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirSessao();
  const atual = String(dados.get("atual") ?? "");
  const nova = String(dados.get("nova") ?? "");
  const confirmacao = String(dados.get("confirmacao") ?? "");

  const usuario = await db.usuario.findUnique({ where: { id: sessao.usuarioId } });
  if (!usuario || !(await bcrypt.compare(atual, usuario.senhaHash)))
    return { erro: "A senha atual está incorreta." };
  if (nova.length < 8) return { erro: "A nova senha deve ter pelo menos 8 caracteres." };
  if (nova !== confirmacao) return { erro: "A confirmação não é igual à nova senha." };

  await db.usuario.update({ where: { id: usuario.id }, data: { senhaHash: await bcrypt.hash(nova, 10) } });
  return { ok: "Senha alterada com sucesso!" };
}
