"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { DURACOES, TIPOS_AULA, lerDataHora } from "@/lib/aulas";
import { verificarAulas, type NovaAula } from "@/lib/validar-aula";
import type { EstadoForm } from "@/components/form-acao";

const MAX_LOTE = 60;

function id(dados: FormData, campo: string) {
  const v = Number(dados.get(campo));
  return Number.isInteger(v) && v > 0 ? v : null;
}

// Campos comuns a uma aula (ou a todas as aulas de um lote). No lote o
// instrutor vem em cada aula, então ele não é exigido aqui.
function lerComum(dados: FormData, exigirInstrutor = true) {
  const tipo = String(dados.get("tipo") ?? "");
  const instrutorId = id(dados, "instrutorId") ?? 0;
  const veiculoId = tipo === "pratica" ? id(dados, "veiculoId") : null;
  const duracaoMin = Number(dados.get("duracaoMin"));
  const obs = String(dados.get("obs") ?? "").trim() || null;

  if (!(tipo in TIPOS_AULA)) return { erro: "Selecione o tipo de aula." };
  if (exigirInstrutor && !instrutorId) return { erro: "Selecione o instrutor." };
  if (tipo === "pratica" && !veiculoId) return { erro: "Selecione o veículo da aula prática." };
  if (!DURACOES.includes(duracaoMin)) return { erro: "Duração inválida." };
  return { tipo, instrutorId, veiculoId, duracaoMin, obs };
}

function diaDe(data: Date) {
  return data.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function revalidar(alunoId: number) {
  revalidatePath("/aulas");
  revalidatePath("/");
  revalidatePath(`/alunos/${alunoId}`);
}

// Só volta para endereços internos do sistema.
function destinoSeguro(voltar: string, padrao: string) {
  return voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : padrao;
}

// Agendamento avulso: uma aula.
export async function agendarAula(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();

  const matriculaId = id(dados, "matriculaId");
  if (!matriculaId) return { erro: "Selecione o aluno / matrícula." };
  const comum = lerComum(dados);
  if ("erro" in comum) return comum;
  const dataHora = lerDataHora(String(dados.get("data") ?? ""), String(dados.get("hora") ?? ""));
  if (!dataHora) return { erro: "Informe a data e o horário." };

  const aula: NovaAula = { ...comum, dataHora };
  const erro = await verificarAulas(matriculaId, [aula]);
  if (erro) return { erro };

  const criada = await db.aula.create({
    data: { matriculaId, ...aula, obs: comum.obs },
    include: { matricula: true },
  });
  revalidar(criada.matricula.alunoId);
  redirect(`/aulas?dia=${diaDe(dataHora)}`);
}

// Agendamento em lote: várias datas e horários de uma vez, com os mesmos
// instrutor, veículo e duração. Ou agenda todas, ou nenhuma.
export async function agendarVarias(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();

  const matriculaId = id(dados, "matriculaId");
  if (!matriculaId) return { erro: "Selecione o aluno / matrícula." };
  const comum = lerComum(dados, false);
  if ("erro" in comum) return comum;

  let itens: { data: string; hora: string; instrutorId?: unknown }[];
  try {
    itens = JSON.parse(String(dados.get("itens") ?? "[]"));
  } catch {
    return { erro: "Lista de datas inválida." };
  }
  if (!Array.isArray(itens) || itens.length === 0) return { erro: "Clique no calendário para escolher as datas." };
  if (itens.length > MAX_LOTE) return { erro: `Escolha no máximo ${MAX_LOTE} aulas de uma vez.` };

  const aulas: NovaAula[] = [];
  for (const item of itens) {
    const dataHora = lerDataHora(String(item?.data ?? ""), String(item?.hora ?? ""));
    if (!dataHora) return { erro: "Preencha o horário de todas as datas escolhidas." };
    const instrutorId = Number(item?.instrutorId);
    if (!Number.isInteger(instrutorId) || instrutorId <= 0) {
      return { erro: "Escolha o instrutor de todas as aulas da lista." };
    }
    aulas.push({ ...comum, instrutorId, dataHora });
  }

  const erro = await verificarAulas(matriculaId, aulas);
  if (erro) return { erro: `Nenhuma aula foi agendada. ${erro}` };

  const matricula = await db.matricula.findUniqueOrThrow({ where: { id: matriculaId } });
  await db.aula.createMany({ data: aulas.map((a) => ({ matriculaId, ...a, obs: comum.obs })) });
  revalidar(matricula.alunoId);
  redirect(`/alunos/${matricula.alunoId}?agendadas=${aulas.length}`);
}

// Edita uma aula: data, horário, tipo, instrutor, veículo, duração e observação.
export async function editarAula(aulaId: number, _: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();

  const atual = await db.aula.findUnique({ where: { id: aulaId }, include: { matricula: true } });
  if (!atual) return { erro: "Aula não encontrada." };
  const comum = lerComum(dados);
  if ("erro" in comum) return comum;
  const dataHora = lerDataHora(String(dados.get("data") ?? ""), String(dados.get("hora") ?? ""));
  if (!dataHora) return { erro: "Informe a data e o horário." };

  const aula: NovaAula = { ...comum, dataHora };
  const erro = await verificarAulas(atual.matriculaId, [aula], { id: atual.id, status: atual.status });
  if (erro) return { erro };

  await db.aula.update({ where: { id: aulaId }, data: { ...aula, obs: comum.obs } });
  revalidar(atual.matricula.alunoId);
  redirect(destinoSeguro(String(dados.get("voltar") ?? ""), `/aulas?dia=${diaDe(dataHora)}`));
}

// Exclui uma aula lançada por engano. Aula com presença fica no histórico.
export async function excluirAula(aulaId: number, voltar: string) {
  await exigirSessao();
  const aula = await db.aula.findUnique({ where: { id: aulaId }, include: { matricula: true } });
  if (!aula) return;
  if (aula.status === "presente") throw new Error("Aula com presença não pode ser excluída. Use 'Desfazer' antes.");
  await db.aula.delete({ where: { id: aulaId } });
  revalidar(aula.matricula.alunoId);
  redirect(destinoSeguro(voltar, `/aulas?dia=${diaDe(aula.dataHora)}`));
}

// Transições permitidas: agendada → presente/faltou/cancelada,
// e presente/faltou → agendada (desfazer marcação errada).
const TRANSICOES: Record<string, string[]> = {
  agendada: ["presente", "faltou", "cancelada"],
  presente: ["agendada"],
  faltou: ["agendada"],
};

export async function marcarAula(aulaId: number, status: string) {
  await exigirSessao();

  const aula = await db.aula.findUnique({ where: { id: aulaId }, include: { matricula: true } });
  if (!aula) return;
  if (!TRANSICOES[aula.status]?.includes(status)) {
    throw new Error(`Não é possível mudar a aula de "${aula.status}" para "${status}".`);
  }

  await db.aula.update({ where: { id: aulaId }, data: { status } });
  revalidar(aula.matricula.alunoId);
}
