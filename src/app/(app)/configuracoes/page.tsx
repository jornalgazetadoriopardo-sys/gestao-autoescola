import Link from "next/link";
import {
  Building2,
  ClipboardCheck,
  Download,
  FileSignature,
  KeyRound,
  Pencil,
  Printer,
  Settings,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { FormAcao } from "@/components/form-acao";
import {
  Botao,
  BotaoDownload,
  BotaoLink,
  Cabecalho,
  Campo,
  Cartao,
  Etiqueta,
  Input,
  Select,
  Tabela,
} from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { obterConfigCompleta } from "@/lib/config";
import { db } from "@/lib/db";
import { CAMPOS_CONTRATO, CAMPOS_PARCELA } from "@/lib/contrato";
import { formatarDataLocal } from "@/lib/format";
import { TAXAS_CONFIGURAVEIS, lerTaxasPadrao } from "@/lib/etapas";
import { moedaParaInput } from "@/lib/format";
import { salvarTaxas } from "./actions";
import { alternarUsuario, criarUsuario, excluirUsuario, removerContrato, salvarContrato, trocarSenha } from "./actions";
import { ConfigForm } from "./config-form";
import { CopiarMarcacao } from "./copiar-marcacao";
import { ImpressoraForm } from "./impressora-form";

export const dynamic = "force-dynamic";

const abas = [
  { id: "dados", label: "Dados da autoescola", icone: Building2, soAdmin: true },
  { id: "usuarios", label: "Usuários", icone: Users, soAdmin: true },
  { id: "taxas", label: "Taxas e exames", icone: ClipboardCheck, soAdmin: true },
  { id: "impressora", label: "Impressora", icone: Printer, soAdmin: true },
  { id: "contrato", label: "Contrato", icone: FileSignature, soAdmin: true },
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
        descricao={
          admin ? "Dados da autoescola, usuários, impressora, contrato e senha." : "Troque a sua senha de acesso."
        }
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
          <ConfigForm config={await obterConfigCompleta()} />
        </Cartao>
      )}
      {aba === "usuarios" && <Usuarios usuarioAtual={sessao.usuarioId} />}
      {aba === "taxas" && <Taxas />}
      {aba === "impressora" && <Impressora />}
      {aba === "contrato" && <Contrato />}
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
              <div className="flex items-center gap-2">
                <BotaoLink
                  href={`/configuracoes/usuarios/${u.id}`}
                  variante="secundario"
                  tamanho="pequeno"
                  icone={Pencil}
                >
                  Alterar
                </BotaoLink>
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
                {u.id !== usuarioAtual && !u.superadmin && (
                  <BotaoConfirmar
                    acao={excluirUsuario.bind(null, u.id)}
                    mensagem={`Excluir o usuário ${u.nome}? Ele não poderá mais entrar.`}
                    icone="excluir"
                  >
                    Excluir
                  </BotaoConfirmar>
                )}
              </div>
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

async function Impressora() {
  const config = await obterConfigCompleta();
  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,48rem)_1fr] [&>*]:min-w-0">
      <Cartao>
        <ImpressoraForm atual={config.impressoraRecibo} />
      </Cartao>
      <Cartao className="h-fit">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Printer className="size-6 text-blue-600" aria-hidden /> Como preparar a térmica (Elgin i9)
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-base text-slate-700">
          <li>
            Instale o driver da Elgin i9 no computador (site da Elgin, em Suporte &gt; Downloads) e ligue a impressora
            no USB.
          </li>
          <li>Coloque a bobina de 80 mm.</li>
          <li>
            Abra um recibo e clique em <b>Imprimir</b>. Na janela do navegador, escolha a impressora <b>ELGIN i9</b>.
          </li>
          <li>
            Em <b>Mais configurações</b>: Margens <b>Nenhuma</b>, Escala <b>100%</b> e desmarque{" "}
            <b>Cabeçalhos e rodapés</b>. O navegador lembra dessas opções da próxima vez.
          </li>
        </ol>
        <BotaoLink
          href="/imprimir/teste-termica"
          target="_blank"
          variante="secundario"
          icone={Printer}
          className="mt-4"
        >
          Imprimir cupom de teste
        </BotaoLink>
      </Cartao>
    </div>
  );
}

async function Contrato() {
  const config = await obterConfigCompleta();
  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,40rem)_1fr] [&>*]:min-w-0">
      <div className="space-y-6">
        <Cartao>
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <FileSignature className="size-6 text-blue-600" aria-hidden /> Modelo de contrato
          </h2>
          <p className="mb-4 text-base text-slate-600">
            Envie o contrato da autoescola em Word (.docx). Onde deve entrar um dado do aluno, escreva a marcação
            correspondente (veja a lista ao lado), por exemplo <b>{"{{aluno_nome}}"}</b>. Na ficha de cada aluno aparece
            o botão <b>Contrato</b>, que baixa o arquivo já preenchido.
          </p>
          {config.contratoNome ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-green-50 p-4">
              <FileSignature className="size-7 text-green-700" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{config.contratoNome}</div>
                <div className="text-sm text-slate-600">Enviado em {formatarDataLocal(config.contratoEm)}</div>
              </div>
              <BotaoDownload href="/contrato/modelo" tamanho="pequeno" icone={Download}>
                Baixar
              </BotaoDownload>
              <BotaoConfirmar acao={removerContrato} mensagem="Remover o modelo de contrato?" icone="excluir">
                Remover
              </BotaoConfirmar>
            </div>
          ) : (
            <p className="mb-4 rounded-xl bg-amber-50 p-4 text-base text-amber-900">Nenhum contrato enviado ainda.</p>
          )}
          <FormAcao
            acao={salvarContrato}
            textoBotao={config.contratoNome ? "Trocar contrato" : "Enviar contrato"}
            limparAoSalvar
          >
            <Campo label="Arquivo do contrato (.docx)">
              <Input
                name="arquivo"
                type="file"
                required
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
            </Campo>
          </FormAcao>
        </Cartao>
        <Cartao>
          <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">
            <Upload className="size-5 text-slate-500" aria-hidden /> Não tem o contrato pronto?
          </h3>
          <p className="mb-3 text-base text-slate-600">
            Baixe um exemplo com as marcações já colocadas, ajuste o texto no Word e envie aqui. O texto é só um ponto
            de partida: confira com o seu contador ou advogado.
          </p>
          <BotaoDownload href="/modelo-contrato.docx" download icone={Download}>
            Baixar exemplo de contrato
          </BotaoDownload>
        </Cartao>
      </div>

      <Cartao className="h-fit">
        <h2 className="mb-1 text-lg font-semibold">Marcações que o sistema preenche</h2>
        <p className="mb-4 text-sm text-slate-600">Clique para copiar e cole no lugar certo do contrato, no Word.</p>
        <div className="space-y-5">
          {CAMPOS_CONTRATO.map((g) => (
            <div key={g.grupo}>
              <div className="mb-2 text-sm font-semibold uppercase text-slate-500">{g.grupo}</div>
              <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[auto_1fr]">
                {g.campos.map(([chave, descricao]) => (
                  <div key={chave} className="contents">
                    <dt>
                      <CopiarMarcacao texto={`{{${chave}}}`} />
                    </dt>
                    <dd className="self-center text-sm text-slate-700">{descricao}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          <div>
            <div className="mb-2 text-sm font-semibold uppercase text-slate-500">Lista de parcelas</div>
            <p className="mb-2 text-sm text-slate-700">
              Para listar todas as parcelas, coloque numa linha de tabela (ou num parágrafo):{" "}
              <CopiarMarcacao texto="{{#parcelas}}" /> {CAMPOS_PARCELA.map(([c]) => `{{${c}}}`).join(" ")}{" "}
              <CopiarMarcacao texto="{{/parcelas}}" />
            </p>
            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[auto_1fr]">
              {CAMPOS_PARCELA.map(([chave, descricao]) => (
                <div key={chave} className="contents">
                  <dt>
                    <CopiarMarcacao texto={`{{${chave}}}`} />
                  </dt>
                  <dd className="self-center text-sm text-slate-700">{descricao}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Cartao>
    </div>
  );
}

async function Taxas() {
  const config = await obterConfigCompleta();
  const taxas = lerTaxasPadrao(config.taxasPadrao);
  return (
    <Cartao className="max-w-4xl">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
        <ClipboardCheck className="size-6 text-purple-600" aria-hidden /> Valores de exames e taxas
      </h2>
      <p className="mb-5 text-base text-slate-600">
        Valores que entram sozinhos na lista do aluno ao fazer a matrícula. Em cada aluno dá para mudar depois. Deixe em
        branco o que não souber.
      </p>
      <FormAcao acao={salvarTaxas} textoBotao="Salvar valores">
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {TAXAS_CONFIGURAVEIS.map(([tipo, titulo]) => (
            <div key={tipo} className="grid items-center gap-3 p-3 sm:grid-cols-[1fr_9rem_15rem]">
              <span className="text-base font-medium">{titulo}</span>
              <Input
                name={`valor_${tipo}`}
                inputMode="decimal"
                placeholder="R$ 0,00"
                aria-label={`Valor de ${titulo}`}
                defaultValue={moedaParaInput(taxas[tipo]?.valor)}
              />
              <Select name={`cobranca_${tipo}`} defaultValue={taxas[tipo]?.cobranca ?? "aluno"} aria-label="Quem paga">
                <option value="aluno">Aluno paga direto</option>
                <option value="autoescola">Autoescola cobra do aluno</option>
              </Select>
            </div>
          ))}
        </div>
      </FormAcao>
    </Cartao>
  );
}
