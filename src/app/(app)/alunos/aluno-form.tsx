import type { Aluno } from "@prisma/client";
import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input, Select, Textarea } from "@/components/ui";
import { CATEGORIAS, STATUS_ALUNO, dataParaInput, formatarCpf, formatarTelefone } from "@/lib/format";
import { NIVEIS_GOVBR } from "@/lib/govbr-niveis";
import { salvarAluno } from "./actions";
import { FotoAluno } from "./foto-aluno";

export function AlunoForm({
  aluno,
  temSenhaGovbr = false,
}: {
  aluno?: Omit<Aluno, "govbrSenha">;
  temSenhaGovbr?: boolean;
}) {
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
          <Campo label="Outro telefone">
            <Input
              name="telefone2"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              defaultValue={formatarTelefone(aluno?.telefone2)}
            />
          </Campo>
          <Campo label="E-mail" className="sm:col-span-2">
            <Input name="email" type="email" defaultValue={aluno?.email ?? ""} />
          </Campo>
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[1fr_7rem]">
            <Campo label="Endereço (rua)">
              <Input name="endereco" defaultValue={aluno?.endereco ?? ""} />
            </Campo>
            <Campo label="Nº">
              <Input name="numero" defaultValue={aluno?.numero ?? ""} />
            </Campo>
          </div>
          <Campo label="Bairro">
            <Input name="bairro" defaultValue={aluno?.bairro ?? ""} />
          </Campo>
          <Campo label="Local de atividade (trabalho)">
            <Input name="localAtividade" defaultValue={aluno?.localAtividade ?? ""} />
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
        </div>

        <details
          className="rounded-xl border border-slate-200 p-4"
          open={Boolean(aluno?.rg || aluno?.renach || aluno?.mae)}
        >
          <summary className="cursor-pointer text-base font-semibold text-slate-800">
            Documentos e filiação (para a ficha do Detran)
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo label="Nome da mãe">
              <Input name="mae" defaultValue={aluno?.mae ?? ""} />
            </Campo>
            <Campo label="Nome do pai">
              <Input name="pai" defaultValue={aluno?.pai ?? ""} />
            </Campo>
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[1fr_8rem_5rem]">
              <Campo label="RG">
                <Input name="rg" defaultValue={aluno?.rg ?? ""} />
              </Campo>
              <Campo label="Órgão emissor">
                <Input name="rgOrgao" placeholder="SSP" defaultValue={aluno?.rgOrgao ?? ""} />
              </Campo>
              <Campo label="UF">
                <Input name="rgUf" maxLength={2} defaultValue={aluno?.rgUf ?? ""} />
              </Campo>
            </div>
            <Campo label="Data de expedição do RG">
              <Input name="rgExpedicao" type="date" defaultValue={dataParaInput(aluno?.rgExpedicao)} />
            </Campo>
            <Campo label="Naturalidade (cidade onde nasceu)">
              <Input name="naturalidade" defaultValue={aluno?.naturalidade ?? ""} />
            </Campo>
            <Campo label="RENACH" ajuda="Número do processo no Detran.">
              <Input name="renach" defaultValue={aluno?.renach ?? ""} />
            </Campo>
            <Campo label="Nº de registro da CNH" ajuda="Para quem já tem CNH (adição/mudança).">
              <Input name="registroCnh" defaultValue={aluno?.registroCnh ?? ""} />
            </Campo>
            <Campo label="Atualização biométrica (data)">
              <Input name="biometriaEm" type="date" defaultValue={dataParaInput(aluno?.biometriaEm)} />
            </Campo>
          </div>
        </details>

        <details className="rounded-xl border border-slate-200 p-4" open={Boolean(temSenhaGovbr || aluno?.govbrNivel)}>
          <summary className="cursor-pointer text-base font-semibold text-slate-800">
            Conta gov.br (só para consulta da autoescola)
          </summary>
          <p className="mt-2 text-sm text-slate-600">
            O login é o CPF do aluno. Estes dados não aparecem no contrato, na ficha nem nos relatórios. A senha fica
            guardada de forma criptografada e só aparece na tela do aluno ao clicar em &quot;Mostrar&quot;.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo
              label="Senha do gov.br"
              ajuda={temSenhaGovbr ? "Já cadastrada. Deixe em branco para manter a atual." : "Opcional."}
            >
              <Input name="govbrSenha" type="password" autoComplete="new-password" />
            </Campo>
            <Campo label="Nível da conta">
              <Select name="govbrNivel" defaultValue={aluno?.govbrNivel ?? ""}>
                <option value="">Não sei</option>
                {Object.entries(NIVEIS_GOVBR).map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </Select>
            </Campo>
            <Campo label="Observação" className="sm:col-span-2">
              <Input
                name="govbrObs"
                defaultValue={aluno?.govbrObs ?? ""}
                placeholder="Ex.: verificação em duas etapas no celular da mãe"
              />
            </Campo>
            {temSenhaGovbr && (
              <label className="flex items-center gap-3 text-base sm:col-span-2">
                <input type="checkbox" name="govbrApagar" className="size-5" />
                Apagar a senha cadastrada
              </label>
            )}
          </div>
        </details>

        <div className="grid gap-4">
          <Campo label="Observações">
            <Textarea name="obs" defaultValue={aluno?.obs ?? ""} />
          </Campo>
        </div>
      </FormAcao>
    </Cartao>
  );
}
