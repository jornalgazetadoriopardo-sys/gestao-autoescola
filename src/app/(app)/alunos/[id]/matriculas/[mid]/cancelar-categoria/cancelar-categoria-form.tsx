"use client";

import { useState } from "react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Input, Textarea } from "@/components/ui";
import { cancelarCategoria } from "../../actions";

type Opcao = {
  letra: string;
  fica: string;
  aulasAgendadas: number;
  aulasFeitas: number | null;
  provaSai: boolean;
  praticasQueFicam: number;
};

export function CancelarCategoriaForm({ matriculaId, opcoes }: { matriculaId: number; opcoes: Opcao[] }) {
  const [letra, setLetra] = useState("");
  const escolhida = opcoes.find((o) => o.letra === letra);
  const [praticas, setPraticas] = useState("");

  return (
    <FormAcao
      acao={cancelarCategoria.bind(null, matriculaId)}
      textoBotao="Cancelar a categoria"
      varianteBotao="primario"
    >
      <fieldset>
        <legend className="mb-2 text-base font-medium text-slate-800">De qual categoria o aluno desistiu?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {opcoes.map((o) => (
            <label
              key={o.letra}
              className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 transition ${
                letra === o.letra ? "border-red-500 bg-red-50" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="categoria"
                value={o.letra}
                checked={letra === o.letra}
                onChange={() => {
                  setLetra(o.letra);
                  setPraticas(String(o.praticasQueFicam));
                }}
                className="sr-only"
              />
              <span className="text-lg font-semibold">Categoria {o.letra}</span>
              <span className="text-sm text-slate-600">Fica só com a categoria {o.fica}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {escolhida && (
        <>
          <div className="rounded-xl bg-amber-50 p-4 text-base text-amber-950">
            <p className="mb-1 font-semibold">O que vai acontecer:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                A matrícula passa de {escolhida.letra}
                {escolhida.fica} para <b>{escolhida.fica}</b>.
              </li>
              <li>
                {escolhida.aulasAgendadas > 0
                  ? `${escolhida.aulasAgendadas} ${escolhida.aulasAgendadas === 1 ? "aula agendada" : "aulas agendadas"} da categoria ${escolhida.letra} ${escolhida.aulasAgendadas === 1 ? "será cancelada" : "serão canceladas"}.`
                  : `Não há aulas agendadas da categoria ${escolhida.letra}.`}
                {escolhida.aulasFeitas ? ` As ${escolhida.aulasFeitas} já feitas continuam no histórico.` : ""}
              </li>
              {escolhida.provaSai && (
                <li>
                  A prova prática da categoria {escolhida.letra} (ainda não feita nem paga) sai da lista de exames.
                </li>
              )}
              <li>
                O valor e as parcelas <b>não mudam sozinhos</b>. Se houver devolução ou desconto, ajuste depois em{" "}
                <b>Alterar</b> (matrícula) e nas parcelas.
              </li>
            </ul>
          </div>
          <Campo
            label={`Aulas práticas que continuam (categoria ${escolhida.fica})`}
            ajuda="Confira: é o número de aulas contratadas que o aluno ainda vai ter."
          >
            <Input
              name="praticasRestantes"
              type="number"
              min={0}
              required
              value={praticas}
              onChange={(e) => setPraticas(e.target.value)}
              className="max-w-40"
            />
          </Campo>
          <Campo label="Motivo (opcional)">
            <Textarea name="motivo" rows={2} maxLength={300} placeholder="Ex.: desistiu da moto por motivo de saúde" />
          </Campo>
        </>
      )}
    </FormAcao>
  );
}
