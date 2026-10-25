"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Etapa } from "@prisma/client";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { FORMAS_PAGAMENTO, lerMoeda } from "@/lib/format";
import { REEXAME, TIPOS_ETAPA, lerTaxasPadrao } from "@/lib/etapas";
import type { EstadoForm } from "@/components/form-acao";

const DIA = /^\d{4}-\d{2}-\d{2}$/;

function dia(v: string) {
  return DIA.test(v) ? new Date(`${v}T00:00:00Z`) : null;
}

async function revalidar(matriculaId: number) {
  const m = await db.matricula.findUnique({ where: { id: matriculaId }, select: { alunoId: true } });
  if (m) revalidatePath(`/alunos/${m.alunoId}`);
  revalidatePath("/exames");
  revalidatePath("/");
}

// Só volta para endereços internos do sistema.
function destinoSeguro(voltar: string, padrao: string) {
  return voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : padrao;
}

// Reprovou numa prova do Detran: cria a nova tentativa com a taxa de reexame,
// a não ser que ela já exista.
async function criarReexame(e: Etapa) {
  if (e.resultado !== "falhou" || !TIPOS_ETAPA[e.tipo]?.reexame) return;
  const pendente = await db.etapa.count({
    where: { matriculaId: e.matriculaId, tipo: e.tipo, categoria: e.categoria, resultado: null, id: { not: e.id } },
  });
  if (pendente) return;
  const tentativas = await db.etapa.count({
    where: { matriculaId: e.matriculaId, tipo: e.tipo, categoria: e.categoria },
  });
  const config = await db.configuracao.findFirst({ select: { taxasPadrao: true } });
  const taxa = lerTaxasPadrao(config?.taxasPadrao)[REEXAME];
  const base = e.tipo === "exame_pratico" ? `Reexame prático – categoria ${e.categoria}` : "Reexame teórico";
  await db.etapa.create({
    data: {
      matriculaId: e.matriculaId,
      tipo: e.tipo,
      categoria: e.categoria,
      descricao: `${base} (${tentativas + 1}ª tentativa)`,
      ordem: e.ordem,
      valorCentavos: taxa?.valor ?? e.valorCentavos,
      cobranca: taxa?.cobranca ?? e.cobranca,
    },
  });
}

// Cadastra ou altera um exame/taxa da matrícula.
export async function salvarEtapa(
  id: number | null,
  matriculaId: number,
  _: EstadoForm,
  dados: FormData,
): Promise<EstadoForm> {
  await exigirSessao();
  const tipo = String(dados.get("tipo") ?? "");
  if (!(tipo in TIPOS_ETAPA)) return { erro: "Escolha o tipo." };
  const descricao = String(dados.get("descricao") ?? "").trim() || TIPOS_ETAPA[tipo].titulo;
  const categoria = tipo === "exame_pratico" ? String(dados.get("categoria") ?? "") : null;
  if (tipo === "exame_pratico" && !"ABCDE".includes(categoria || "x")) return { erro: "Escolha a categoria da prova." };

  const valorTexto = String(dados.get("valor") ?? "").trim();
  const valorCentavos = valorTexto ? lerMoeda(valorTexto) : null;
  if (valorTexto && valorCentavos === null) return { erro: "Valor inválido. Ex.: 120,00" };

  const resultadoTexto = String(dados.get("resultado") ?? "");
  const resultado = resultadoTexto === "ok" || resultadoTexto === "falhou" ? resultadoTexto : null;
  const cobranca = dados.get("cobranca") === "autoescola" ? "autoescola" : "aluno";
  const pagoEm = dia(String(dados.get("pagoEm") ?? ""));
  const forma = String(dados.get("forma") ?? "");
  if (pagoEm && cobranca === "autoescola" && !(forma in FORMAS_PAGAMENTO)) {
    return { erro: "Escolha a forma em que o aluno pagou." };
  }

  const campos = {
    tipo,
    descricao,
    categoria,
    data: dia(String(dados.get("data") ?? "")),
    resultado,
    valorCentavos,
    cobranca,
    pagoEm,
    forma: pagoEm && cobranca === "autoescola" ? forma : null,
    obs: String(dados.get("obs") ?? "").trim() || null,
  };

  let etapa: Etapa;
  if (id) {
    if (!(await db.etapa.findUnique({ where: { id } }))) return { erro: "Item não encontrado." };
    etapa = await db.etapa.update({ where: { id }, data: campos });
  } else {
    const ultima = await db.etapa.aggregate({ where: { matriculaId }, _max: { ordem: true } });
    etapa = await db.etapa.create({ data: { ...campos, matriculaId, ordem: (ultima._max.ordem ?? 0) + 1 } });
  }
  await criarReexame(etapa);
  await revalidar(etapa.matriculaId);
  const m = await db.matricula.findUnique({ where: { id: etapa.matriculaId }, select: { alunoId: true } });
  redirect(destinoSeguro(String(dados.get("voltar") ?? ""), `/alunos/${m?.alunoId ?? ""}`));
}

// Botões rápidos: aprovado/reprovado (ou apto/inapto, concluído) e desfazer.
export async function marcarEtapa(id: number, resultado: "ok" | "falhou" | null) {
  await exigirSessao();
  const atual = await db.etapa.findUnique({ where: { id } });
  if (!atual) return;
  const etapa = await db.etapa.update({ where: { id }, data: { resultado } });
  await criarReexame(etapa);
  await revalidar(etapa.matriculaId);
}

// `voltar`: para onde ir depois (quando a exclusão é feita na própria tela do item).
export async function excluirEtapa(id: number, voltar?: string) {
  await exigirSessao();
  const etapa = await db.etapa.findUnique({ where: { id } });
  if (!etapa) return;
  await db.etapa.delete({ where: { id } });
  await revalidar(etapa.matriculaId);
  if (voltar) redirect(destinoSeguro(voltar, "/exames"));
}

// Recebe do aluno uma taxa cobrada pela autoescola.
export async function receberEtapa(id: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();
  const data = dia(String(dados.get("data") ?? ""));
  const valor = lerMoeda(String(dados.get("valor") ?? ""));
  const forma = String(dados.get("forma") ?? "");
  if (!data) return { erro: "Informe a data do pagamento." };
  if (valor === null || valor <= 0) return { erro: "Informe o valor recebido. Ex.: 120,00" };
  if (!(forma in FORMAS_PAGAMENTO)) return { erro: "Escolha a forma de pagamento." };
  const etapa = await db.etapa.findUnique({ where: { id } });
  if (!etapa) return { erro: "Item não encontrado." };
  if (etapa.pagoEm) return { erro: "Esta taxa já foi paga." };
  await db.etapa.update({ where: { id }, data: { pagoEm: data, valorCentavos: valor, forma, cobranca: "autoescola" } });
  await revalidar(etapa.matriculaId);
  const destino = destinoSeguro(String(dados.get("voltar") ?? ""), "/exames?aba=receber");
  redirect(`${destino}${destino.includes("?") ? "&" : "?"}taxaRecebida=${id}`);
}
