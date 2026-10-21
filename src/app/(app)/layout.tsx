import { MenuLateral } from "@/components/menu-lateral";
import { exigirSessao } from "@/lib/auth";
import { sair } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MenuLateral nome={sessao.nome} sair={sair} />
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
