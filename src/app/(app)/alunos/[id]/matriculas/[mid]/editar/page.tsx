import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Opcoes } from "@/components/opcoes";
import { CURSOS_TEORICOS, TIPOS_PROCESSO } from "@/lib/etapas";
import { BotaoLink, Cabecalho, Campo, Cartao, Input, Select } from "@/components/ui";
import { db } from "@/lib/db";
import { hojeISO, moedaParaInput } from "@/lib/format";
import { FORMAS_MATRICULA, SO_PARCELAS } from "@/lib/pagamentos";
import { adicionarParcela } from "@/app/(app)/pagamentos/actions";
import { editarMatricula } from "../../actions";
import { CamposCategoria } from "../../campos-categoria";
import { praticasPorCategoria } from "@/lib/aulas";

export const dynamic = "force-dynamic";

export default async function EditarMatriculaPage({ params }: { params: Promise<{ id: string; mid: string }> }) {
  const { id, mid } = await params;
  const matricula = await db.matricula.findUnique({
    where: { id: Number(mid) || 0 },
    include: { aluno: true, _count: { select: { parcelas: { where: SO_PARCELAS } } } },
  });
  if (!matricula || matricula.alunoId !== Number(id)) notFound();
  const voltar = `/alunos/${matricula.alunoId}`;
  const praticas = praticasPorCategoria(matricula);
  const data = matricula.data.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

  return (
    <>
      <Cabecalho
        titulo="Alterar matrícula"
        descricao={matricula.aluno.nome}
        icone={Pencil}
        acoes={
          <BotaoLink href={voltar} variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,40rem)_minmax(0,26rem)]">
        <Cartao>
          <FormAcao acao={editarMatricula.bind(null, matricula.id)} textoBotao="Salvar alterações">
            <Opcoes
              nome="tipoProcesso"
              legenda="Tipo de processo"
              opcoes={TIPOS_PROCESSO}
              inicial={matricula.tipoProcesso}
            />
            <Opcoes
              nome="cursoTeorico"
              legenda="Curso teórico"
              opcoes={CURSOS_TEORICOS}
              inicial={matricula.cursoTeorico}
              colunas="sm:grid-cols-3"
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <CamposCategoria
                categoria={matricula.categoria}
                praticas={praticas}
                totalAntigo={praticas ? undefined : matricula.qtdPraticas}
              />
              <Campo label="Aulas teóricas">
                <Input name="qtdTeoricas" type="number" min={0} required defaultValue={matricula.qtdTeoricas} />
              </Campo>
              <Campo label="Valor contratado (R$)">
                <Input
                  name="valorTotal"
                  inputMode="decimal"
                  required
                  defaultValue={moedaParaInput(matricula.valorTotalCentavos)}
                />
              </Campo>
              <Campo label="Forma de pagamento" className="sm:col-span-2">
                <Select name="formaPagamento" defaultValue={matricula.formaPagamento}>
                  {Object.entries(FORMAS_MATRICULA).map(([id, f]) => (
                    <option key={id} value={id}>
                      {f.titulo}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Campo label="Data da matrícula">
                <Input name="data" type="date" required defaultValue={data} />
              </Campo>
            </div>
            <p className="text-sm text-slate-600">
              Mudar o valor aqui não refaz as parcelas. Para mudar uma parcela, use o botão Alterar dela na ficha do
              aluno.
            </p>
          </FormAcao>
        </Cartao>

        <Cartao className="h-fit">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <Plus className="size-6 text-green-600" aria-hidden /> Acrescentar parcela
          </h2>
          <p className="mb-4 text-base text-slate-600">
            Hoje esta matrícula tem {matricula._count.parcelas}{" "}
            {matricula._count.parcelas === 1 ? "parcela" : "parcelas"}.
          </p>
          <FormAcao acao={adicionarParcela.bind(null, matricula.id)} textoBotao="Acrescentar" limparAoSalvar>
            <Campo label="Valor (R$)">
              <Input name="valor" inputMode="decimal" required placeholder="Ex.: 150,00" />
            </Campo>
            <Campo label="Vencimento">
              <Input name="vencimento" type="date" required defaultValue={hojeISO()} />
            </Campo>
          </FormAcao>
        </Cartao>
      </div>
    </>
  );
}
