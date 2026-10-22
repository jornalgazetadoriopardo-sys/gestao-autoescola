"use client";

import { useState } from "react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Input, Select, Textarea } from "@/components/ui";
import { DURACOES } from "@/lib/aulas";
import { editarAula } from "../../actions";

type Opcao = { id: number; nome: string; categorias: string };

export type AulaEditavel = {
  id: number;
  tipo: string;
  instrutorId: number | null;
  veiculoId: number | null;
  data: string;
  hora: string;
  duracaoMin: number;
  obs: string;
};

export function EditarAulaForm({
  aula,
  categoria,
  instrutores,
  veiculos,
  voltar,
}: {
  aula: AulaEditavel;
  categoria: string;
  instrutores: Opcao[];
  veiculos: Opcao[];
  voltar: string;
}) {
  const [tipo, setTipo] = useState(aula.tipo);
  const veiculosCompativeis = veiculos.filter((v) => categoria.includes(v.categorias));

  return (
    <FormAcao acao={editarAula.bind(null, aula.id)} textoBotao="Salvar alterações">
      <input type="hidden" name="voltar" value={voltar} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Data">
          <Input name="data" type="date" required defaultValue={aula.data} />
        </Campo>
        <Campo label="Horário">
          <Input name="hora" type="time" step={300} required defaultValue={aula.hora} />
        </Campo>
        <Campo label="Tipo">
          <Select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="pratica">Prática</option>
            <option value="teorica">Teórica</option>
          </Select>
        </Campo>
        <Campo label="Duração">
          <Select name="duracaoMin" defaultValue={String(aula.duracaoMin)}>
            {DURACOES.map((d) => (
              <option key={d} value={d}>
                {d} minutos
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Instrutor">
          <Select name="instrutorId" required defaultValue={aula.instrutorId ?? ""}>
            <option value="">Selecione...</option>
            {instrutores.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome} ({i.categorias.replaceAll(",", ", ")})
              </option>
            ))}
          </Select>
        </Campo>
        {tipo === "pratica" && (
          <Campo label="Veículo">
            <Select name="veiculoId" required defaultValue={aula.veiculoId ?? ""}>
              <option value="">Selecione...</option>
              {veiculosCompativeis.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </Select>
          </Campo>
        )}
        <Campo label="Observação" className="sm:col-span-2">
          <Textarea name="obs" rows={2} defaultValue={aula.obs} />
        </Campo>
      </div>
    </FormAcao>
  );
}
