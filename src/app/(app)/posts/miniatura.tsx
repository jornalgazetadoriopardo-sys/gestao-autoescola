"use client";

import { useEffect, useRef } from "react";
import { MODELOS_POST } from "@/lib/posts";
import { desenharPost } from "./desenhar";
import type { MarcaInicial } from "./editor-post";

// Prévia de um modelo com os dados de exemplo, na galeria.
export function MiniaturaModelo({ modelo, marca }: { modelo: string; marca: MarcaInicial }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const desenhar = (logo: HTMLImageElement | null) =>
      canvas.current &&
      desenharPost(canvas.current, modelo, MODELOS_POST[modelo].exemplo, {}, { ...marca, logo }, "feed");
    desenhar(null);
    if (marca.logoUrl) {
      const img = new Image();
      img.onload = () => desenhar(img);
      img.src = marca.logoUrl;
    }
  }, [modelo, marca]);
  return <canvas ref={canvas} className="aspect-square h-auto w-full rounded-xl" aria-hidden />;
}
