import { IdCard } from "lucide-react";
import { Campo, Input } from "@/components/ui";

// Dados da CNH atual, para quem já é habilitado (adição, mudança de categoria,
// reabilitação e reciclagem). Ficam gravados no cadastro do aluno.
export function CamposCnh({ inicial }: { inicial: { registro: string; emissao: string; validade: string } }) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <legend className="flex items-center gap-2 px-1 text-base font-semibold text-slate-800">
        <IdCard className="size-5 text-blue-600" aria-hidden /> CNH atual do aluno
      </legend>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Nº de registro">
          <Input name="cnhRegistro" inputMode="numeric" maxLength={20} defaultValue={inicial.registro} />
        </Campo>
        <Campo label="Data de emissão">
          <Input name="cnhEmissao" type="date" defaultValue={inicial.emissao} />
        </Campo>
        <Campo label="Data de validade">
          <Input name="cnhValidade" type="date" defaultValue={inicial.validade} />
        </Campo>
      </div>
      <p className="mt-2 text-sm text-slate-600">Ficam no cadastro do aluno e saem na ficha e no contrato.</p>
    </fieldset>
  );
}
