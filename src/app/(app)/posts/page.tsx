import { ImagePlus, Megaphone, Palette } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { BotaoLink, Cabecalho, Cartao, Secao, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { formatarDataLocal } from "@/lib/format";
import { FORMATOS_POST, MODELOS_POST } from "@/lib/posts";
import { AcoesPostSalvo } from "./acoes-post-salvo";
import { excluirPost } from "./actions";
import { marcaDaAutoescola } from "./marca";
import { GaleriaModelos } from "./galeria-modelos";
import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Redes sociais: escolha um modelo, preencha e o sistema monta a imagem e a legenda.
export default async function PostsPage() {
  const admin = (await exigirSessao()).papel === "admin";
  const [marca, posts] = await Promise.all([
    marcaDaAutoescola(),
    db.postSocial.findMany({ orderBy: { criadoEm: "desc" }, take: 60 }),
  ]);

  return (
    <>
      <Cabecalho
        titulo="Redes sociais"
        descricao="Escolha um modelo, preencha as informações e o sistema monta a imagem e a legenda do post."
        icone={Megaphone}
        cor="roxo"
      />

      <Secao
        titulo="Criar um post"
        icone={ImagePlus}
        acoes={
          admin && (
            <BotaoLink href="/configuracoes?aba=aparencia" variante="secundario" tamanho="pequeno" icone={Palette}>
              Identidade visual
            </BotaoLink>
          )
        }
      />
      <GaleriaModelos marca={marca} />

      <Secao titulo="Posts salvos" icone={Megaphone} />
      {posts.length === 0 ? (
        <Vazio
          icone={Megaphone}
          titulo="Nenhum post salvo ainda"
          texto="Depois de criar um post, clique em “Salvar no sistema” para guardar a imagem e a legenda aqui."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {posts.map((p) => {
            const nome = `post-${p.id}.jpg`;
            return (
              <Cartao key={p.id} className="flex flex-col gap-4">
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/posts/${p.id}/imagem`}
                    alt={p.titulo}
                    loading="lazy"
                    className={`w-32 shrink-0 rounded-xl border border-slate-200 object-cover ${p.formato === "story" ? "aspect-[9/16]" : "aspect-square"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{p.titulo}</div>
                    <div className="text-sm text-slate-500">
                      {formatarDataLocal(p.criadoEm)} ·{" "}
                      {FORMATOS_POST[p.formato as keyof typeof FORMATOS_POST]?.titulo ?? p.formato} ·{" "}
                      {MODELOS_POST[p.modelo]?.titulo ?? p.modelo}
                    </div>
                    <p className="mt-2 line-clamp-4 text-sm whitespace-pre-line text-slate-700">{p.legenda}</p>
                  </div>
                </div>
                <AcoesPostSalvo id={p.id} legenda={p.legenda} nome={nome} />
                <div className="flex justify-end">
                  <BotaoConfirmar
                    acao={excluirPost.bind(null, p.id)}
                    mensagem="Excluir este post salvo?"
                    icone="excluir"
                  >
                    Excluir
                  </BotaoConfirmar>
                </div>
              </Cartao>
            );
          })}
        </div>
      )}
    </>
  );
}
