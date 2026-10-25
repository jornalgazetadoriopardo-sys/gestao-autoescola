import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { BotaoLink, Cabecalho, Campo, Cartao, Input, Select } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { editarUsuario } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirAdmin();
  const usuario = await db.usuario.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!usuario) notFound();
  const voce = usuario.id === sessao.usuarioId;

  return (
    <>
      <Cabecalho
        titulo="Alterar usuário"
        descricao={usuario.nome}
        icone={Pencil}
        cor="cinza"
        acoes={
          <BotaoLink href="/configuracoes?aba=usuarios" variante="secundario" icone={ArrowLeft}>
            Voltar
          </BotaoLink>
        }
      />
      <Cartao className="max-w-xl">
        <FormAcao acao={editarUsuario.bind(null, usuario.id)} textoBotao="Salvar alterações">
          <Campo label="Nome">
            <Input name="nome" required defaultValue={usuario.nome} />
          </Campo>
          <Campo label="E-mail (usado para entrar)">
            <Input name="email" type="email" required defaultValue={usuario.email} />
          </Campo>
          <Campo label="Acesso" ajuda={voce ? "Você não pode tirar o seu próprio acesso de administrador." : undefined}>
            <Select name="papel" defaultValue={usuario.papel} disabled={voce}>
              <option value="secretaria">Secretaria (uso do dia a dia)</option>
              <option value="admin">Administrador (também altera configurações)</option>
            </Select>
          </Campo>
          <Campo
            label="Nova senha (opcional)"
            ajuda="Deixe em branco para manter a senha atual. Mínimo de 8 caracteres."
          >
            <Input name="senha" type="password" minLength={8} autoComplete="new-password" />
          </Campo>
        </FormAcao>
      </Cartao>
    </>
  );
}
