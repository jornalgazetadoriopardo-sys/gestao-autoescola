import Link from "next/link";
import { Building2, KeyRound, Settings, UserPlus, Users } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { FormAcao } from "@/components/form-acao";
import { Botao, Cabecalho, Campo, Cartao, Etiqueta, Input, Select, Tabela } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { obterConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { alternarUsuario, criarUsuario, trocarSenha } from "./actions";
import { ConfigForm } from "./config-form";

export const dynamic = "force-dynamic";

const abas = [
  { id: "dados", label: "Dados da autoescola", icone: Building2, soAdmin: true },
  { id: "usuarios", label: "Usuários", icone: Users, soAdmin: true },
  { id: "senha", label: "Minha senha", icone: KeyRound, soAdmin: false },
];

export default async function ConfiguracoesPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const sessao = await exigirSessao();
  const admin = sessao.papel === "admin";
  const visiveis = abas.filter((a) => admin || !a.soAdmin);
  const pedida = (await searchParams).aba;
  const aba = visiveis.find((a) => a.id === pedida)?.id ?? visiveis[0].id;

  return (
    <>
      <Cabecalho
        titulo="Configurações"
        descricao={admin ? "Dados da autoescola, usuários do sistema e senha." : "Troque a sua senha de acesso."}
        icone={Settings}
        cor="cinza"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {visiveis.map(({ id, label, icone: Icone }) => (
          <Link
            key={id}
            href={`/configuracoes?aba=${id}`}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium ${
              aba === id ? "bg-blue-600 text-white" : "bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            }`}
          >
            <Icone className="size-5" aria-hidden /> {label}
          </Link>
        ))}
      </div>

      {aba === "dados" && (
        <Cartao className="max-w-3xl">
          <ConfigForm config={await obterConfig()} />
        </Cartao>
      )}
      {aba === "usuarios" && <Usuarios usuarioAtual={sessao.usuarioId} />}
      {aba === "senha" && (
        <Cartao className="max-w-md">
          <FormAcao acao={trocarSenha} textoBotao="Trocar senha" limparAoSalvar>
            <Campo label="Senha atual">
              <Input name="atual" type="password" required autoComplete="current-password" />
            </Campo>
            <Campo label="Nova senha" ajuda="Pelo menos 8 caracteres.">
              <Input name="nova" type="password" required minLength={8} autoComplete="new-password" />
            </Campo>
            <Campo label="Repita a nova senha">
              <Input name="confirmacao" type="password" required autoComplete="new-password" />
            </Campo>
          </FormAcao>
        </Cartao>
      )}
    </>
  );
}

async function Usuarios({ usuarioAtual }: { usuarioAtual: number }) {
  const usuarios = await db.usuario.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] });
  return (
    <div className="grid gap-6 2xl:grid-cols-[1fr_24rem] [&>*]:min-w-0">
      <Tabela cabecalhos={["Nome", "E-mail", "Acesso", "Situação", ""]}>
        {usuarios.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3 font-medium">{u.nome}</td>
            <td className="px-4 py-3">{u.email}</td>
            <td className="px-4 py-3">{u.papel === "admin" ? "Administrador" : "Secretaria"}</td>
            <td className="px-4 py-3">
              {u.ativo ? <Etiqueta cor="verde">Ativo</Etiqueta> : <Etiqueta>Desativado</Etiqueta>}
            </td>
            <td className="px-4 py-3">
              {u.id === usuarioAtual ? (
                <span className="text-sm text-slate-500">(você)</span>
              ) : u.ativo ? (
                <BotaoConfirmar
                  acao={alternarUsuario.bind(null, u.id)}
                  mensagem={`Desativar ${u.nome}? Ele não conseguirá mais entrar.`}
                  icone="cancelar"
                >
                  Desativar
                </BotaoConfirmar>
              ) : (
                <form action={alternarUsuario.bind(null, u.id)}>
                  <Botao variante="secundario" tamanho="pequeno">
                    Reativar
                  </Botao>
                </form>
              )}
            </td>
          </tr>
        ))}
      </Tabela>

      <Cartao className="max-w-xl">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <UserPlus className="size-6 text-blue-600" aria-hidden /> Novo usuário
        </h2>
        <FormAcao acao={criarUsuario} textoBotao="Criar usuário" limparAoSalvar>
          <Campo label="Nome">
            <Input name="nome" required />
          </Campo>
          <Campo label="E-mail">
            <Input name="email" type="email" required />
          </Campo>
          <Campo label="Senha" ajuda="Pelo menos 8 caracteres. A pessoa pode trocar depois.">
            <Input name="senha" type="password" required minLength={8} autoComplete="new-password" />
          </Campo>
          <Campo label="Acesso">
            <Select name="papel" defaultValue="secretaria">
              <option value="secretaria">Secretaria (uso do dia a dia)</option>
              <option value="admin">Administrador (também altera configurações)</option>
            </Select>
          </Campo>
        </FormAcao>
      </Cartao>
    </div>
  );
}
