import { notFound } from "next/navigation";
import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { formatarCpf } from "@/lib/format";
import { formatoDe } from "@/lib/formato";
import { OBS_GUIA_PADRAO, gruposDaGuia } from "@/lib/guia-taxas";
import { CabecalhoDocumento } from "../../cabecalho-documento";
import { CabecalhoCupom } from "../../cupom";
import { GuiaTaxas } from "./guia-taxas";

export const dynamic = "force-dynamic";

// Guia de taxas do Detran para o aluno pagar no banco pelo CPF (A4 ou térmica).
export default async function GuiaTaxasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ formato?: string }>;
}) {
  const [matricula, config] = await Promise.all([
    db.matricula.findUnique({
      where: { id: Number((await params).id) || 0 },
      include: { aluno: true, etapas: { orderBy: [{ ordem: "asc" }, { id: "asc" }] } },
    }),
    obterConfig(),
  ]);
  if (!matricula) notFound();
  const termica = formatoDe((await searchParams).formato, config.impressoraRecibo) === "termica";
  const grupos = gruposDaGuia(matricula.etapas, matricula.tipoProcesso);

  if (grupos.length === 0) {
    return (
      <p className="mx-auto max-w-xl p-10 text-center text-lg">
        Esta matrícula não tem taxas do Detran pagas pelo aluno (exames teórico e prático, emissão da CNH). Confira os
        valores e &quot;quem paga&quot; em Exames e taxas.
      </p>
    );
  }

  return (
    <GuiaTaxas
      grupos={grupos}
      aluno={matricula.aluno.nome}
      cpf={formatarCpf(matricula.aluno.cpf)}
      categoria={matricula.categoria}
      obs={config.obsGuiaTaxas || OBS_GUIA_PADRAO}
      termica={termica}
      cabecalho={
        termica ? (
          <CabecalhoCupom config={config} titulo="Taxas do Detran" />
        ) : (
          <CabecalhoDocumento config={config} titulo="Taxas do Detran" compacto />
        )
      }
    />
  );
}
