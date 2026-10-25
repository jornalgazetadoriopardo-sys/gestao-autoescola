import { ArrowLeft, Receipt } from "lucide-react";
import { BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { CATEGORIAS_DESPESA } from "@/lib/despesas";
import { hojeISO } from "@/lib/format";
import { DespesaForm } from "../despesa-form";
import { dadosDoFormulario } from "../dados-form";

export const dynamic = "force-dynamic";

export default async function NovaDespesaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; veiculo?: string; voltar?: string }>;
}) {
  await exigirAdmin();
  const params = await searchParams;
  const { pessoas, veiculos } = await dadosDoFormulario();
  const hoje = hojeISO();
  const categoria = params.categoria && params.categoria in CATEGORIAS_DESPESA ? params.categoria : "";
  const voltar = params.voltar ?? "";

  return (
    <>
      <Cabecalho
        titulo="Nova despesa"
        descricao="Escolha o tipo, informe o valor e diga se já foi paga."
        icone={Receipt}
        cor="vermelho"
        acoes={
          <BotaoLink href={voltar.startsWith("/") ? voltar : "/despesas"} variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      <Cartao className="max-w-3xl">
        <DespesaForm
          hoje={hoje}
          pessoas={pessoas}
          veiculos={veiculos}
          voltar={voltar}
          inicial={{
            id: null,
            categoria,
            descricao: "",
            favorecido: "",
            valor: "",
            vencimento: hoje,
            paga: true,
            pagoEm: hoje,
            forma: "pix",
            veiculoId: params.veiculo ?? "",
            litros: "",
            km: "",
            obs: "",
          }}
        />
      </Cartao>
    </>
  );
}
