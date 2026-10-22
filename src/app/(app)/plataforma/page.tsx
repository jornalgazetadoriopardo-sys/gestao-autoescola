import { Building2, Download, Plus, ShieldCheck, Upload } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { FormAcao } from "@/components/form-acao";
import { Botao, Cabecalho, Campo, Cartao, Etiqueta, Input, Tabela } from "@/components/ui";
import { exigirSuperadmin } from "@/lib/auth";
import { dbGlobal } from "@/lib/db";
import { alternarAutoescola, criarAutoescola, importarArquivo } from "./actions";

export const dynamic = "force-dynamic";

// Painel do dono do sistema: todas as autoescolas que usam a plataforma.
export default async function PlataformaPage() {
  const sessao = await exigirSuperadmin();
  const autoescolas = await dbGlobal.autoescola.findMany({
    orderBy: { id: "asc" },
    include: {
      configuracao: { select: { cidade: true, uf: true } },
      _count: { select: { usuarios: true, alunos: true } },
    },
  });

  return (
    <>
      <Cabecalho
        titulo="Plataforma"
        descricao="Autoescolas que usam o sistema. Cada uma só vê os próprios dados."
        icone={ShieldCheck}
        cor="roxo"
      />

      <div className="grid gap-6 2xl:grid-cols-[1fr_26rem] [&>*]:min-w-0">
        <Tabela cabecalhos={["Nº", "Autoescola", "Cidade", "Usuários", "Alunos", "Desde", "Situação", ""]}>
          {autoescolas.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 text-slate-500">{a.id}</td>
              <td className="px-4 py-3 font-medium">{a.nome}</td>
              <td className="px-4 py-3">
                {[a.configuracao?.cidade, a.configuracao?.uf].filter(Boolean).join("/") || "—"}
              </td>
              <td className="px-4 py-3">{a._count.usuarios}</td>
              <td className="px-4 py-3">{a._count.alunos}</td>
              <td className="px-4 py-3">{a.criadoEm.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
              <td className="px-4 py-3">
                {a.ativo ? <Etiqueta cor="verde">Ativa</Etiqueta> : <Etiqueta cor="vermelho">Suspensa</Etiqueta>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <a
                    href={`/plataforma/exportar/${a.id}`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    title="Baixar todos os dados desta autoescola"
                  >
                    <Download className="size-4" aria-hidden /> Exportar
                  </a>
                  {a.id === sessao.autoescolaId ? (
                    <span className="text-sm text-slate-500">(a sua)</span>
                  ) : a.ativo ? (
                    <BotaoConfirmar
                      acao={alternarAutoescola.bind(null, a.id)}
                      mensagem={`Suspender ${a.nome}? Ninguém dessa autoescola conseguirá entrar até você reativar. Os dados continuam guardados.`}
                      icone="cancelar"
                    >
                      Suspender
                    </BotaoConfirmar>
                  ) : (
                    <form action={alternarAutoescola.bind(null, a.id)}>
                      <Botao variante="secundario" tamanho="pequeno">
                        Reativar
                      </Botao>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Tabela>

        <div className="space-y-6">
          <Cartao className="max-w-xl">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
              <Plus className="size-6 text-violet-600" aria-hidden /> Nova autoescola
            </h2>
            <p className="mb-4 text-base text-slate-600">
              O administrador entra com o e-mail e a senha abaixo e completa o resto em Configurações.
            </p>
            <FormAcao acao={criarAutoescola} textoBotao="Criar autoescola" limparAoSalvar>
              <Campo label="Nome da autoescola">
                <Input name="nome" required />
              </Campo>
              <div className="grid grid-cols-[1fr_5rem] gap-3">
                <Campo label="Cidade">
                  <Input name="cidade" />
                </Campo>
                <Campo label="UF">
                  <Input name="uf" maxLength={2} />
                </Campo>
              </div>
              <h3 className="flex items-center gap-2 pt-2 text-base font-semibold">
                <Building2 className="size-5 text-slate-500" aria-hidden /> Administrador da autoescola
              </h3>
              <Campo label="Nome">
                <Input name="adminNome" required />
              </Campo>
              <Campo label="E-mail">
                <Input name="email" type="email" required autoComplete="off" />
              </Campo>
              <Campo label="Senha" ajuda="Pelo menos 8 caracteres. A pessoa pode trocar depois.">
                <Input name="senha" type="password" required minLength={8} autoComplete="new-password" />
              </Campo>
            </FormAcao>
          </Cartao>

          <Cartao className="max-w-xl">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
              <Upload className="size-6 text-violet-600" aria-hidden /> Importar autoescola
            </h2>
            <p className="mb-4 text-base text-slate-600">
              Para trazer uma autoescola de outro servidor: lá, clique em <strong>Exportar</strong> e envie aqui o
              arquivo baixado. Ela é criada com alunos, aulas, pagamentos, veículos, instrutores, configurações e
              usuários (com as mesmas senhas).
            </p>
            <FormAcao acao={importarArquivo} textoBotao="Importar" limparAoSalvar>
              <Campo label="Arquivo exportado (.json)">
                <Input name="arquivo" type="file" accept=".json,application/json" required />
              </Campo>
            </FormAcao>
          </Cartao>
        </div>
      </div>
    </>
  );
}
