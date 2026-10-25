import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { dataParaInput, hojeISO, moedaParaInput } from "@/lib/format";
import { DespesaForm } from "../../despesa-form";
import { dadosDoFormulario } from "../../dados-form";

export const dynamic = "force-dynamic";

export default async function EditarDespesaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string }>;
}) {
  await exigirAdmin();
  const despesa = await db.despesa.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!despesa) notFound();
  const { voltar = "" } = await searchParams;
  const { pessoas, veiculos } = await dadosDoFormulario();

  return (
    <>
      <Cabecalho
        titulo="Alterar despesa"
        icone={Pencil}
        cor="vermelho"
        acoes={
          <BotaoLink href={voltar.startsWith("/") ? voltar : "/despesas"} variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      <Cartao className="max-w-3xl">
        <DespesaForm
          hoje={hojeISO()}
          pessoas={pessoas}
          veiculos={veiculos}
          voltar={voltar}
          inicial={{
            id: despesa.id,
            categoria: despesa.categoria,
            descricao: despesa.descricao,
            favorecido: despesa.favorecido ?? "",
            valor: moedaParaInput(despesa.valorCentavos),
            vencimento: dataParaInput(despesa.vencimento),
            paga: Boolean(despesa.pagoEm),
            pagoEm: dataParaInput(despesa.pagoEm),
            forma: despesa.forma ?? "",
            veiculoId: despesa.veiculoId ? String(despesa.veiculoId) : "",
            litros: despesa.litrosCent ? moedaParaInput(despesa.litrosCent) : "",
            km: despesa.km ? String(despesa.km) : "",
            obs: despesa.obs ?? "",
          }}
        />
      </Cartao>
    </>
  );
}
