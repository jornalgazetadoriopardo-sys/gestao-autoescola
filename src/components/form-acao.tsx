"use client";

import { startTransition, useActionState, type ReactNode } from "react";
import { Botao, MensagemErro } from "./ui";

export type EstadoForm = { erro?: string };
export type AcaoForm = (estado: EstadoForm, dados: FormData) => Promise<EstadoForm>;

// Formulário que chama uma server action e mostra a mensagem de erro devolvida.
// O envio é feito pelo onSubmit para que o React não limpe os campos quando
// a action devolve um erro de validação.
export function FormAcao({
  acao,
  children,
  textoBotao = "Salvar",
}: {
  acao: AcaoForm;
  children: ReactNode;
  textoBotao?: string;
}) {
  const [estado, executar, enviando] = useActionState(acao, {});
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        startTransition(() => executar(dados));
      }}
    >
      <MensagemErro erro={estado.erro} />
      {children}
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Salvando..." : textoBotao}
      </Botao>
    </form>
  );
}
