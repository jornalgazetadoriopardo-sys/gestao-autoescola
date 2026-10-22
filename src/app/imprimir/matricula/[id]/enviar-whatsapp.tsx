"use client";

import { MessageCircle } from "lucide-react";

// Abre o WhatsApp com o resumo da matrícula para o aluno. O PDF do guia
// (Imprimir → Salvar como PDF) pode ser anexado na mesma conversa.
export function EnviarWhatsapp({ telefone, mensagem }: { telefone: string | null; mensagem: string }) {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  const numero = digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : digitos;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  return (
    <div className="mx-auto mb-4 flex w-[210mm] max-w-full flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow print:hidden">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-green-700"
      >
        <MessageCircle className="size-5" aria-hidden /> Enviar resumo pelo WhatsApp
      </a>
      <p className="flex-1 text-sm text-slate-600">
        {numero
          ? "Abre a conversa com o aluno já com a mensagem escrita."
          : "O aluno não tem telefone cadastrado: escolha o contato no WhatsApp."}{" "}
        Para mandar o guia completo, clique em <b>Imprimir</b>, escolha <b>Salvar como PDF</b> e anexe o arquivo na
        conversa.
      </p>
    </div>
  );
}
