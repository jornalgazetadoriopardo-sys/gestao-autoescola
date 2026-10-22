import { MenuLateral } from "@/components/menu-lateral";
import { exigirSessao } from "@/lib/auth";
import { obterConfig } from "@/lib/config";
import { sair } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();
  const config = await obterConfig();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MenuLateral nome={sessao.nome} autoescola={config.nome} logo={config.logo} superadmin={sessao.superadmin} sair={sair} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}
