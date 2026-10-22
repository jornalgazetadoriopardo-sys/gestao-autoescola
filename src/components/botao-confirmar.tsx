"use client";

import { Botao } from "./ui";

// Botão de formulário que pede confirmação antes de executar a action.
export function BotaoConfirmar({
  acao,
  mensagem,
  children,
}: {
  acao: () => Promise<void>;
  mensagem: string;
  children: React.ReactNode;
}) {
  return (
    <form action={acao}>
      <Botao
        variante="perigo"
        tamanho="pequeno"
        onClick={(e) => {
          if (!confirm(mensagem)) e.preventDefault();
        }}
      >
        {children}
      </Botao>
    </form>
  );
}
