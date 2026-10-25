import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardPlus } from "lucide-react";
import { BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { db } from "@/lib/db";
import { hojeISO } from "@/lib/format";
import { TIPOS_ETAPA, lerTaxasPadrao } from "@/lib/etapas";
import { moedaParaInput } from "@/lib/format";
import { EtapaForm } from "../etapa-form";
import { opcoesDoExame } from "../opcoes-exame";

export const dynamic = "force-dynamic";

export default async function NovaEtapaPage({
  searchParams,
}: {
  searchParams: Promise<{ matricula?: string; tipo?: string; categoria?: string; voltar?: string }>;
}) {
  const params = await searchParams;
  const matricula = await db.matricula.findUnique({
    where: { id: Number(params.matricula) || 0 },
    include: { aluno: true },
  });
  if (!matricula) notFound();
  const tipo = params.tipo && params.tipo in TIPOS_ETAPA ? params.tipo : "outra";
  const [config, opcoes] = await Promise.all([
    db.configuracao.findFirst({ select: { taxasPadrao: true } }),
    opcoesDoExame(),
  ]);
  const padrao = lerTaxasPadrao(config?.taxasPadrao)[tipo];
  const voltar =
    params.voltar?.startsWith("/") && !params.voltar.startsWith("//") ? params.voltar : `/alunos/${matricula.alunoId}`;

  return (
    <>
      <Cabecalho
        titulo="Adicionar exame ou taxa"
        descricao={`${matricula.aluno.nome} · categoria ${matricula.categoria}`}
        icone={ClipboardPlus}
        cor="roxo"
        acoes={
          <BotaoLink href={voltar} variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      <Cartao className="max-w-3xl">
        <EtapaForm
          matriculaId={matricula.id}
          hoje={hojeISO()}
          voltar={voltar}
          {...opcoes}
          inicial={{
            id: null,
            tipo,
            descricao: "",
            categoria: /^[A-E]$/.test(params.categoria ?? "") ? params.categoria! : "",
            data: "",
            hora: "",
            local: "",
            veiculoId: "",
            instrutorId: "",
            resultado: "",
            valor: moedaParaInput(padrao?.valor),
            cobranca: padrao?.cobranca ?? "aluno",
            pagoEm: "",
            forma: "",
            obs: "",
          }}
        />
      </Cartao>
    </>
  );
}
