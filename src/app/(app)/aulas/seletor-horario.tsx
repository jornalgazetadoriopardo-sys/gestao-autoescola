"use client";

import { Clock } from "lucide-react";
import { Input } from "@/components/ui";
import {
  motivoOcupado,
  opcoesDeHorario,
  type Expediente,
  type Ocupado,
  type Pedido,
} from "@/lib/disponibilidade";

// Grade de horários do dia: os livres podem ser escolhidos e os ocupados ficam
// desabilitados (passando o mouse aparece o motivo). Também aceita outro horário
// digitado, avisando se estiver ocupado.
export function SeletorHorario({
  pedido,
  ocupados,
  carregando,
  expediente,
  valor,
  onChange,
  name,
}: {
  pedido: Pedido;
  ocupados: Ocupado[];
  carregando: boolean;
  expediente: Expediente;
  valor: string;
  onChange: (hora: string) => void;
  name: string;
}) {
  const faltando = [
    !pedido.data && "a data",
    !pedido.alunoId && "o aluno",
    !pedido.instrutorId && "o instrutor",
    pedido.tipo === "pratica" && !pedido.veiculoId && "o veículo",
  ].filter(Boolean);
  const opcoes = opcoesDeHorario(pedido, ocupados, expediente);
  const livres = opcoes.filter((o) => !o.motivo).length;
  const motivoValor = valor && pedido.data ? motivoOcupado(pedido, valor, ocupados) : null;

  return (
    <div>
      <input type="hidden" name={name} value={valor} />
      {faltando.length > 0 ? (
        <p className="rounded-lg bg-slate-50 p-3 text-base text-slate-600">
          Escolha {faltando.join(", ")} para ver os horários livres.
        </p>
      ) : (
        <>
          <p className="mb-2 text-sm text-slate-600">
            {carregando
              ? "Conferindo a agenda..."
              : livres === 0
                ? "Nenhum horário livre neste dia. Escolha outra data ou outro instrutor/veículo."
                : `${livres} ${livres === 1 ? "horário livre" : "horários livres"}. Os riscados estão ocupados.`}
          </p>
          <div className={`grid grid-cols-4 gap-2 sm:grid-cols-6 ${carregando ? "opacity-50" : ""}`}>
            {opcoes.map(({ hora, motivo }) => {
              const marcado = valor === hora;
              return (
                <button
                  key={hora}
                  type="button"
                  disabled={Boolean(motivo) || carregando}
                  title={motivo ? `Ocupado: ${motivo}` : "Livre"}
                  aria-pressed={marcado}
                  onClick={() => onChange(hora)}
                  className={`rounded-lg border-2 py-2 text-base font-semibold transition ${
                    marcado
                      ? "border-blue-600 bg-blue-600 text-white"
                      : motivo
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through"
                        : "border-green-300 bg-green-50 text-green-900 hover:border-green-500"
                  }`}
                >
                  {hora}
                </button>
              );
            })}
          </div>
        </>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Clock className="size-4" aria-hidden /> Outro horário:
        <div className="w-36">
          <Input
            type="time"
            step={300}
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Outro horário"
          />
        </div>
      </div>
      {motivoValor && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-base font-medium text-red-700">
          {valor} não está disponível: {motivoValor}.
        </p>
      )}
    </div>
  );
}
