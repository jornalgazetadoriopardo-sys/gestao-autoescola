import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { urlDoBanco } from "./url-banco";
import { sessaoDoCookie } from "./sessao-atual";

// A foto do aluno e o arquivo do contrato só são lidos quando pedidos
// (omit: { foto: false }), para as consultas comuns não carregarem arquivos.
function novoCliente() {
  return new PrismaClient({ datasourceUrl: urlDoBanco(), omit: { aluno: { foto: true }, configuracao: { contratoArquivo: true } } });
}

// Reaproveita a conexão entre recarregamentos no modo de desenvolvimento.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof novoCliente> };
const base = globalForPrisma.prisma ?? novoCliente();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = base;

// Acesso SEM filtro de autoescola. Só para o login, o painel da plataforma e
// conferências de sessão. Todo o resto do sistema usa `db`.
export const dbGlobal = base;

// Sessão do cookie conferida no banco (uma vez por requisição): o usuário e a
// autoescola precisam continuar ativos. Quem foi desativado ou suspenso perde
// o acesso na hora, mesmo com o cookie ainda válido.
export const situacaoDaSessao = cache(async () => {
  const sessao = await sessaoDoCookie();
  if (!sessao) return { sessao: null, situacao: "sem-sessao" as const };
  const usuario = await base.usuario.findUnique({
    where: { id: sessao.usuarioId },
    select: { ativo: true, autoescolaId: true, papel: true, superadmin: true, autoescola: { select: { ativo: true } } },
  });
  if (!usuario || !usuario.ativo || usuario.autoescolaId !== sessao.autoescolaId)
    return { sessao, situacao: "desativado" as const };
  if (!usuario.autoescola.ativo) return { sessao, situacao: "suspensa" as const };
  // Acesso e dono da plataforma valem como estão no banco agora.
  return { sessao: { ...sessao, papel: usuario.papel, superadmin: usuario.superadmin }, situacao: "ok" as const };
});

// Como cada tabela pertence a uma autoescola: direto pela coluna `autoescolaId`
// ou pelo registro "pai" (aluno, matrícula, veículo).
const FILTRO: Record<string, (autoescolaId: number) => object> = {
  Autoescola: (id) => ({ id }),
  Configuracao: (id) => ({ id }),
  Usuario: (id) => ({ autoescolaId: id }),
  Aluno: (id) => ({ autoescolaId: id }),
  Instrutor: (id) => ({ autoescolaId: id }),
  Veiculo: (id) => ({ autoescolaId: id }),
  Matricula: (id) => ({ aluno: { autoescolaId: id } }),
  Aula: (id) => ({ matricula: { aluno: { autoescolaId: id } } }),
  Parcela: (id) => ({ matricula: { aluno: { autoescolaId: id } } }),
  Etapa: (id) => ({ matricula: { aluno: { autoescolaId: id } } }),
  Manutencao: (id) => ({ veiculo: { autoescolaId: id } }),
  Despesa: (id) => ({ autoescolaId: id }),
  Feriado: (id) => ({ autoescolaId: id }),
};

// Coluna preenchida automaticamente ao criar.
const COLUNA: Record<string, string> = {
  Usuario: "autoescolaId",
  Aluno: "autoescolaId",
  Instrutor: "autoescolaId",
  Veiculo: "autoescolaId",
  Despesa: "autoescolaId",
  Feriado: "autoescolaId",
  Configuracao: "id",
};

// Chaves estrangeiras que precisam apontar para registros da mesma autoescola.
const REFERENCIAS: Record<string, [campo: string, modelo: string][]> = {
  Matricula: [["alunoId", "Aluno"]],
  Aula: [
    ["matriculaId", "Matricula"],
    ["instrutorId", "Instrutor"],
    ["veiculoId", "Veiculo"],
  ],
  Parcela: [["matriculaId", "Matricula"]],
  Etapa: [
    ["matriculaId", "Matricula"],
    ["veiculoId", "Veiculo"],
    ["instrutorId", "Instrutor"],
  ],
  Manutencao: [["veiculoId", "Veiculo"]],
  Despesa: [["veiculoId", "Veiculo"]],
};

type Dados = Record<string, unknown>;
type Args = { where?: Dados; data?: Dados | Dados[]; create?: Dados; update?: Dados };
type Delegado = { count: (args: { where: object }) => Promise<number> };

function delegado(modelo: string) {
  const nome = modelo.charAt(0).toLowerCase() + modelo.slice(1);
  return (base as unknown as Record<string, Delegado>)[nome];
}

function filtrar(where: Dados | undefined, filtro: object): Dados {
  const e = where?.AND;
  const lista = Array.isArray(e) ? e : e ? [e] : [];
  return { ...(where ?? {}), AND: [...lista, filtro] };
}

async function conferirReferencias(modelo: string, dados: Dados | undefined, autoescolaId: number) {
  for (const [campo, pai] of REFERENCIAS[modelo] ?? []) {
    const valor = dados?.[campo];
    if (valor === undefined || valor === null) continue;
    if (typeof valor !== "number") throw new Error(`Valor inválido em ${modelo}.${campo}.`);
    const existe = await delegado(pai).count({ where: { id: valor, ...FILTRO[pai](autoescolaId) } });
    if (!existe) throw new Error("Registro não encontrado.");
  }
}

function prepararCriacao(modelo: string, dados: Dados | undefined, autoescolaId: number): Dados {
  const coluna = COLUNA[modelo];
  return coluna ? { ...(dados ?? {}), [coluna]: autoescolaId } : { ...(dados ?? {}) };
}

function prepararAlteracao(modelo: string, dados: Dados | undefined): Dados | undefined {
  const coluna = COLUNA[modelo];
  if (!dados || !coluna || !(coluna in dados)) return dados;
  // Ninguém muda um registro de autoescola.
  const copia = { ...dados };
  delete copia[coluna];
  return copia;
}

// Acesso ao banco da autoescola de quem está logado. Toda consulta recebe o
// filtro da autoescola e toda criação recebe o id dela; uma tabela sem regra
// conhecida é recusada. Assim uma autoescola nunca vê dados de outra.
export const db = base.$extends({
  name: "autoescola",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const { sessao, situacao } = await situacaoDaSessao();
        if (!sessao) redirect("/login");
        if (situacao !== "ok") redirect(`/sair?motivo=${situacao}`);
        const id = sessao.autoescolaId;
        const filtro = FILTRO[model];
        if (!filtro) throw new Error(`Tabela ${model} sem regra de autoescola.`);

        const a = { ...((args ?? {}) as Args) };
        switch (operation) {
          case "create":
            await conferirReferencias(model, a.data as Dados, id);
            a.data = prepararCriacao(model, a.data as Dados, id);
            break;
          case "createMany":
          case "createManyAndReturn": {
            const lista = Array.isArray(a.data) ? a.data : a.data ? [a.data] : [];
            for (const d of lista) await conferirReferencias(model, d, id);
            a.data = lista.map((d) => prepararCriacao(model, d, id));
            break;
          }
          case "upsert":
            await conferirReferencias(model, a.create, id);
            await conferirReferencias(model, a.update, id);
            a.where = filtrar(a.where, filtro(id));
            a.create = prepararCriacao(model, a.create, id);
            a.update = prepararAlteracao(model, a.update);
            break;
          case "update":
          case "updateMany":
          case "updateManyAndReturn":
            await conferirReferencias(model, a.data as Dados, id);
            a.where = filtrar(a.where, filtro(id));
            a.data = prepararAlteracao(model, a.data as Dados);
            break;
          default:
            // Leituras, contagens, somas e exclusões.
            a.where = filtrar(a.where, filtro(id));
        }
        return query(a as typeof args);
      },
    },
  },
});
