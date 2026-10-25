import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { BotaoLink, Cabecalho, Campo, Cartao, Input, Select, Textarea } from "@/components/ui";
import { db } from "@/lib/db";
import { FORMAS_PAGAMENTO, dataParaInput, moedaParaInput } from "@/lib/format";
import { editarParcela } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarParcelaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string }>;
}) {
  const parcela = await db.parcela.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: { matricula: { include: { aluno: true, _count: { select: { parcelas: true } } } } },
  });
  if (!parcela) notFound();
  const { aluno } = parcela.matricula;
  const voltar = (await searchParams).voltar ?? `/alunos/${aluno.id}`;

  return (
    <>
      <Cabecalho
        titulo="Alterar parcela"
        descricao={`${aluno.nome} · parcela ${parcela.numero} de ${parcela.matricula._count.parcelas}`}
        icone={Pencil}
        cor="verde"
        acoes={
          <BotaoLink href={voltar} variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      <Cartao className="max-w-2xl">
        <FormAcao acao={editarParcela.bind(null, parcela.id)} textoBotao="Salvar alterações">
          <input type="hidden" name="voltar" value={voltar} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo label="Valor da parcela (R$)">
              <Input name="valor" inputMode="decimal" required defaultValue={moedaParaInput(parcela.valorCentavos)} />
            </Campo>
            <Campo label="Vencimento">
              <Input name="vencimento" type="date" required defaultValue={dataParaInput(parcela.vencimento)} />
            </Campo>
          </div>
          {parcela.pagoEm && (
            <div className="grid gap-5 rounded-xl border border-green-200 bg-green-50/50 p-4 sm:grid-cols-3">
              <p className="text-base font-medium text-green-800 sm:col-span-3">Pagamento registrado</p>
              <Campo label="Pago em">
                <Input name="pagoEm" type="date" required defaultValue={dataParaInput(parcela.pagoEm)} />
              </Campo>
              <Campo label="Valor pago (R$)">
                <Input
                  name="valorPago"
                  inputMode="decimal"
                  required
                  defaultValue={moedaParaInput(parcela.valorPagoCentavos)}
                />
              </Campo>
              <Campo label="Forma">
                <Select name="forma" defaultValue={parcela.forma ?? "dinheiro"}>
                  {Object.entries(FORMAS_PAGAMENTO).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Campo>
            </div>
          )}
          <Campo label="Observação (opcional)">
            <Textarea name="obs" rows={2} defaultValue={parcela.obs ?? ""} />
          </Campo>
        </FormAcao>
      </Cartao>
    </>
  );
}
