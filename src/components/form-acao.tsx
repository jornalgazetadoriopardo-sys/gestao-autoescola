"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Botao, MensagemErro } from "./ui";

export type EstadoForm = { erro?: string; ok?: string };
export type AcaoForm = (estado: EstadoForm, dados: FormData) => Promise<EstadoForm>;

// Formulário que chama uma server action e mostra a mensagem de erro devolvida.
// O envio é feito pelo onSubmit para que o React não limpe os campos quando
// a action devolve um erro de validação.
export function FormAcao({
  acao,
  children,
  textoBotao = "Salvar",
  varianteBotao = "primario",
  limparAoSalvar = false,
}: {
  acao: AcaoForm;
  children: ReactNode;
  textoBotao?: string;
  varianteBotao?: "primario" | "sucesso";
  // Limpa os campos depois de salvar com sucesso (ex.: cadastro de usuário).
  limparAoSalvar?: boolean;
}) {
  const [estado, executar, enviando] = useActionState(acao, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (limparAoSalvar && estado.ok) form.current?.reset();
  }, [estado, limparAoSalvar]);
  return (
    <form
      ref={form}
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        startTransition(() => executar(dados));
      }}
    >
      <MensagemErro erro={estado.erro} />
      {estado.ok && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-base font-medium text-green-800">{estado.ok}</p>
      )}
      {children}
      <Botao type="submit" disabled={enviando} icone={Check} variante={varianteBotao}>
        {enviando ? "Salvando..." : textoBotao}
      </Botao>
    </form>
  );
}
