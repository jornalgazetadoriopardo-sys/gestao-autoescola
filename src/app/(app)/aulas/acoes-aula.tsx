import Link from "next/link";
import { Check, Pencil, Undo2, X } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { marcarAula } from "./actions";

const botao = "inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-semibold";

// Botões de presença de uma aula, conforme a situação atual, e o link de edição.
// `voltar` é a página para onde a edição retorna depois de salvar.
export function AcoesAula({ aula, voltar }: { aula: { id: number; status: string }; voltar: string }) {
  return (
    <div className="flex items-center gap-2">
      <Presenca aula={aula} />
      <Link
        href={`/aulas/${aula.id}/editar?voltar=${encodeURIComponent(voltar)}`}
        className={`${botao} border-slate-300 text-slate-700 hover:bg-slate-50`}
        title="Editar aula"
      >
        <Pencil className="size-4" aria-hidden /> Editar
      </Link>
    </div>
  );
}

function Presenca({ aula }: { aula: { id: number; status: string } }) {
  if (aula.status === "agendada") {
    return (
      <>
        <form action={marcarAula.bind(null, aula.id, "presente")}>
          <button className={`${botao} border-green-600 bg-green-600 text-white hover:bg-green-700`}>
            <Check className="size-4" aria-hidden /> Presente
          </button>
        </form>
        <form action={marcarAula.bind(null, aula.id, "faltou")}>
          <button className={`${botao} border-red-300 bg-red-50 text-red-800 hover:bg-red-100`}>
            <X className="size-4" aria-hidden /> Faltou
          </button>
        </form>
        <BotaoConfirmar acao={marcarAula.bind(null, aula.id, "cancelada")} mensagem="Cancelar esta aula?">
          Cancelar
        </BotaoConfirmar>
      </>
    );
  }
  if (aula.status === "presente" || aula.status === "faltou") {
    return (
      <form action={marcarAula.bind(null, aula.id, "agendada")}>
        <button className={`${botao} border-slate-300 text-slate-600 hover:bg-slate-50`}>
          <Undo2 className="size-4" aria-hidden /> Desfazer
        </button>
      </form>
    );
  }
  return null;
}
