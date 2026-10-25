import { FileBadge } from "lucide-react";
import { formatarData } from "@/lib/format";
import { DIAS_AVISO_LICENCIAMENTO, type SituacaoLicenciamento } from "@/lib/licenciamento";

// "Licenciamento 2026: pago" ou "vence 31/10 (em 6 dias)", com cor conforme a urgência.
export function textoLicenciamento(s: SituacaoLicenciamento) {
  if (!s.vencimento || s.dias === null)
    return { texto: "Licenciamento: placa sem número final", cor: "cinza" as const };
  const ano = s.vencimento.getUTCFullYear();
  if (s.pago) return { texto: `Licenciamento ${ano} pago`, cor: "verde" as const };
  const dias = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;
  const quando = s.dias < 0 ? `venceu há ${dias(-s.dias)}` : s.dias === 0 ? "vence hoje" : `vence em ${dias(s.dias)}`;
  const cor = s.dias < 0 ? "vermelho" : s.dias <= DIAS_AVISO_LICENCIAMENTO ? "amarelo" : "cinza";
  return { texto: `Licenciamento ${ano}: ${formatarData(s.vencimento)} (${quando})`, cor } as const;
}

const CORES = {
  verde: "bg-green-100 text-green-800",
  amarelo: "bg-amber-100 text-amber-800",
  vermelho: "bg-red-100 text-red-800",
  cinza: "bg-slate-100 text-slate-700",
};

export function EtiquetaLicenciamento({ situacao }: { situacao: SituacaoLicenciamento }) {
  const { texto, cor } = textoLicenciamento(situacao);
  return (
    <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium ${CORES[cor]}`}>
      <FileBadge className="size-4" aria-hidden />
      {texto}
    </span>
  );
}
