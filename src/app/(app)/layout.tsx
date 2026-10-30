import { CascaApp } from "@/components/casca-app";
import { exigirSessao } from "@/lib/auth";
import { obterConfig } from "@/lib/config";
import { sair } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();
  const config = await obterConfig();
  return (
    <CascaApp
      nome={sessao.nome}
      autoescola={config.nome}
      logo={config.logo}
      admin={sessao.papel === "admin"}
      superadmin={sessao.superadmin}
      sair={sair}
    >
      {children}
    </CascaApp>
  );
}
