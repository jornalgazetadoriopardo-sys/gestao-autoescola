"use client";

import { CalendarClock } from "lucide-react";

// "Exceção": libera marcar a aula fora do horário de funcionamento (fim de semana,
// feriado, almoço, depois do expediente). Conflitos de aluno, instrutor e veículo
// continuam valendo.
export function CampoExcecao({ marcado, onChange }: { marcado: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition ${
        marcado ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <input
        type="checkbox"
        name="excecao"
        checked={marcado}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 shrink-0 accent-amber-600"
      />
      <span>
        <span className="flex items-center gap-1.5 text-base font-semibold text-slate-800">
          <CalendarClock className="size-4 text-amber-600" aria-hidden /> Exceção: agendar fora do horário de
          funcionamento
        </span>
        <span className="block text-sm text-slate-600">
          Para casos especiais, como feriado, fim de semana ou depois do expediente. A aula aparece na agenda com a
          marca “Exceção”.
        </span>
      </span>
    </label>
  );
}
