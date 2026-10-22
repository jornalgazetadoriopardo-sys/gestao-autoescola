import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { BotaoLink, Cabecalho, Cartao, Etiqueta } from "@/components/ui";
import { db } from "@/lib/db";
import { expedienteDe, obterConfig } from "@/lib/config";
import { COR_STATUS_AULA, FUSO, STATUS_AULA, TIPOS_AULA, formatarDataHora, formatarHora } from "@/lib/aulas";
import { excluirAula } from "../../actions";
import { EditarAulaForm } from "./editar-aula-form";

export const dynamic = "force-dynamic";

export default async function EditarAulaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ voltar?: string }>;
}) {
  const aula = await db.aula.findUnique({
    where: { id: Number((await params).id) || 0 },
    include: { matricula: { include: { aluno: true } } },
  });
  if (!aula) notFound();

  // Instrutor e veículo atuais continuam na lista mesmo se foram desativados depois.
  const [instrutores, veiculos, config] = await Promise.all([
    db.instrutor.findMany({
      where: { OR: [{ ativo: true }, { id: aula.instrutorId ?? 0 }] },
      orderBy: { nome: "asc" },
    }),
    db.veiculo.findMany({
      where: { OR: [{ ativo: true }, { id: aula.veiculoId ?? 0 }] },
      orderBy: { placa: "asc" },
    }),
    obterConfig(),
  ]);

  const dia = aula.dataHora.toLocaleDateString("en-CA", { timeZone: FUSO });
  const voltar = (await searchParams).voltar ?? `/aulas?dia=${dia}`;
  const { aluno } = aula.matricula;

  return (
    <>
      <Cabecalho
        titulo="Editar aula"
        descricao={`${aluno.nome} · ${TIPOS_AULA[aula.tipo]} · ${formatarDataHora(aula.dataHora)}`}
        icone={Pencil}
        cor="roxo"
        acoes={
          <BotaoLink href={voltar} variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />

      <div className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Cartao>
          <EditarAulaForm
            aula={{
              id: aula.id,
              alunoId: aula.matricula.alunoId,
              status: aula.status,
              tipo: aula.tipo,
              instrutorId: aula.instrutorId,
              veiculoId: aula.veiculoId,
              data: dia,
              hora: formatarHora(aula.dataHora),
              duracaoMin: aula.duracaoMin,
              obs: aula.obs ?? "",
            }}
            categoria={aula.matricula.categoria}
            instrutores={instrutores.map((i) => ({ id: i.id, nome: i.nome, categorias: i.categorias }))}
            veiculos={veiculos.map((v) => ({ id: v.id, nome: `${v.placa} · ${v.modelo}`, categorias: v.categoria }))}
            voltar={voltar}
            expediente={expedienteDe(config)}
          />
        </Cartao>

        <Cartao className="h-fit space-y-4">
          <div>
            <div className="text-sm font-medium uppercase text-slate-500">Situação</div>
            <Etiqueta cor={COR_STATUS_AULA[aula.status as keyof typeof COR_STATUS_AULA] ?? "cinza"}>
              {STATUS_AULA[aula.status] ?? aula.status}
            </Etiqueta>
            <p className="mt-2 text-sm text-slate-600">
              Presença e falta são marcadas na agenda. Para cancelar, use o botão Cancelar na agenda.
            </p>
          </div>
          {aula.status !== "presente" && (
            <div className="border-t border-slate-200 pt-4">
              <p className="mb-2 text-sm text-slate-600">Marcou por engano? Exclua a aula.</p>
              <BotaoConfirmar
                acao={excluirAula.bind(null, aula.id, voltar)}
                mensagem="Excluir esta aula? Ela some da agenda e da ficha do aluno."
                icone="excluir"
              >
                Excluir aula
              </BotaoConfirmar>
            </div>
          )}
        </Cartao>
      </div>
    </>
  );
}
