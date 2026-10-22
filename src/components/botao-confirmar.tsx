"use client";

import { Trash2, Undo2, X } from "lucide-react";
import { Botao } from "./ui";

// Ícones são escolhidos por nome: componentes não podem ser passados do
// servidor para um componente de cliente.
const icones = { excluir: Trash2, desfazer: Undo2, cancelar: X };

// Botão de formulário que pede confirmação antes de executar a action.
export function BotaoConfirmar({
  acao,
  mensagem,
  icone,
  children,
}: {
  acao: () => Promise<void>;
  mensagem: string;
  icone?: keyof typeof icones;
  children: React.ReactNode;
}) {
  return (
    <form action={acao}>
      <Botao
        variante="perigo"
        tamanho="pequeno"
        icone={icone ? icones[icone] : undefined}
        onClick={(e) => {
          if (!confirm(mensagem)) e.preventDefault();
        }}
      >
        {children}
      </Botao>
    </form>
  );
}
