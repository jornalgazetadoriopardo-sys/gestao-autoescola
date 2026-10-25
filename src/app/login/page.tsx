import { Car } from "lucide-react";
import { FormAcao } from "@/components/form-acao";
import { Aviso, Campo, Cartao, Input } from "@/components/ui";
import { entrar } from "./actions";

const MOTIVOS: Record<string, string> = {
  suspensa: "O acesso desta autoescola está suspenso. Fale com o responsável pelo sistema.",
  desativado: "Seu usuário foi desativado. Fale com o administrador da autoescola.",
};

// A tela de login é a mesma para todas as autoescolas: cada uma só aparece
// depois que o usuário entra.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const { motivo } = await searchParams;
  const aviso = motivo ? MOTIVOS[motivo] : undefined;
  return (
    <main className="sem-tema flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-700 to-slate-900 p-4">
      <Cartao className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex size-20 items-center justify-center rounded-full bg-blue-100">
            <Car className="size-10 text-blue-700" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold">Gestão de Autoescola</h1>
          <p className="mt-1 text-base text-slate-600">Entre com seu e-mail e senha.</p>
        </div>
        {aviso && <Aviso tipo="erro">{aviso}</Aviso>}
        <FormAcao acao={entrar} textoBotao="Entrar">
          <Campo label="E-mail">
            <Input name="email" type="email" required autoFocus autoComplete="username" />
          </Campo>
          <Campo label="Senha">
            <Input name="senha" type="password" required autoComplete="current-password" />
          </Campo>
        </FormAcao>
      </Cartao>
    </main>
  );
}
