"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirAdmin, exigirSessao } from "@/lib/auth";
import { CONTRATO_MAX, conferirModelo } from "@/lib/contrato";
import { TAXAS_CONFIGURAVEIS, type TaxasPadrao } from "@/lib/etapas";
import { lerMoeda } from "@/lib/format";
import { CALENDARIO_SP, FINAIS, lerCalendario } from "@/lib/licenciamento";
import type { EstadoForm } from "@/components/form-acao";

function texto(dados: FormData, campo: string) {
  const v = String(dados.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

const LOGO_MAX = 600_000; // ~450 KB de imagem; o navegador já reduz antes de enviar

export async function salvarConfig(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirAdmin();

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

  // As configurações usam o mesmo id da autoescola.
  const id = sessao.autoescolaId;
  await db.configuracao.upsert({ where: { id }, create: { id, ...campos }, update: campos });
  await db.autoescola.update({ where: { id }, data: { nome } });
  revalidatePath("/", "layout");
  return { ok: "Dados da autoescola salvos!" };
}

export async function criarUsuario(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirAdmin();

  const nome = texto(dados, "nome");
  const email = texto(dados, "email")?.toLowerCase();
  const senha = String(dados.get("senha") ?? "");
  const papel = dados.get("papel") === "admin" ? "admin" : "secretaria";

  if (!nome) return { erro: "Informe o nome." };
  if (!email || !email.includes("@")) return { erro: "Informe um e-mail válido." };
  if (senha.length < 8) return { erro: "A senha deve ter pelo menos 8 caracteres." };

  try {
    await db.usuario.create({
      data: { autoescolaId: sessao.autoescolaId, nome, email, papel, senhaHash: await bcrypt.hash(senha, 10) },
    });
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
  if (!usuario || !(await bcrypt.compare(atual, usuario.senhaHash))) return { erro: "A senha atual está incorreta." };
  if (nova.length < 8) return { erro: "A nova senha deve ter pelo menos 8 caracteres." };
  if (nova !== confirmacao) return { erro: "A confirmação não é igual à nova senha." };

  await db.usuario.update({ where: { id: usuario.id }, data: { senhaHash: await bcrypt.hash(nova, 10) } });
  return { ok: "Senha alterada com sucesso!" };
}

// Altera nome, e-mail e acesso de um usuário; a senha só muda se for preenchida.
export async function editarUsuario(usuarioId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirAdmin();
  const nome = texto(dados, "nome");
  const email = texto(dados, "email")?.toLowerCase();
  const senha = String(dados.get("senha") ?? "");
  // Ninguém tira o próprio acesso de administrador (ficaria sem como voltar).
  const papel = usuarioId === sessao.usuarioId ? "admin" : dados.get("papel") === "admin" ? "admin" : "secretaria";

  if (!nome) return { erro: "Informe o nome." };
  if (!email || !email.includes("@")) return { erro: "Informe um e-mail válido." };
  if (senha && senha.length < 8) return { erro: "A nova senha deve ter pelo menos 8 caracteres." };

  const usuario = await db.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) return { erro: "Usuário não encontrado." };
  try {
    await db.usuario.update({
      where: { id: usuarioId },
      data: { nome, email, papel, ...(senha ? { senhaHash: await bcrypt.hash(senha, 10) } : {}) },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { erro: "Este e-mail já é usado por outro usuário do sistema." };
    }
    throw e;
  }
  revalidatePath("/configuracoes");
  redirect("/configuracoes?aba=usuarios");
}

export async function excluirUsuario(usuarioId: number) {
  const sessao = await exigirAdmin();
  if (usuarioId === sessao.usuarioId) throw new Error("Você não pode excluir o seu próprio usuário.");
  const usuario = await db.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario || usuario.superadmin) return;
  await db.usuario.delete({ where: { id: usuarioId } });
  revalidatePath("/configuracoes");
}

// Recebe o modelo de contrato (.docx) da autoescola.
export async function salvarContrato(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirAdmin();
  const arquivo = dados.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Escolha o arquivo do contrato (.docx)." };
  if (!/\.docx$/i.test(arquivo.name)) {
    return {
      erro: "Use um arquivo do Word no formato .docx. No Word: Arquivo > Salvar como > Documento do Word (.docx).",
    };
  }
  if (arquivo.size > CONTRATO_MAX)
    return { erro: "Arquivo grande demais (máximo 3 MB). Tire imagens pesadas do documento." };

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const conferido = conferirModelo(bytes);
  if ("erro" in conferido) return conferido;

  const id = sessao.autoescolaId;
  const campos = { contratoArquivo: bytes, contratoNome: arquivo.name, contratoEm: new Date() };
  const config = await db.configuracao.findFirst({ select: { id: true } });
  if (config) await db.configuracao.update({ where: { id }, data: campos });
  else {
    const autoescola = await db.autoescola.findFirstOrThrow();
    await db.configuracao.create({ data: { id, nome: autoescola.nome, ...campos } });
  }
  revalidatePath("/configuracoes");
  const aviso = conferido.desconhecidas.length
    ? ` Atenção: estas marcações não são reconhecidas e vão sair em branco: ${conferido.desconhecidas.map((t) => `{{${t}}}`).join(", ")}.`
    : "";
  return { ok: `Contrato salvo! Ele já pode ser gerado na ficha de cada aluno.${aviso}` };
}

export async function removerContrato() {
  await exigirAdmin();
  const config = await db.configuracao.findFirst({ select: { id: true } });
  if (config) {
    await db.configuracao.update({
      where: { id: config.id },
      data: { contratoArquivo: null, contratoNome: null, contratoEm: null },
    });
  }
  revalidatePath("/configuracoes");
}

// Onde saem recibos e carnê por padrão: impressora comum (A4) ou térmica (80 mm).
export async function salvarImpressora(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirAdmin();
  const impressoraRecibo = dados.get("impressoraRecibo") === "termica" ? "termica" : "a4";
  const id = sessao.autoescolaId;
  const autoescola = await db.autoescola.findFirstOrThrow();
  await db.configuracao.upsert({
    where: { id },
    create: { id, nome: autoescola.nome, impressoraRecibo },
    update: { impressoraRecibo },
  });
  revalidatePath("/configuracoes");
  return {
    ok:
      impressoraRecibo === "termica"
        ? "Pronto: recibos e carnê vão sair na térmica."
        : "Pronto: recibos e carnê vão sair em folha A4.",
  };
}

// Valor e quem paga cada exame/taxa, usados nas matrículas novas.
export async function salvarTaxas(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirAdmin();
  const taxas: TaxasPadrao = {};
  for (const [tipo, titulo] of TAXAS_CONFIGURAVEIS) {
    const texto = String(dados.get(`valor_${tipo}`) ?? "").trim();
    const valor = texto ? lerMoeda(texto) : null;
    if (texto && valor === null) return { erro: `Valor inválido em "${titulo}". Ex.: 120,00` };
    taxas[tipo] = { valor, cobranca: dados.get(`cobranca_${tipo}`) === "autoescola" ? "autoescola" : "aluno" };
  }
  const id = sessao.autoescolaId;
  const autoescola = await db.autoescola.findFirstOrThrow();
  await db.configuracao.upsert({
    where: { id },
    create: { id, nome: autoescola.nome, taxasPadrao: taxas },
    update: { taxasPadrao: taxas },
  });
  revalidatePath("/configuracoes");
  return { ok: "Valores salvos! Eles entram nas próximas matrículas." };
}

// Calendário do licenciamento por final de placa. "padrao" volta ao de SP.
export async function salvarCalendario(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const sessao = await exigirAdmin();
  const restaurar = dados.get("acao") === "padrao";
  const calendario = restaurar
    ? CALENDARIO_SP
    : {
        leve: Object.fromEntries(FINAIS.map((f) => [f, Number(dados.get(`leve_${f}`))])),
        pesado: Object.fromEntries(FINAIS.map((f) => [f, Number(dados.get(`pesado_${f}`))])),
      };
  const conferido = lerCalendario(calendario);
  const id = sessao.autoescolaId;
  const autoescola = await db.autoescola.findFirstOrThrow();
  await db.configuracao.upsert({
    where: { id },
    create: { id, nome: autoescola.nome, calendarioLicenciamento: conferido },
    update: { calendarioLicenciamento: conferido },
  });
  revalidatePath("/configuracoes");
  revalidatePath("/veiculos");
  revalidatePath("/");
  return { ok: restaurar ? "Calendário de SP restaurado." : "Calendário salvo!" };
}
