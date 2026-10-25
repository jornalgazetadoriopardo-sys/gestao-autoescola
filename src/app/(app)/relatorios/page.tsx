import { CalendarDays, CalendarRange, FileText, Receipt, UserRound, Wallet } from "lucide-react";
import { Botao, Cabecalho, Campo, Cartao, IconeRedondo, Input, Select } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORIAS_DESPESA, TITULO_MANUTENCAO } from "@/lib/despesas";
import { hojeISO } from "@/lib/format";
import { somarDias } from "@/lib/aulas";

export const dynamic = "force-dynamic";

// Cada relatório abre numa nova aba, pronto para imprimir ou salvar em PDF.
export default async function RelatoriosPage() {
  const admin = (await exigirSessao()).papel === "admin";
  const [alunos, instrutores, favorecidos] = await Promise.all([
    db.aluno.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true, status: true } }),
    db.instrutor.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    admin
      ? db.despesa.findMany({
          where: { favorecido: { not: null } },
          distinct: ["favorecido"],
          orderBy: { favorecido: "asc" },
          select: { favorecido: true },
        })
      : [],
  ]);
  const ano = Number(hojeISO().slice(0, 4));
  const hojeTexto = hojeISO();
  const inicioMes = `${hojeTexto.slice(0, 7)}-01`;

  return (
    <>
      <Cabecalho
        titulo="Relatórios"
        descricao="Escolha o relatório. Ele abre numa nova aba, pronto para imprimir ou salvar em PDF."
        icone={FileText}
        cor="roxo"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Relatorio
          icone={UserRound}
          titulo="Relatório do aluno"
          texto="Todas as aulas com presença e faltas, quantas faltam para concluir e a situação dos pagamentos."
        >
          <form action="/imprimir/aluno" target="_blank" className="space-y-4">
            <Campo label="Aluno">
              <Select name="id" required defaultValue="">
                <option value="" disabled>
                  Escolha o aluno...
                </option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                    {a.status !== "ativo" ? " (inativo)" : ""}
                  </option>
                ))}
              </Select>
            </Campo>
            <Botao icone={FileText}>Gerar relatório</Botao>
          </form>
        </Relatorio>

        <Relatorio
          icone={Wallet}
          titulo="Relatório financeiro"
          texto={
            admin
              ? "Entradas, despesas, lucro e o que sobrou no caixa no período, mais parcelas e contas em aberto."
              : "Tudo o que foi recebido no período (por forma de pagamento) e as parcelas em atraso."
          }
        >
          <form action="/imprimir/financeiro" target="_blank" className="space-y-4">
            <Periodo de={inicioMes} ate={hojeTexto} />
            <Botao icone={FileText}>Gerar relatório</Botao>
          </form>
        </Relatorio>

        <Relatorio
          icone={CalendarDays}
          titulo="Aulas por período"
          texto="Aulas dadas, faltas e cancelamentos no período. Útil para conferir o trabalho de cada instrutor."
        >
          <form action="/imprimir/aulas" target="_blank" className="space-y-4">
            <Periodo de={somarDias(hojeTexto, -30)} ate={hojeTexto} />
            <Campo label="Instrutor">
              <Select name="instrutor" defaultValue="">
                <option value="">Todos</option>
                {instrutores.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </Select>
            </Campo>
            <Botao icone={FileText}>Gerar relatório</Botao>
          </form>
        </Relatorio>

        {admin && (
          <Relatorio
            icone={Receipt}
            titulo="Despesas"
            texto="Despesas pagas no período por tipo e por pessoa. Ex.: salários e vales de um funcionário."
          >
            <form action="/imprimir/despesas" target="_blank" className="space-y-4">
              <Periodo de={inicioMes} ate={hojeTexto} />
              <Campo label="Tipo">
                <Select name="categoria" defaultValue="">
                  <option value="">Todos</option>
                  {Object.entries(CATEGORIAS_DESPESA).map(([id, c]) => (
                    <option key={id} value={id}>
                      {c.titulo}
                    </option>
                  ))}
                  <option value="manutencao">{TITULO_MANUTENCAO}</option>
                </Select>
              </Campo>
              <Campo label="Pessoa">
                <Select name="pessoa" defaultValue="">
                  <option value="">Todas</option>
                  {favorecidos.map((f) => (
                    <option key={f.favorecido} value={f.favorecido!}>
                      {f.favorecido}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Botao icone={FileText}>Gerar relatório</Botao>
            </form>
          </Relatorio>
        )}

        {admin && (
          <Relatorio
            icone={CalendarRange}
            titulo="Resumo do ano"
            texto="Mês a mês: quanto entrou, quanto saiu, o lucro e o que sobrou no caixa."
          >
            <form action="/imprimir/resumo-anual" target="_blank" className="space-y-4">
              <Campo label="Ano">
                <Select name="ano" defaultValue={ano}>
                  {[ano, ano - 1, ano - 2].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Botao icone={FileText}>Gerar relatório</Botao>
            </form>
          </Relatorio>
        )}
      </div>
    </>
  );
}

function Relatorio({
  icone,
  titulo,
  texto,
  children,
}: {
  icone: typeof FileText;
  titulo: string;
  texto: string;
  children: React.ReactNode;
}) {
  return (
    <Cartao className="flex flex-col">
      <IconeRedondo icone={icone} cor="roxo" tamanho="grande" />
      <h2 className="mt-4 text-xl font-semibold">{titulo}</h2>
      <p className="mb-5 mt-1 text-base text-slate-600">{texto}</p>
      <div className="mt-auto">{children}</div>
    </Cartao>
  );
}

function Periodo({ de, ate }: { de: string; ate: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Campo label="De">
        <Input type="date" name="de" required defaultValue={de} />
      </Campo>
      <Campo label="Até">
        <Input type="date" name="ate" required defaultValue={ate} />
      </Campo>
    </div>
  );
}
