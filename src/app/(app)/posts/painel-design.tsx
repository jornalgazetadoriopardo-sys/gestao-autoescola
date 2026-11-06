"use client";

import { RotateCcw } from "lucide-react";
import { CorPicker } from "@/components/cor-picker";
import { Botao, Select, Textarea } from "@/components/ui";
import { COMBINACOES, derivarCores, type CoresPost } from "@/lib/cores";
import { FONTES } from "@/lib/fontes";
import type { Identidade } from "@/lib/identidade";
import type { Estilo } from "./desenhar";

// Amostra de uma combinação: as três cores principais.
export function Amostra({ cores }: { cores: CoresPost }) {
  return (
    <span className="flex h-7 w-14 overflow-hidden rounded-lg ring-1 ring-black/10" aria-hidden>
      <span className="flex-1" style={{ background: cores.escuro }} />
      <span className="flex-1" style={{ background: cores.principal }} />
      <span className="flex-1" style={{ background: cores.destaque }} />
    </span>
  );
}

const iguais = (a: CoresPost, b: CoresPost) =>
  a.principal === b.principal && a.destaque === b.destaque && a.escuro === b.escuro && a.claro === b.claro;

// Escolha de combinação de cores (prontas + da autoescola) e as quatro cores à mão.
export function EscolhaCores({
  cores,
  aoMudar,
  daAutoescola,
}: {
  cores: CoresPost;
  aoMudar: (c: CoresPost) => void;
  daAutoescola?: CoresPost;
}) {
  const opcoes = [
    ...(daAutoescola ? [{ id: "autoescola", nome: "Da autoescola", cores: daAutoescola }] : []),
    ...COMBINACOES,
  ];
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Combinações de cores" className="flex flex-wrap gap-2">
        {opcoes.map((o) => {
          const marcada = iguais(o.cores, cores);
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={marcada}
              title={o.nome}
              onClick={() => aoMudar(o.cores)}
              className={`flex items-center gap-2 rounded-xl border-2 px-2 py-1.5 text-xs font-medium transition ${
                marcada ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <Amostra cores={o.cores} />
              <span className="hidden sm:inline">{o.nome}</span>
            </button>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <CorPicker
          rotulo="Cor principal"
          ajuda="Ao mudar, as outras se ajustam sozinhas."
          valor={cores.principal}
          aoMudar={(c) => aoMudar(derivarCores(c))}
        />
        <CorPicker
          rotulo="Destaque"
          ajuda="Preços, números e detalhes."
          valor={cores.destaque}
          aoMudar={(c) => aoMudar({ ...cores, destaque: c })}
        />
        <CorPicker rotulo="Fundo escuro" valor={cores.escuro} aoMudar={(c) => aoMudar({ ...cores, escuro: c })} />
        <CorPicker rotulo="Fundo claro" valor={cores.claro} aoMudar={(c) => aoMudar({ ...cores, claro: c })} />
      </div>
    </div>
  );
}

export function EscolhaFonte({
  rotulo,
  valor,
  aoMudar,
  titulo,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (id: string) => void;
  titulo: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-800">{rotulo}</span>
      <Select value={valor} onChange={(e) => aoMudar(e.target.value)} style={{ fontFamily: FONTES[valor]?.familia }}>
        {Object.entries(FONTES)
          .filter(([, f]) => titulo || !f.soTitulo)
          .map(([id, f]) => (
            <option key={id} value={id} style={{ fontFamily: f.familia }}>
              {f.nome} — {f.estilo}
            </option>
          ))}
      </Select>
    </label>
  );
}

// Painel "Personalizar este post": muda só este post (o padrão fica em
// Configurações > Aparência).
export function PainelDesign({
  estilo,
  aoMudar,
  identidade,
  temFoto,
  escurecerPadrao,
}: {
  estilo: Estilo;
  aoMudar: (e: Estilo) => void;
  identidade: Identidade;
  temFoto: boolean;
  escurecerPadrao: number;
}) {
  const escurecer = estilo.escurecer ?? escurecerPadrao;
  const mudar = (parte: Partial<Estilo>) => aoMudar({ ...estilo, ...parte });
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Cores</h3>
        <EscolhaCores cores={estilo.cores} aoMudar={(cores) => mudar({ cores })} daAutoescola={identidade.cores} />
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Fontes</h3>
        <EscolhaFonte
          rotulo="Títulos"
          valor={estilo.fonteTitulo}
          aoMudar={(fonteTitulo) => mudar({ fonteTitulo })}
          titulo
        />
        <EscolhaFonte
          rotulo="Textos"
          valor={estilo.fonteTexto}
          aoMudar={(fonteTexto) => mudar({ fonteTexto })}
          titulo={false}
        />
      </section>

      {temFoto && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Foto</h3>
          <label className="block">
            <span className="mb-1 flex justify-between text-sm font-medium text-slate-800">
              Escurecer a foto <span className="text-slate-500">{Math.round(escurecer * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={Math.round(escurecer * 100)}
              onChange={(e) => mudar({ escurecer: Number(e.target.value) / 100 })}
              className="w-full accent-blue-600"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Mais escuro deixa o texto mais fácil de ler; mais claro mostra mais a foto.
            </span>
          </label>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Marca e texto legal</h3>
        <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            checked={estilo.mostrarLogo}
            onChange={(e) => mudar({ mostrarLogo: e.target.checked })}
            className="size-5"
          />
          Mostrar o logotipo
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-800">Texto legal (aparece pequeno no rodapé)</span>
          <Textarea
            rows={2}
            maxLength={240}
            value={estilo.textoLegal ?? ""}
            placeholder="Ex.: Imagens ilustrativas. Valores sujeitos a alteração. CFC credenciado pelo Detran."
            onChange={(e) => mudar({ textoLegal: e.target.value || null })}
          />
        </label>
      </section>

      <Botao
        type="button"
        variante="secundario"
        tamanho="pequeno"
        icone={RotateCcw}
        onClick={() =>
          aoMudar({
            cores: identidade.cores,
            fonteTitulo: identidade.fonteTitulo,
            fonteTexto: identidade.fonteTexto,
            escurecer: null,
            mostrarLogo: identidade.mostrarLogo,
            textoLegal: identidade.textoLegal,
          })
        }
      >
        Voltar ao padrão da autoescola
      </Botao>
    </div>
  );
}
