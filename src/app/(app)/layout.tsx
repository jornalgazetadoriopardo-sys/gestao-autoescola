import { CascaApp } from "@/components/casca-app";
import { FaixaCobranca, TelaBloqueio } from "@/components/cobranca/faixa-cobranca";
import { exigirSessao } from "@/lib/auth";
import { obterConfig } from "@/lib/config";
import { lerPlataforma, situacaoDaCobranca } from "@/lib/mensalidades";
import { sair } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();
  const [config, cobranca, plataforma] = await Promise.all([
    obterConfig(),
    situacaoDaCobranca(sessao.autoescolaId),
    lerPlataforma(),
  ]);
  // Mensalidade em atraso depois do prazo: no lugar da tela, o aviso com o Pix.
  // O dono do sistema nunca é bloqueado (precisa da Plataforma).
  const bloqueada = cobranca.tipo === "bloqueada" && !sessao.superadmin;
  return (
    <CascaApp
      nome={sessao.nome}
      autoescola={config.nome}
      logo={config.logo}
      admin={sessao.papel === "admin"}
      superadmin={sessao.superadmin}
      sair={sair}
    >
      {bloqueada && cobranca.tipo === "bloqueada" ? (
        <TelaBloqueio s={cobranca} p={plataforma} />
      ) : (
        <>
          <FaixaCobranca s={cobranca} p={plataforma} />
          {children}
        </>
      )}
    </CascaApp>
  );
}
