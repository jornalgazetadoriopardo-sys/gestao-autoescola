"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Botao, Campo, Input, Select } from "@/components/ui";
import { NOMES_DIAS, type Horarios } from "@/lib/horarios";
import { salvarHorarios } from "./actions";

const INTERVALOS = [10, 15, 20, 30, 45, 50, 60, 90, 100, 120];
const ORDEM = [1, 2, 3, 4, 5, 6, 0]; // de segunda a domingo

function rotuloIntervalo(m: number) {
  if (m < 60) return `${m} minutos`;
  if (m === 60) return "1 hora";
  return `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}`;
}

// Semana de funcionamento: um dia por linha, com "abre?" e o horário.
export function FormHorarios({ inicial, intervaloMin }: { inicial: Horarios; intervaloMin: number }) {
  const [dias, setDias] = useState(inicial.dias);
  const [almoco, setAlmoco] = useState(Boolean(inicial.almoco));
  const mudar = (i: number, m: Partial<Horarios["dias"][number]>) =>
    setDias((atual) => atual.map((d, j) => (j === i ? { ...d, ...m } : d)));
  // Copia o horário de segunda para terça a sexta.
  const copiarSegunda = () => setDias((atual) => atual.map((d, j) => (j >= 2 && j <= 5 ? { ...atual[1] } : d)));

  return (
    <FormAcao acao={salvarHorarios} textoBotao="Salvar horários">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-base">
          <thead className="bg-slate-50 text-sm text-slate-600">
            <tr>
              <th className="px-3 py-2">Dia</th>
              <th className="px-3 py-2">Abre?</th>
              <th className="px-3 py-2">Das</th>
              <th className="px-3 py-2">Às</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ORDEM.map((i) => {
              const d = dias[i];
              return (
                <tr key={i} className={d.aberto ? "" : "bg-slate-50 text-slate-400"}>
                  <td className="px-3 py-2 font-medium">{NOMES_DIAS[i]}</td>
                  <td className="px-3 py-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name={`aberto_${i}`}
                        checked={d.aberto}
                        onChange={(e) => mudar(i, { aberto: e.target.checked })}
                        className="size-5"
                        aria-label={`${NOMES_DIAS[i]}: abre`}
                      />
                      <span className="text-sm">{d.aberto ? "Abre" : "Fechado"}</span>
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="time"
                      step={300}
                      name={`inicio_${i}`}
                      value={d.inicio}
                      disabled={!d.aberto}
                      onChange={(e) => mudar(i, { inicio: e.target.value })}
                      aria-label={`${NOMES_DIAS[i]}: abre às`}
                      className="w-32"
                    />
                    {!d.aberto && <input type="hidden" name={`inicio_${i}`} value={d.inicio} />}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="time"
                      step={300}
                      name={`fim_${i}`}
                      value={d.fim}
                      disabled={!d.aberto}
                      onChange={(e) => mudar(i, { fim: e.target.value })}
                      aria-label={`${NOMES_DIAS[i]}: fecha às`}
                      className="w-32"
                    />
                    {!d.aberto && <input type="hidden" name={`fim_${i}`} value={d.fim} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div>
        <Botao type="button" variante="secundario" tamanho="pequeno" icone={Copy} onClick={copiarSegunda}>
          Usar o horário de segunda de terça a sexta
        </Botao>
      </div>

      <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center gap-3 text-base font-semibold">
          <input
            type="checkbox"
            name="almoco"
            checked={almoco}
            onChange={(e) => setAlmoco(e.target.checked)}
            className="size-5"
          />
          Pausa para o almoço (sem aulas nesse intervalo)
        </label>
        {almoco && (
          <div className="mt-3 grid max-w-md grid-cols-2 gap-4">
            <Campo label="Das">
              <Input type="time" step={300} name="almocoInicio" defaultValue={inicial.almoco?.inicio ?? "12:00"} />
            </Campo>
            <Campo label="Às">
              <Input type="time" step={300} name="almocoFim" defaultValue={inicial.almoco?.fim ?? "13:00"} />
            </Campo>
          </div>
        )}
      </fieldset>

      <Campo
        label="Uma aula a cada"
        ajuda="Os horários oferecidos ao agendar. Ex.: de 1 em 1 hora, a partir da abertura."
        className="max-w-xs"
      >
        <Select name="intervaloMin" defaultValue={String(intervaloMin)}>
          {INTERVALOS.map((m) => (
            <option key={m} value={m}>
              {rotuloIntervalo(m)}
            </option>
          ))}
        </Select>
      </Campo>
    </FormAcao>
  );
}
