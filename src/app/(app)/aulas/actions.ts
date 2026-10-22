"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { exigirSessao } from "@/lib/auth";
import { DURACOES, TIPOS_AULA, fimDaAula, formatarHora, lerDataHora, resumoAulas } from "@/lib/aulas";
import type { EstadoForm } from "@/components/form-acao";

function id(dados: FormData, campo: string) {
  const v = Number(dados.get(campo));
  return Number.isInteger(v) && v > 0 ? v : null;
}

export async function agendarAula(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirSessao();

  const matriculaId = id(dados, "matriculaId");
  const tipo = String(dados.get("tipo") ?? "");
  const instrutorId = id(dados, "instrutorId");
  const veiculoId = tipo === "pratica" ? id(dados, "veiculoId") : null;
  const duracaoMin = Number(dados.get("duracaoMin"));
  const dataHora = lerDataHora(String(dados.get("data") ?? ""), String(dados.get("hora") ?? ""));
  const obs = String(dados.get("obs") ?? "").trim() || null;

  if (!matriculaId) return { erro: "Selecione o aluno / matrícula." };
  if (!(tipo in TIPOS_AULA)) return { erro: "Selecione o tipo de aula." };
  if (!instrutorId) return { erro: "Selecione o instrutor." };
  if (tipo === "pratica" && !veiculoId) return { erro: "Selecione o veículo da aula prática." };
  if (!DURACOES.includes(duracaoMin)) return { erro: "Duração inválida." };
  if (!dataHora) return { erro: "Informe a data e o horário." };

  const [matricula, instrutor, veiculo] = await Promise.all([
    db.matricula.findUnique({
      where: { id: matriculaId },
      include: { aluno: true, aulas: { select: { tipo: true, status: true } } },
    }),
    db.instrutor.findUnique({ where: { id: instrutorId } }),
    veiculoId ? db.veiculo.findUnique({ where: { id: veiculoId } }) : null,
  ]);
  if (!matricula) return { erro: "Matrícula não encontrada." };
  if (matricula.aluno.status !== "ativo") return { erro: "O aluno não está ativo." };
  if (!instrutor?.ativo) return { erro: "Instrutor não encontrado ou inativo." };
  if (veiculoId && !veiculo?.ativo) return { erro: "Veículo não encontrado ou inativo." };

  if (veiculo) {
    if (!matricula.categoria.includes(veiculo.categoria)) {
      return { erro: `O veículo é da categoria ${veiculo.categoria}, mas a matrícula é ${matricula.categoria}.` };
    }
    if (!instrutor.categorias.split(",").includes(veiculo.categoria)) {
      return { erro: `${instrutor.nome} não está cadastrado para ensinar a categoria ${veiculo.categoria}.` };
    }
  }

  const saldo = resumoAulas(matricula, matricula.aulas)[tipo as "pratica" | "teorica"];
  if (saldo.restantes === 0) {
    return {
      erro: `Este aluno não tem mais aulas ${tipo === "pratica" ? "práticas" : "teóricas"} disponíveis na matrícula (${saldo.feitas} feitas, ${saldo.agendadas} agendadas de ${saldo.contratadas}).`,
    };
  }

  // Conflitos de horário: o mesmo aluno, instrutor ou veículo não pode estar em
  // duas aulas ao mesmo tempo. Exceção: aulas teóricas do mesmo instrutor no
  // mesmo horário são uma turma.
  const fim = fimDaAula({ dataHora, duracaoMin });
  const candidatas = await db.aula.findMany({
    where: {
      status: { not: "cancelada" },
      dataHora: { gte: new Date(dataHora.getTime() - 4 * 60 * 60 * 1000), lt: fim },
      OR: [
        { instrutorId },
        { matricula: { alunoId: matricula.alunoId } },
        ...(veiculoId ? [{ veiculoId }] : []),
      ],
    },
    include: { matricula: { include: { aluno: true } }, instrutor: true, veiculo: true },
  });

  for (const outra of candidatas) {
    if (fimDaAula(outra) <= dataHora) continue;
    const quando = `às ${formatarHora(outra.dataHora)}`;
    if (outra.matricula.alunoId === matricula.alunoId) {
      return { erro: `O aluno já tem aula ${quando}.` };
    }
    if (veiculoId && outra.veiculoId === veiculoId) {
      return { erro: `O veículo ${outra.veiculo?.placa} já está em aula ${quando} com ${outra.matricula.aluno.nome}.` };
    }
    if (outra.instrutorId === instrutorId && !(tipo === "teorica" && outra.tipo === "teorica")) {
      return { erro: `${instrutor.nome} já tem aula ${quando} com ${outra.matricula.aluno.nome}.` };
    }
  }

  await db.aula.create({
    data: { matriculaId, tipo, instrutorId, veiculoId, dataHora, duracaoMin, obs },
  });

  revalidatePath("/aulas");
  revalidatePath(`/alunos/${matricula.alunoId}`);
  const dia = dataHora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  redirect(`/aulas?dia=${dia}`);
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
  revalidatePath("/aulas");
  revalidatePath(`/alunos/${aula.matricula.alunoId}`);
}
