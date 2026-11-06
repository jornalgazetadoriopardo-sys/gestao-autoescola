"use client";

import { useEffect, useRef } from "react";
import { MODELOS_POST, type FormatoPost } from "@/lib/posts";
import type { Identidade } from "@/lib/identidade";
import { desenharPost } from "./desenhar";
import type { MarcaInicial } from "./editor-post";
import { carregarFontes } from "./fontes-posts";

// Prévia de um modelo com os dados de exemplo (galeria e configurações).
export function MiniaturaModelo({
  modelo,
  marca,
  identidade,
  formato = "feed",
  className = "aspect-square",
}: {
  modelo: string;
  marca: MarcaInicial;
  // Para prévia de outra identidade (tela de configurações); senão usa a da autoescola.
  identidade?: Identidade;
  formato?: FormatoPost;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const id = identidade ?? marca.identidade;
  useEffect(() => {
    let ativo = true;
    let logo: HTMLImageElement | null = null;
    const desenhar = () =>
      ativo &&
      canvas.current &&
      desenharPost(canvas.current, modelo, MODELOS_POST[modelo].exemplo, {}, { ...marca, logo }, formato, {
        ...id,
        escurecer: null,
      });
    desenhar();
    carregarFontes([id.fonteTitulo, id.fonteTexto]).then(desenhar);
    if (marca.logoUrl) {
      const img = new Image();
      img.onload = () => {
        logo = img;
        desenhar();
      };
      img.src = marca.logoUrl;
    }
    return () => {
      ativo = false;
    };
  }, [modelo, marca, id, formato]);
  return <canvas ref={canvas} className={`h-auto w-full rounded-xl ${className}`} aria-hidden />;
}
