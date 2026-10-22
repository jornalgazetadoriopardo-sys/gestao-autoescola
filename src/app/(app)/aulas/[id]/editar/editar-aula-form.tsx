"use client";

import { useState } from "react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Input, Select, Textarea } from "@/components/ui";
import { DURACOES } from "@/lib/aulas";
import type { Expediente } from "@/lib/disponibilidade";
import { editarAula } from "../../actions";
import { SeletorHorario } from "../../seletor-horario";
import { useOcupados } from "../../use-ocupados";

type Opcao = { id: number; nome: string; categorias: string };

export type AulaEditavel = {
  id: number;
  alunoId: number;
  status: string;
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
  expediente,
}: {
  aula: AulaEditavel;
  categoria: string;
  instrutores: Opcao[];
  veiculos: Opcao[];
  voltar: string;
  expediente: Expediente;
}) {
  const [tipo, setTipo] = useState(aula.tipo);
  const [instrutorId, setInstrutorId] = useState(String(aula.instrutorId ?? ""));
  const [veiculoId, setVeiculoId] = useState(String(aula.veiculoId ?? ""));
  const [data, setData] = useState(aula.data);
  const [hora, setHora] = useState(aula.hora);
  const [duracao, setDuracao] = useState(String(aula.duracaoMin));
  // A própria aula não conta como ocupada.
  const { ocupados, carregando } = useOcupados([data], aula.id);
  const veiculosCompativeis = veiculos.filter((v) => categoria.includes(v.categorias));

  return (
    <FormAcao acao={editarAula.bind(null, aula.id)} textoBotao="Salvar alterações">
      <input type="hidden" name="voltar" value={voltar} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Tipo">
          <Select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="pratica">Prática</option>
            <option value="teorica">Teórica</option>
          </Select>
        </Campo>
        <Campo label="Duração">
          <Select name="duracaoMin" value={duracao} onChange={(e) => setDuracao(e.target.value)}>
            {DURACOES.map((d) => (
              <option key={d} value={d}>
                {d} minutos
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Instrutor">
          <Select
            name="instrutorId"
            required
            value={instrutorId}
            onChange={(e) => setInstrutorId(e.target.value)}
          >
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
            <Select
              name="veiculoId"
              required
              value={veiculoId}
              onChange={(e) => setVeiculoId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {veiculosCompativeis.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </Select>
          </Campo>
        )}
        <Campo label="Data">
          <Input name="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-base font-medium text-slate-800">Horário</span>
          <SeletorHorario
            name="hora"
            pedido={{
              data,
              duracaoMin: Number(duracao),
              tipo,
              instrutorId: Number(instrutorId) || null,
              veiculoId: tipo === "pratica" ? Number(veiculoId) || null : null,
              alunoId: aula.alunoId,
              permitirPassado: true,
            }}
            ocupados={ocupados}
            carregando={carregando}
            expediente={expediente}
            valor={hora}
            onChange={setHora}
          />
        </div>
        <Campo label="Observação" className="sm:col-span-2">
          <Textarea name="obs" rows={2} defaultValue={aula.obs} />
        </Campo>
      </div>
    </FormAcao>
  );
}
