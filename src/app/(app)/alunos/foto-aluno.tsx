"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Trash2, UserRound, X } from "lucide-react";
import { Botao } from "@/components/ui";

// Foto 3x4 em pé, reduzida no navegador.
const LARGURA = 360;
const ALTURA = 480;

// Recorta o centro da imagem na proporção 3x4 e devolve um JPEG leve.
function recortar(origem: CanvasImageSource, largura: number, altura: number, espelhar = false) {
  const proporcao = LARGURA / ALTURA;
  let w = largura;
  let h = largura / proporcao;
  if (h > altura) {
    h = altura;
    w = altura * proporcao;
  }
  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext("2d")!;
  if (espelhar) {
    ctx.translate(LARGURA, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(origem, (largura - w) / 2, (altura - h) / 2, w, h, 0, 0, LARGURA, ALTURA);
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Escolher uma foto do computador/celular ou tirar com a câmera.
export function FotoAluno({ inicial }: { inicial: string | null }) {
  const [foto, setFoto] = useState(inicial ?? "");
  const [alterada, setAlterada] = useState(false);
  const [camera, setCamera] = useState(false);
  const [erro, setErro] = useState("");
  const [temCamera, setTemCamera] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    setTemCamera(Boolean(navigator.mediaDevices?.getUserMedia));
    return () => stream.current?.getTracks().forEach((t) => t.stop());
  }, []);

  function trocar(nova: string) {
    setFoto(nova);
    setAlterada(true);
    setErro("");
  }

  function fecharCamera() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setCamera(false);
  }

  async function abrirCamera() {
    setErro("");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setCamera(true);
      // O <video> aparece depois desta renderização.
      requestAnimationFrame(() => {
        if (video.current && stream.current) {
          video.current.srcObject = stream.current;
          video.current.play().catch(() => {});
        }
      });
    } catch {
      setErro(
        "Não foi possível abrir a câmera. Confira se há uma câmera ligada e se o navegador tem permissão para usá-la.",
      );
    }
  }

  function tirarFoto() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    trocar(recortar(v, v.videoWidth, v.videoHeight, true));
    fecharCamera();
  }

  function escolherArquivo(f: File | undefined) {
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      trocar(recortar(img, img.width, img.height));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setErro("Não foi possível ler esta imagem. Use uma foto JPG ou PNG.");
    img.src = URL.createObjectURL(f);
  }

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-xl bg-slate-50 p-4">
      <input type="hidden" name="foto" value={alterada ? foto : "manter"} />
      <div className="flex h-40 w-30 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
        {camera ? (
          <video ref={video} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
        ) : foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="Foto do aluno" className="h-full w-full object-cover" />
        ) : (
          <UserRound className="size-14 text-slate-300" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-base font-medium text-slate-800">Foto do aluno</p>
        <p className="text-sm text-slate-600">
          {camera ? "Posicione o rosto no quadro e clique em Tirar foto." : "Aparece na ficha e no guia do aluno."}
        </p>
        <div className="flex flex-wrap gap-2">
          {camera ? (
            <>
              <Botao type="button" variante="sucesso" tamanho="pequeno" icone={Camera} onClick={tirarFoto}>
                Tirar foto
              </Botao>
              <Botao type="button" variante="secundario" tamanho="pequeno" icone={X} onClick={fecharCamera}>
                Cancelar
              </Botao>
            </>
          ) : (
            <>
              <Botao
                type="button"
                variante="secundario"
                tamanho="pequeno"
                icone={ImageUp}
                onClick={() => arquivo.current?.click()}
              >
                Escolher arquivo
              </Botao>
              {temCamera && (
                <Botao type="button" variante="secundario" tamanho="pequeno" icone={Camera} onClick={abrirCamera}>
                  Usar câmera
                </Botao>
              )}
              {foto && (
                <Botao type="button" variante="perigo" tamanho="pequeno" icone={Trash2} onClick={() => trocar("")}>
                  Remover
                </Botao>
              )}
            </>
          )}
        </div>
        {erro && <p className="text-sm font-medium text-red-700">{erro}</p>}
        <input
          ref={arquivo}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            escolherArquivo(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
