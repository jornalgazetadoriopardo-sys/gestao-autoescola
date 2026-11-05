"use client";

import { useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import { Botao } from "@/components/ui";

// Botões para levar o post às redes. No celular, "Publicar" abre o
// compartilhamento do aparelho com a imagem (Instagram, Facebook, WhatsApp...).
// No computador, onde isso nem sempre existe, baixa a imagem, copia a legenda
// e abre a rede escolhida para colar. O Instagram não recebe a legenda junto
// com a imagem, por isso ela sempre vai também para a área de transferência.
export function PublicarPost({
  arquivo,
  legenda,
  nomeArquivo,
}: {
  arquivo: () => Promise<File>;
  legenda: string;
  nomeArquivo: string;
}) {
  const [aviso, setAviso] = useState<string | null>(null);
  const [semCompartilhar, setSemCompartilhar] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(legenda);
      return true;
    } catch {
      return false;
    }
  }

  async function baixar() {
    const f = await arquivo();
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function publicar() {
    const f = await arquivo();
    const copiou = await copiar();
    if (navigator.canShare?.({ files: [f] })) {
      try {
        await navigator.share({ files: [f], text: legenda });
        setAviso(copiou ? "Se a rede não trouxer a legenda, é só colar: ela já foi copiada." : null);
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    // Sem compartilhamento de arquivos neste aparelho: caminho manual.
    await baixar();
    setSemCompartilhar(true);
    setAviso(
      `A imagem foi baixada${copiou ? " e a legenda copiada" : ""}. Abra a rede abaixo, crie a publicação, escolha a imagem baixada e cole a legenda (Ctrl+V).`,
    );
  }

  const rede = (href: string, texto: string, cor: string) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white ${cor}`}
    >
      {texto}
    </a>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Botao type="button" icone={Share2} onClick={publicar}>
          Publicar nas redes
        </Botao>
        <Botao type="button" variante="secundario" icone={Download} onClick={baixar}>
          Baixar imagem
        </Botao>
        <Botao
          type="button"
          variante="secundario"
          icone={Copy}
          onClick={async () => setAviso((await copiar()) ? "Legenda copiada!" : "Não foi possível copiar.")}
        >
          Copiar legenda
        </Botao>
      </div>
      {aviso && <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">{aviso}</p>}
      {semCompartilhar && (
        <div className="flex flex-wrap gap-2">
          {rede("https://www.instagram.com/", "Abrir Instagram", "bg-[#d62976] hover:bg-[#b81f63]")}
          {rede("https://www.facebook.com/", "Abrir Facebook", "bg-[#1877f2] hover:bg-[#1465d1]")}
          {rede(
            `https://wa.me/?text=${encodeURIComponent(legenda)}`,
            "WhatsApp (legenda)",
            "bg-[#25D366] hover:bg-[#1ebe5b]",
          )}
        </div>
      )}
    </div>
  );
}
