"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Botao, Campo, Input, Select, Textarea } from "@/components/ui";
import { COMBINACOES, type CoresPost } from "@/lib/cores";
import type { Identidade } from "@/lib/identidade";
import { FORMATOS_POST, MODELOS_POST, type FormatoPost } from "@/lib/posts";
import type { MarcaInicial } from "../posts/editor-post";
import { MiniaturaModelo } from "../posts/miniatura";
import { EscolhaCores, EscolhaFonte } from "../posts/painel-design";
import { salvarIdentidade } from "./actions";

const iguais = (a: CoresPost, b: CoresPost) =>
  a.principal === b.principal && a.destaque === b.destaque && a.escuro === b.escuro && a.claro === b.claro;

// Identidade visual dos posts, com prévia ao vivo ao lado.
export function FormIdentidade({
  inicial,
  coresDoSistema,
  marca,
}: {
  inicial: Identidade;
  coresDoSistema: CoresPost;
  marca: MarcaInicial;
}) {
  const [id, setId] = useState<Identidade>(inicial);
  const [previa, setPrevia] = useState("matriculas");
  const [formato, setFormato] = useState<FormatoPost>("feed");
  const [msg, setMsg] = useState<{ ok?: string; erro?: string }>({});
  const [salvando, iniciar] = useTransition();
  const mudar = (parte: Partial<Identidade>) => {
    setId((atual) => ({ ...atual, ...parte }));
    setMsg({});
  };

  function mudarCores(cores: CoresPost) {
    const pronta = COMBINACOES.find((c) => iguais(c.cores, cores));
    mudar({ cores, combinacao: iguais(cores, coresDoSistema) ? "paleta" : (pronta?.id ?? "personalizada") });
  }

  const salvar = () =>
    iniciar(async () => {
      setMsg(await salvarIdentidade(id));
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <section>
          <h3 className="mb-1 text-base font-semibold">Cores dos posts</h3>
          <p className="mb-3 text-sm text-slate-600">
            “Da autoescola” segue a cor do sistema (escolhida acima). Ou escolha uma combinação pronta, ou ajuste cada
            cor no seletor.
          </p>
          <EscolhaCores cores={id.cores} aoMudar={mudarCores} daAutoescola={coresDoSistema} />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <h3 className="text-base font-semibold sm:col-span-2">Fontes</h3>
          <EscolhaFonte
            rotulo="Títulos"
            valor={id.fonteTitulo}
            aoMudar={(fonteTitulo) => mudar({ fonteTitulo })}
            titulo
          />
          <EscolhaFonte
            rotulo="Textos"
            valor={id.fonteTexto}
            aoMudar={(fonteTexto) => mudar({ fonteTexto })}
            titulo={false}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <h3 className="text-base font-semibold sm:col-span-2">Marca e rodapé</h3>
          <Campo label="Instagram da autoescola" ajuda="Aparece no rodapé dos posts e na legenda.">
            <Input
              value={id.instagram ?? ""}
              placeholder="@suaautoescola"
              maxLength={31}
              onChange={(e) => mudar({ instagram: e.target.value || null })}
            />
          </Campo>
          <label className="flex items-center gap-3 self-center text-base font-medium text-slate-800">
            <input
              type="checkbox"
              checked={id.mostrarLogo}
              onChange={(e) => mudar({ mostrarLogo: e.target.checked })}
              className="size-5"
            />
            Mostrar o logotipo nos posts
          </label>
          <Campo
            label="Texto legal padrão"
            ajuda="Sai pequeno no rodapé de todos os posts. Em cada post dá para mudar ou apagar."
            className="sm:col-span-2"
          >
            <Textarea
              rows={2}
              maxLength={240}
              value={id.textoLegal ?? ""}
              placeholder="Ex.: CFC credenciado pelo Detran. Imagens ilustrativas. Valores sujeitos a alteração."
              onChange={(e) => mudar({ textoLegal: e.target.value || null })}
            />
          </Campo>
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
          <Botao type="button" icone={Check} onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar identidade visual"}
          </Botao>
          {msg.ok && <span className="text-sm font-medium text-green-700">{msg.ok}</span>}
          {msg.erro && <span className="text-sm font-medium text-red-700">{msg.erro}</span>}
        </div>
      </div>

      <aside className="h-fit space-y-3 xl:sticky xl:top-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Prévia</span>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
            {(Object.keys(FORMATOS_POST) as FormatoPost[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormato(f)}
                aria-pressed={formato === f}
                className={`rounded-md px-2 py-1 text-xs font-medium ${formato === f ? "bg-white shadow-sm" : "text-slate-600"}`}
              >
                {f === "feed" ? "1:1" : f === "retrato" ? "4:5" : "9:16"}
              </button>
            ))}
          </div>
        </div>
        <div className={`mx-auto ${formato === "story" ? "max-w-[14rem]" : ""}`}>
          <MiniaturaModelo
            modelo={previa}
            marca={{ ...marca, instagram: id.instagram }}
            identidade={id}
            formato={formato}
            className="border border-slate-200 shadow-sm"
          />
        </div>
        <Select value={previa} onChange={(e) => setPrevia(e.target.value)} aria-label="Modelo da prévia">
          {Object.entries(MODELOS_POST).map(([m, d]) => (
            <option key={m} value={m}>
              Prévia: {d.titulo}
            </option>
          ))}
        </Select>
      </aside>
    </div>
  );
}
