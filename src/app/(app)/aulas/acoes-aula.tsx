import { BotaoConfirmar } from "@/components/botao-confirmar";
import { marcarAula } from "./actions";

const botao = "rounded-md border px-2.5 py-1 text-xs font-medium";

// Botões de presença de uma aula, conforme a situação atual.
export function AcoesAula({ aula }: { aula: { id: number; status: string } }) {
  if (aula.status === "agendada") {
    return (
      <div className="flex items-center gap-1.5">
        <form action={marcarAula.bind(null, aula.id, "presente")}>
          <button className={`${botao} border-green-300 bg-green-50 text-green-800 hover:bg-green-100`}>
            Presente
          </button>
        </form>
        <form action={marcarAula.bind(null, aula.id, "faltou")}>
          <button className={`${botao} border-red-300 bg-red-50 text-red-800 hover:bg-red-100`}>Faltou</button>
        </form>
        <BotaoConfirmar acao={marcarAula.bind(null, aula.id, "cancelada")} mensagem="Cancelar esta aula?">
          Cancelar
        </BotaoConfirmar>
      </div>
    );
  }
  if (aula.status === "presente" || aula.status === "faltou") {
    return (
      <form action={marcarAula.bind(null, aula.id, "agendada")}>
        <button className={`${botao} border-slate-300 text-slate-600 hover:bg-slate-50`}>Desfazer</button>
      </form>
    );
  }
  return null;
}
