"use client";

import { TriangleAlert } from "lucide-react";
import { Botao, Cartao, IconeRedondo } from "@/components/ui";

// Algo deu errado ao abrir a tela ou ao salvar: mensagem simples e opção de tentar de novo.
export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <Cartao className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-4 text-center">
      <IconeRedondo icone={TriangleAlert} cor="vermelho" tamanho="grande" />
      <h1 className="text-2xl font-bold">Não foi possível concluir</h1>
      <p className="text-base text-slate-600">
        Pode ter sido uma falha de conexão. Tente de novo; se continuar, volte para a tela anterior.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Botao onClick={reset}>Tentar de novo</Botao>
        <Botao variante="secundario" onClick={() => history.back()}>
          Voltar
        </Botao>
      </div>
    </Cartao>
  );
}
