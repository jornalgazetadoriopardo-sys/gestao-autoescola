import { CalendarCheck, CalendarClock, Clock } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input, Tabela } from "@/components/ui";
import { obterConfigCompleta } from "@/lib/config";
import { db } from "@/lib/db";
import { formatarData, hojeISO } from "@/lib/format";
import { lerHorarios, nomeDoDia, resumoHorarios } from "@/lib/horarios";
import { adicionarDiaEspecial, excluirDiaEspecial } from "./actions";
import { FormHorarios } from "./form-horarios";

// Aba "Horários" das configurações: funcionamento da semana, dias especiais e exceções.
export async function HorariosFuncionamento() {
  const hoje = hojeISO();
  const [config, especiais] = await Promise.all([
    obterConfigCompleta(),
    db.diaEspecial.findMany({ where: { data: { gte: new Date(`${hoje}T00:00:00Z`) } }, orderBy: { data: "asc" } }),
  ]);
  const horarios = lerHorarios(config.horarios, config.horaInicio, config.horaFim);

  return (
    <div className="space-y-6">
      <Cartao className="max-w-3xl">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Clock className="size-6 text-blue-600" aria-hidden /> Horário de funcionamento
        </h2>
        <p className="mb-2 text-base text-slate-600">
          Ao agendar, só aparecem livres os horários em que a autoescola está aberta. Dias fechados ficam riscados no
          calendário.
        </p>
        <p className="mb-5 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
          {config.horarios ? "Hoje: " : "Ainda não configurado (todos os dias abertos). Atual: "}
          <b>{resumoHorarios(horarios)}</b>
          {horarios.almoco && ` · almoço ${horarios.almoco.inicio}–${horarios.almoco.fim}`}
        </p>
        <FormHorarios inicial={horarios} intervaloMin={config.intervaloMin} />
      </Cartao>

      <Cartao className="max-w-3xl">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <CalendarCheck className="size-6 text-green-600" aria-hidden /> Dias especiais (abrir fora do normal)
        </h2>
        <p className="mb-5 text-base text-slate-600">
          Vai abrir num feriado, num domingo ou num sábado à tarde? Cadastre o dia com o horário e as aulas poderão ser
          marcadas normalmente nele. Para fechar um dia em que normalmente abre, use a aba Feriados.
        </p>
        <FormAcao acao={adicionarDiaEspecial} textoBotao="Liberar este dia" limparAoSalvar>
          <div className="grid gap-4 sm:grid-cols-[11rem_8rem_8rem_1fr]">
            <Campo label="Data">
              <Input name="data" type="date" required min={hoje} />
            </Campo>
            <Campo label="Das">
              <Input name="inicio" type="time" step={300} required defaultValue="08:00" />
            </Campo>
            <Campo label="Às">
              <Input name="fim" type="time" step={300} required defaultValue="12:00" />
            </Campo>
            <Campo label="Motivo (opcional)">
              <Input name="motivo" maxLength={80} placeholder="Ex.: mutirão de aulas" />
            </Campo>
          </div>
        </FormAcao>
        {especiais.length > 0 && (
          <div className="mt-6">
            <Tabela cabecalhos={["Data", "Horário", "Motivo", ""]}>
              {especiais.map((e) => {
                const dia = e.data.toISOString().slice(0, 10);
                return (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-medium">
                      {formatarData(e.data)} <span className="text-sm text-slate-500">({nomeDoDia(dia)})</span>
                    </td>
                    <td className="px-4 py-3">
                      {e.inicio} às {e.fim}
                    </td>
                    <td className="px-4 py-3">{e.motivo ?? "—"}</td>
                    <td className="px-4 py-3">
                      <BotaoConfirmar
                        acao={excluirDiaEspecial.bind(null, e.id)}
                        mensagem={`Tirar ${formatarData(e.data)} dos dias especiais? As aulas já marcadas continuam.`}
                        icone="excluir"
                      >
                        Excluir
                      </BotaoConfirmar>
                    </td>
                  </tr>
                );
              })}
            </Tabela>
          </div>
        )}
      </Cartao>

      <Cartao className="max-w-3xl">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <CalendarClock className="size-6 text-amber-600" aria-hidden /> Exceção numa aula só
        </h2>
        <p className="text-base text-slate-600">
          Para um caso isolado (um aluno que só pode no domingo, uma aula depois do expediente), não precisa mudar nada
          aqui: ao agendar, marque <b>“Exceção: agendar fora do horário de funcionamento”</b>. A aula aparece na agenda
          com a marca “Exceção”. Aluno, instrutor e veículo continuam sem poder estar em duas aulas ao mesmo tempo.
        </p>
      </Cartao>
    </div>
  );
}
