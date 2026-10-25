import "server-only";
import { Prisma } from "@prisma/client";
import { dbGlobal } from "./db";

// Cópia completa de uma autoescola em JSON, para levar a outro servidor.
// Os ids do arquivo só servem para ligar os registros entre si: na
// importação cada registro recebe um id novo.

export const FORMATO = "gestao-autoescola";
export const VERSAO = 1;

export async function exportarAutoescola(autoescolaId: number) {
  const autoescola = await dbGlobal.autoescola.findUnique({ where: { id: autoescolaId } });
  if (!autoescola) return null;
  const doAluno = { aluno: { autoescolaId } };
  const [configuracao, usuarios, alunos, instrutores, veiculos, manutencoes, matriculas, parcelas, aulas, despesas] =
    await Promise.all([
      dbGlobal.configuracao.findUnique({ where: { id: autoescolaId }, omit: { id: true } }),
      dbGlobal.usuario.findMany({
        orderBy: { id: "asc" },
        where: { autoescolaId },
        omit: { autoescolaId: true, superadmin: true },
      }),
      dbGlobal.aluno.findMany({
        orderBy: { id: "asc" },
        where: { autoescolaId },
        omit: { autoescolaId: true, foto: false },
      }),
      dbGlobal.instrutor.findMany({ orderBy: { id: "asc" }, where: { autoescolaId }, omit: { autoescolaId: true } }),
      dbGlobal.veiculo.findMany({ orderBy: { id: "asc" }, where: { autoescolaId }, omit: { autoescolaId: true } }),
      dbGlobal.manutencao.findMany({ orderBy: { id: "asc" }, where: { veiculo: { autoescolaId } } }),
      dbGlobal.matricula.findMany({ orderBy: { id: "asc" }, where: doAluno }),
      dbGlobal.parcela.findMany({ orderBy: { id: "asc" }, where: { matricula: doAluno } }),
      dbGlobal.aula.findMany({ orderBy: { id: "asc" }, where: { matricula: doAluno } }),
      dbGlobal.despesa.findMany({ orderBy: { id: "asc" }, where: { autoescolaId }, omit: { autoescolaId: true } }),
    ]);
  return {
    formato: FORMATO,
    versao: VERSAO,
    exportadoEm: new Date().toISOString(),
    autoescola: { nome: autoescola.nome, criadoEm: autoescola.criadoEm },
    configuracao,
    usuarios,
    alunos,
    instrutores,
    veiculos,
    manutencoes,
    matriculas,
    parcelas,
    aulas,
    despesas,
  };
}

// ---- Importação -------------------------------------------------------------

export class ErroImportacao extends Error {}

type Obj = Record<string, unknown>;

function lista(o: Obj, campo: string): Obj[] {
  const v = o[campo];
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((x) => !x || typeof x !== "object"))
    throw new ErroImportacao(`Arquivo inválido: "${campo}" não é uma lista.`);
  return v as Obj[];
}

// Leitores de campo: conferem o tipo e dão uma mensagem clara.
function ler(tabela: string) {
  const erro = (campo: string) => new ErroImportacao(`Arquivo inválido: campo "${campo}" em ${tabela}.`);
  const str = (o: Obj, c: string) => {
    if (typeof o[c] !== "string") throw erro(c);
    return o[c] as string;
  };
  const strN = (o: Obj, c: string) => (o[c] === null || o[c] === undefined ? null : str(o, c));
  const int = (o: Obj, c: string) => {
    if (!Number.isInteger(o[c])) throw erro(c);
    return o[c] as number;
  };
  const intN = (o: Obj, c: string) => (o[c] === null || o[c] === undefined ? null : int(o, c));
  const bool = (o: Obj, c: string) => {
    if (typeof o[c] !== "boolean") throw erro(c);
    return o[c] as boolean;
  };
  const data = (o: Obj, c: string) => {
    const d = new Date(str(o, c));
    if (Number.isNaN(d.getTime())) throw erro(c);
    return d;
  };
  const dataN = (o: Obj, c: string) => (o[c] === null || o[c] === undefined ? null : data(o, c));
  return { str, strN, int, intN, bool, data, dataN };
}

// Reserva `n` ids novos de uma tabela, para gravar tudo com createMany
// mantendo as ligações entre os registros.
async function reservarIds(tx: Prisma.TransactionClient, tabela: string, n: number) {
  if (n === 0) return [];
  const linhas = await tx.$queryRawUnsafe<{ id: number }[]>(
    `SELECT nextval(pg_get_serial_sequence('"${tabela}"', 'id'))::int AS id FROM generate_series(1, $1) ORDER BY 1`,
    n,
  );
  return linhas.map((l) => l.id);
}

// Troca os ids do arquivo pelos ids novos.
function mapa(tabela: string, registros: Obj[], novos: number[]) {
  const m = new Map<number, number>();
  registros.forEach((r, i) => {
    const id = r.id;
    if (!Number.isInteger(id) || m.has(id as number))
      throw new ErroImportacao(`Arquivo inválido: id repetido ou ausente em ${tabela}.`);
    m.set(id as number, novos[i]);
  });
  return (id: number) => {
    const novo = m.get(id);
    if (novo === undefined) throw new ErroImportacao(`Arquivo inválido: referência a ${tabela} inexistente.`);
    return novo;
  };
}

const opcional = (id: number | null, novoId: (id: number) => number) => (id === null ? null : novoId(id));

// Cria uma autoescola nova com todos os dados do arquivo. Ou importa tudo,
// ou nada. Devolve o id e o nome da autoescola criada.
export async function importarAutoescola(arquivo: unknown) {
  if (!arquivo || typeof arquivo !== "object") throw new ErroImportacao("Arquivo inválido.");
  const o = arquivo as Obj;
  if (o.formato !== FORMATO) throw new ErroImportacao("Este arquivo não é uma exportação do sistema.");
  if (o.versao !== VERSAO) throw new ErroImportacao("Versão do arquivo não suportada.");

  const A = o.autoescola as Obj | undefined;
  if (!A || typeof A !== "object") throw new ErroImportacao("Arquivo inválido: falta a autoescola.");
  const nome = ler("autoescola").str(A, "nome");
  const C = o.configuracao && typeof o.configuracao === "object" ? (o.configuracao as Obj) : null;

  const usuarios = lista(o, "usuarios");
  const alunos = lista(o, "alunos");
  const instrutores = lista(o, "instrutores");
  const veiculos = lista(o, "veiculos");
  const manutencoes = lista(o, "manutencoes");
  const matriculas = lista(o, "matriculas");
  const parcelas = lista(o, "parcelas");
  const aulas = lista(o, "aulas");
  // Arquivos exportados antes do módulo de despesas não têm esta lista.
  const despesas = lista(o, "despesas");

  // E-mail de login é único no sistema todo.
  const u = ler("usuários");
  const emails = usuarios.map((x) => u.str(x, "email").trim().toLowerCase());
  if (new Set(emails).size !== emails.length) throw new ErroImportacao("Arquivo inválido: e-mail repetido.");
  const existentes = await dbGlobal.usuario.findMany({ where: { email: { in: emails } }, select: { email: true } });
  if (existentes.length) {
    throw new ErroImportacao(
      `Estes e-mails já são usados neste servidor: ${existentes.map((e) => e.email).join(", ")}. ` +
        "Mude ou exclua esses usuários antes de importar.",
    );
  }

  return dbGlobal.$transaction(
    async (tx) => {
      const autoescola = await tx.autoescola.create({
        data: { nome, criadoEm: ler("autoescola").dataN(A, "criadoEm") ?? undefined },
      });
      const autoescolaId = autoescola.id;

      if (C) {
        const r = ler("configurações");
        await tx.configuracao.create({
          data: {
            id: autoescolaId,
            nome: r.strN(C, "nome") ?? nome,
            razaoSocial: r.strN(C, "razaoSocial"),
            cnpj: r.strN(C, "cnpj"),
            endereco: r.strN(C, "endereco"),
            bairro: r.strN(C, "bairro"),
            cidade: r.strN(C, "cidade"),
            uf: r.strN(C, "uf"),
            cep: r.strN(C, "cep"),
            telefone: r.strN(C, "telefone"),
            whatsapp: r.strN(C, "whatsapp"),
            email: r.strN(C, "email"),
            chavePix: r.strN(C, "chavePix"),
            avisoCarne: r.strN(C, "avisoCarne"),
            orientacoesAluno: r.strN(C, "orientacoesAluno"),
            horaInicio: r.strN(C, "horaInicio") ?? undefined,
            horaFim: r.strN(C, "horaFim") ?? undefined,
            intervaloMin: r.intN(C, "intervaloMin") ?? undefined,
            logo: r.strN(C, "logo"),
          },
        });
      }

      await tx.usuario.createMany({
        data: usuarios.map((x, i) => ({
          autoescolaId,
          nome: u.str(x, "nome"),
          email: emails[i],
          senhaHash: u.str(x, "senhaHash"),
          papel: u.str(x, "papel") === "admin" ? "admin" : "secretaria",
          ativo: u.bool(x, "ativo"),
          criadoEm: u.dataN(x, "criadoEm") ?? undefined,
        })),
      });

      const idAluno = mapa("alunos", alunos, await reservarIds(tx, "Aluno", alunos.length));
      const al = ler("alunos");
      await tx.aluno.createMany({
        data: alunos.map((x) => ({
          id: idAluno(al.int(x, "id")),
          autoescolaId,
          nome: al.str(x, "nome"),
          cpf: al.str(x, "cpf"),
          telefone: al.strN(x, "telefone"),
          email: al.strN(x, "email"),
          nascimento: al.dataN(x, "nascimento"),
          endereco: al.strN(x, "endereco"),
          categoria: al.str(x, "categoria"),
          status: al.str(x, "status"),
          obs: al.strN(x, "obs"),
          foto: al.strN(x, "foto"),
          fotoEm: al.dataN(x, "fotoEm"),
          criadoEm: al.dataN(x, "criadoEm") ?? undefined,
        })),
      });

      const idInstrutor = mapa("instrutores", instrutores, await reservarIds(tx, "Instrutor", instrutores.length));
      const ins = ler("instrutores");
      await tx.instrutor.createMany({
        data: instrutores.map((x) => ({
          id: idInstrutor(ins.int(x, "id")),
          autoescolaId,
          nome: ins.str(x, "nome"),
          telefone: ins.strN(x, "telefone"),
          categorias: ins.str(x, "categorias"),
          ativo: ins.bool(x, "ativo"),
          criadoEm: ins.dataN(x, "criadoEm") ?? undefined,
        })),
      });

      const idVeiculo = mapa("veículos", veiculos, await reservarIds(tx, "Veiculo", veiculos.length));
      const ve = ler("veículos");
      await tx.veiculo.createMany({
        data: veiculos.map((x) => ({
          id: idVeiculo(ve.int(x, "id")),
          autoescolaId,
          placa: ve.str(x, "placa"),
          modelo: ve.str(x, "modelo"),
          categoria: ve.str(x, "categoria"),
          ativo: ve.bool(x, "ativo"),
          criadoEm: ve.dataN(x, "criadoEm") ?? undefined,
        })),
      });

      const ma = ler("manutenções");
      await tx.manutencao.createMany({
        data: manutencoes.map((x) => ({
          veiculoId: idVeiculo(ma.int(x, "veiculoId")),
          descricao: ma.str(x, "descricao"),
          data: ma.dataN(x, "data"),
          km: ma.intN(x, "km"),
          valorCentavos: ma.intN(x, "valorCentavos"),
          lembrarEm: ma.dataN(x, "lembrarEm"),
          lembreteConcluido: ma.bool(x, "lembreteConcluido"),
          obs: ma.strN(x, "obs"),
          criadoEm: ma.dataN(x, "criadoEm") ?? undefined,
        })),
      });

      const idMatricula = mapa("matrículas", matriculas, await reservarIds(tx, "Matricula", matriculas.length));
      const mt = ler("matrículas");
      await tx.matricula.createMany({
        data: matriculas.map((x) => ({
          id: idMatricula(mt.int(x, "id")),
          alunoId: idAluno(mt.int(x, "alunoId")),
          categoria: mt.str(x, "categoria"),
          qtdPraticas: mt.int(x, "qtdPraticas"),
          qtdTeoricas: mt.int(x, "qtdTeoricas"),
          valorTotalCentavos: mt.int(x, "valorTotalCentavos"),
          jurosMesBp: mt.int(x, "jurosMesBp"),
          formaPagamento: mt.str(x, "formaPagamento"),
          data: mt.data(x, "data"),
        })),
      });

      const pa = ler("parcelas");
      await tx.parcela.createMany({
        data: parcelas.map((x) => ({
          matriculaId: idMatricula(pa.int(x, "matriculaId")),
          numero: pa.int(x, "numero"),
          valorCentavos: pa.int(x, "valorCentavos"),
          vencimento: pa.data(x, "vencimento"),
          pagoEm: pa.dataN(x, "pagoEm"),
          valorPagoCentavos: pa.intN(x, "valorPagoCentavos"),
          forma: pa.strN(x, "forma"),
          obs: pa.strN(x, "obs"),
        })),
      });

      const au = ler("aulas");
      await tx.aula.createMany({
        data: aulas.map((x) => ({
          matriculaId: idMatricula(au.int(x, "matriculaId")),
          instrutorId: opcional(au.intN(x, "instrutorId"), idInstrutor),
          veiculoId: opcional(au.intN(x, "veiculoId"), idVeiculo),
          tipo: au.str(x, "tipo"),
          dataHora: au.data(x, "dataHora"),
          duracaoMin: au.int(x, "duracaoMin"),
          status: au.str(x, "status"),
          obs: au.strN(x, "obs"),
        })),
      });

      const de = ler("despesas");
      await tx.despesa.createMany({
        data: despesas.map((x) => ({
          autoescolaId,
          categoria: de.str(x, "categoria"),
          descricao: de.str(x, "descricao"),
          favorecido: de.strN(x, "favorecido"),
          valorCentavos: de.int(x, "valorCentavos"),
          vencimento: de.data(x, "vencimento"),
          pagoEm: de.dataN(x, "pagoEm"),
          forma: de.strN(x, "forma"),
          veiculoId: opcional(de.intN(x, "veiculoId"), idVeiculo),
          litrosCent: de.intN(x, "litrosCent"),
          km: de.intN(x, "km"),
          obs: de.strN(x, "obs"),
          criadoEm: de.dataN(x, "criadoEm") ?? undefined,
        })),
      });

      return {
        id: autoescolaId,
        nome,
        totais: {
          usuarios: usuarios.length,
          alunos: alunos.length,
          aulas: aulas.length,
          parcelas: parcelas.length,
          despesas: despesas.length,
        },
      };
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
}
