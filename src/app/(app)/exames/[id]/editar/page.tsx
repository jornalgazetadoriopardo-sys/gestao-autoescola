import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { db } from "@/lib/db";
import { dataParaInput, hojeISO, moedaParaInput } from "@/lib/format";
import { excluirEtapa } from "../../actions";
import { EtapaForm } from "../../etapa-form";
import { opcoesDoExame } from "../../opcoes-exame";

export const dynamic = "force-dynamic";

export default async function EditarEtapaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string }>;
}) {
  const etapa = await db.etapa.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: { matricula: { include: { aluno: true } } },
  });
  if (!etapa) notFound();
  const { voltar = `/alunos/${etapa.matricula.alunoId}` } = await searchParams;
  const opcoes = await opcoesDoExame(etapa);

  return (
    <>
      <Cabecalho
        titulo={etapa.descricao}
        descricao={`${etapa.matricula.aluno.nome} · categoria ${etapa.matricula.categoria}`}
        icone={ClipboardCheck}
        cor="roxo"
        acoes={
          <>
            <BotaoLink href={voltar} variante="secundario" icone={ArrowLeft}>
              Voltar
            </BotaoLink>
            <BotaoConfirmar
              acao={excluirEtapa.bind(null, etapa.id, voltar)}
              mensagem={`Excluir "${etapa.descricao}"?`}
              icone="excluir"
            >
              Excluir
            </BotaoConfirmar>
          </>
        }
      />
      <Cartao className="max-w-3xl">
        <EtapaForm
          matriculaId={etapa.matriculaId}
          hoje={hojeISO()}
          voltar={voltar}
          {...opcoes}
          inicial={{
            id: etapa.id,
            tipo: etapa.tipo,
            descricao: etapa.descricao,
            categoria: etapa.categoria ?? "",
            data: dataParaInput(etapa.data),
            hora: etapa.hora ?? "",
            local: etapa.local ?? "",
            veiculoId: etapa.veiculoId ? String(etapa.veiculoId) : "",
            instrutorId: etapa.instrutorId ? String(etapa.instrutorId) : "",
            resultado: etapa.resultado ?? "",
            valor: moedaParaInput(etapa.valorCentavos),
            cobranca: etapa.cobranca,
            pagoEm: dataParaInput(etapa.pagoEm),
            forma: etapa.forma ?? "",
            obs: etapa.obs ?? "",
          }}
        />
      </Cartao>
    </>
  );
}
