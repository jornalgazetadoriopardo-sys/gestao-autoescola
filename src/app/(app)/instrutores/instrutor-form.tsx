import type { Instrutor } from "@prisma/client";
import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input } from "@/components/ui";
import { formatarTelefone } from "@/lib/format";
import { salvarInstrutor } from "./actions";

export function InstrutorForm({ instrutor }: { instrutor?: Instrutor }) {
  const marcadas = instrutor?.categorias.split(",") ?? ["B"];
  return (
    <Cartao className="max-w-xl">
      <FormAcao acao={salvarInstrutor.bind(null, instrutor?.id ?? null)}>
        <Campo label="Nome *">
          <Input name="nome" required defaultValue={instrutor?.nome} />
        </Campo>
        <Campo label="Telefone">
          <Input name="telefone" inputMode="tel" defaultValue={formatarTelefone(instrutor?.telefone)} />
        </Campo>
        <fieldset>
          <legend className="mb-2 text-base font-medium text-slate-800">Categorias que ensina *</legend>
          <div className="flex flex-wrap gap-3">
            {["A", "B", "C", "D", "E"].map((c) => (
              <label
                key={c}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base font-semibold"
              >
                <input type="checkbox" name="categorias" value={c} defaultChecked={marcadas.includes(c)} />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-base">
          <input type="checkbox" name="ativo" defaultChecked={instrutor?.ativo ?? true} />
          Ativo
        </label>
      </FormAcao>
    </Cartao>
  );
}
