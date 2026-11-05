"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, ImageOff, Lightbulb, RefreshCw, Save } from "lucide-react";
import { Botao, Campo, Cartao, Input, Select, Textarea } from "@/components/ui";
import { DICAS_TRANSITO, FORMATOS_POST, MODELOS_POST, legendas, type FormatoPost } from "@/lib/posts";
import { desenharPost, type Marca } from "./desenhar";
import { PublicarPost } from "./publicar";
import { salvarPost } from "./actions";

export type MarcaInicial = Omit<Marca, "logo"> & { logoUrl: string | null; uf: string | null };
export type AlunoPost = { id: number; nome: string; categoria: string; foto: string | null; aprovado: boolean };

function carregarImagem(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

export function EditorPost({ modelo, marca, alunos }: { modelo: string; marca: MarcaInicial; alunos: AlunoPost[] }) {
  const def = MODELOS_POST[modelo];
  const [dados, setDados] = useState<Record<string, string>>(def.exemplo);
  const [foto, setFoto] = useState<HTMLImageElement | null>(null);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [formato, setFormato] = useState<FormatoPost>("feed");
  const [variante, setVariante] = useState(0);
  const [legenda, setLegenda] = useState("");
  const [editada, setEditada] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const temFoto = def.campos.some((c) => c.tipo === "foto");
  const comAluno = modelo === "aprovado" || modelo === "depoimento";

  useEffect(() => {
    if (marca.logoUrl) carregarImagem(marca.logoUrl).then(setLogo, () => setLogo(null));
  }, [marca.logoUrl]);

  // Desenha de novo a cada mudança.
  useEffect(() => {
    if (canvas.current) {
      desenharPost(canvas.current, modelo, dados, { foto }, { ...marca, logo }, formato);
    }
  }, [modelo, dados, foto, logo, formato, marca]);
  // Mexeu no post depois de salvar: o aviso de "salvo" some (salvar de novo cria outro).
  useEffect(() => setSalvo(null), [dados, foto, formato]);

  const opcoesLegenda = useMemo(
    () => legendas(modelo, dados, { nome: marca.nome, cidade: marca.cidade, uf: marca.uf, contato: marca.contato }),
    [modelo, dados, marca],
  );
  useEffect(() => {
    if (!editada) setLegenda(opcoesLegenda[variante % opcoesLegenda.length]);
  }, [opcoesLegenda, variante, editada]);

  const mudar = (campo: string, valor: string) => setDados((d) => ({ ...d, [campo]: valor }));

  async function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    try {
      setFoto(await carregarImagem(url));
    } catch {
      setErro("Não foi possível abrir esta imagem. Tente uma foto em JPG ou PNG.");
    }
  }

  async function escolherAluno(id: string) {
    const a = alunos.find((x) => String(x.id) === id);
    if (!a) return;
    setDados((d) => ({ ...d, nome: a.nome, categoria: a.categoria }));
    if (a.foto) carregarImagem(a.foto).then(setFoto, () => {});
  }

  function arquivo() {
    return new Promise<File>((ok, erro) =>
      canvas.current?.toBlob(
        (b) => (b ? ok(new File([b], nomeArquivo, { type: "image/jpeg" })) : erro(new Error("sem imagem"))),
        "image/jpeg",
        0.92,
      ),
    );
  }
  const nomeArquivo = `${def.titulo.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${formato}.jpg`;

  async function salvar() {
    if (!canvas.current) return;
    setSalvando(true);
    setErro(null);
    const titulo = [dados.titulo, dados.nome, dados.curso].find((t) => t?.trim()) ?? def.titulo;
    const r = await salvarPost({
      modelo,
      formato,
      titulo: `${def.titulo}: ${titulo}`,
      legenda,
      imagem: canvas.current.toDataURL("image/jpeg", 0.9),
    });
    setSalvando(false);
    if (r.erro) setErro(r.erro);
    else setSalvo("Post salvo! Ele fica em Redes sociais › Posts salvos.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <Cartao className="h-fit space-y-5">
        <h2 className="text-lg font-semibold">1. Informações do post</h2>
        {comAluno && alunos.length > 0 && (
          <Campo label="Puxar do cadastro (opcional)" ajuda="Preenche nome, categoria e a foto do cadastro.">
            <Select defaultValue="" onChange={(e) => escolherAluno(e.target.value)}>
              <option value="">Escolha um aluno...</option>
              {alunos.some((a) => a.aprovado) && (
                <optgroup label="Aprovados nos últimos 60 dias">
                  {alunos
                    .filter((a) => a.aprovado)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome} ({a.categoria})
                      </option>
                    ))}
                </optgroup>
              )}
              <optgroup label="Todos os alunos">
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.categoria})
                  </option>
                ))}
              </optgroup>
            </Select>
          </Campo>
        )}
        {def.campos.map((c) =>
          c.tipo === "foto" ? (
            <div key={c.id}>
              <span className="mb-1.5 block text-base font-medium text-slate-800">{c.rotulo}</span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Camera className="size-4" aria-hidden /> {foto ? "Trocar foto" : "Escolher foto"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => escolherFoto(e.target.files?.[0])}
                  />
                </label>
                {foto && (
                  <Botao
                    type="button"
                    variante="secundario"
                    tamanho="pequeno"
                    icone={ImageOff}
                    onClick={() => setFoto(null)}
                  >
                    Remover foto
                  </Botao>
                )}
              </div>
              {c.ajuda && <span className="mt-1 block text-sm text-slate-500">{c.ajuda}</span>}
            </div>
          ) : (
            <Campo key={c.id} label={c.rotulo} ajuda={c.ajuda}>
              {c.tipo === "textarea" ? (
                <Textarea
                  rows={4}
                  value={dados[c.id] ?? ""}
                  maxLength={c.max}
                  placeholder={c.placeholder}
                  onChange={(e) => mudar(c.id, e.target.value)}
                />
              ) : (
                <Input
                  value={dados[c.id] ?? ""}
                  maxLength={c.max}
                  placeholder={c.placeholder}
                  onChange={(e) => mudar(c.id, e.target.value)}
                />
              )}
            </Campo>
          ),
        )}
        {modelo === "dica" && (
          <Botao
            type="button"
            variante="secundario"
            icone={Lightbulb}
            onClick={() => {
              const i = DICAS_TRANSITO.indexOf(dados.dica ?? "");
              mudar("dica", DICAS_TRANSITO[(i + 1) % DICAS_TRANSITO.length]);
            }}
          >
            Sugerir dica
          </Botao>
        )}
        {temFoto && comAluno && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Só publique a foto de alunos que autorizaram o uso de imagem (Configurações › Documentos tem um modelo de
            autorização).
          </p>
        )}
      </Cartao>

      <div className="space-y-6">
        <Cartao>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">2. Imagem</h2>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Formato">
              {(Object.keys(FORMATOS_POST) as FormatoPost[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={formato === f}
                  onClick={() => setFormato(f)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    formato === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {FORMATOS_POST[f].titulo}
                </button>
              ))}
            </div>
          </div>
          <div className={`mx-auto ${formato === "story" ? "max-w-[22rem]" : "max-w-[34rem]"}`}>
            <canvas
              ref={canvas}
              className="h-auto w-full rounded-xl border border-slate-200 shadow-sm"
              aria-label="Prévia do post"
            />
          </div>
        </Cartao>

        <Cartao className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">3. Legenda</h2>
            <Botao
              type="button"
              variante="secundario"
              tamanho="pequeno"
              icone={RefreshCw}
              onClick={() => {
                setEditada(false);
                setVariante((v) => v + 1);
              }}
            >
              Gerar outra legenda
            </Botao>
          </div>
          <Textarea
            rows={10}
            value={legenda}
            onChange={(e) => {
              setLegenda(e.target.value);
              setEditada(true);
            }}
            aria-label="Legenda do post"
          />
          <p className="text-sm text-slate-500">
            A legenda acompanha o que você preencher. Pode editar à vontade; “Gerar outra legenda” troca o texto.
          </p>
        </Cartao>

        <Cartao className="space-y-4">
          <h2 className="text-lg font-semibold">4. Salvar ou publicar</h2>
          <PublicarPost arquivo={arquivo} legenda={legenda} nomeArquivo={nomeArquivo} />
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
            <Botao type="button" variante="secundario" icone={Save} onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar no sistema"}
            </Botao>
            {salvo && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                <Check className="size-4" aria-hidden /> {salvo}{" "}
                <Link href="/posts" className="underline">
                  Ver posts salvos
                </Link>
              </span>
            )}
            {erro && <span className="text-sm font-medium text-red-700">{erro}</span>}
          </div>
        </Cartao>
      </div>
    </div>
  );
}
