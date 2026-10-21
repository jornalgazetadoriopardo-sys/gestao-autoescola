import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input } from "@/components/ui";
import { entrar } from "./actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Cartao className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Gestão Autoescola</h1>
        <p className="mb-6 text-sm text-slate-500">Entre com seu e-mail e senha.</p>
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
