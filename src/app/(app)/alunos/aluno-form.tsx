import type { Aluno } from "@prisma/client";
import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input, Select, Textarea } from "@/components/ui";
import { CATEGORIAS, STATUS_ALUNO, dataParaInput, formatarCpf, formatarTelefone } from "@/lib/format";
import { salvarAluno } from "./actions";
import { FotoAluno } from "./foto-aluno";

export function AlunoForm({ aluno }: { aluno?: Aluno }) {
  return (
    <Cartao className="max-w-3xl">
      <FormAcao acao={salvarAluno.bind(null, aluno?.id ?? null)}>
        <FotoAluno inicial={aluno?.foto ?? null} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome completo *" className="sm:col-span-2">
            <Input name="nome" required defaultValue={aluno?.nome} />
          </Campo>
          <Campo label="CPF *">
            <Input
              name="cpf"
              required
              inputMode="numeric"
              placeholder="000.000.000-00"
              defaultValue={aluno ? formatarCpf(aluno.cpf) : ""}
            />
          </Campo>
          <Campo label="Data de nascimento">
            <Input name="nascimento" type="date" defaultValue={dataParaInput(aluno?.nascimento)} />
          </Campo>
          <Campo label="Telefone / WhatsApp">
            <Input
              name="telefone"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              defaultValue={formatarTelefone(aluno?.telefone)}
            />
          </Campo>
          <Campo label="E-mail">
            <Input name="email" type="email" defaultValue={aluno?.email ?? ""} />
          </Campo>
          <Campo label="Endereço" className="sm:col-span-2">
            <Input name="endereco" defaultValue={aluno?.endereco ?? ""} />
          </Campo>
          <Campo label="Categoria *">
            <Select name="categoria" required defaultValue={aluno?.categoria ?? "B"}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Status">
            <Select name="status" defaultValue={aluno?.status ?? "ativo"}>
              {Object.entries(STATUS_ALUNO).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Observações" className="sm:col-span-2">
            <Textarea name="obs" defaultValue={aluno?.obs ?? ""} />
          </Campo>
        </div>
      </FormAcao>
    </Cartao>
  );
}
