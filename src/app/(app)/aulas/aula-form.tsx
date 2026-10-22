"use client";

import { useState } from "react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input, Select, Textarea } from "@/components/ui";
import { DURACOES } from "@/lib/aulas";
import type { Expediente } from "@/lib/disponibilidade";
import { agendarAula } from "./actions";
import { SeletorHorario } from "./seletor-horario";
import { useOcupados } from "./use-ocupados";

export type OpcaoMatricula = {
  id: number;
  alunoId: number;
  rotulo: string;
  categoria: string;
  restantes: { pratica: number; teorica: number };
};

type Opcao = { id: number; nome: string; categorias: string };

export function AulaForm({
  matriculas,
  instrutores,
  veiculos,
  matriculaInicial,
  dia,
  expediente,
}: {
  matriculas: OpcaoMatricula[];
  instrutores: Opcao[];
  veiculos: Opcao[];
  matriculaInicial?: number;
  dia: string;
  expediente: Expediente;
}) {
  const [matriculaId, setMatriculaId] = useState(String(matriculaInicial ?? ""));
  const matricula = matriculas.find((m) => String(m.id) === matriculaId);
  const [tipo, setTipo] = useState(matricula && matricula.restantes.pratica === 0 ? "teorica" : "pratica");
  const [instrutorId, setInstrutorId] = useState("");
  const [veiculoId, setVeiculoId] = useState("");
  const [data, setData] = useState(dia);
  const [hora, setHora] = useState("");
  const [duracao, setDuracao] = useState("50");
  const { ocupados, carregando } = useOcupados([data]);

  // Mostra só veículos compatíveis com a categoria da matrícula.
  const veiculosCompativeis = matricula
    ? veiculos.filter((v) => matricula.categoria.includes(v.categorias))
    : veiculos;

  return (
    <Cartao className="max-w-4xl">
      <FormAcao acao={agendarAula} textoBotao="Agendar aula">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo label="Aluno / matrícula *" className="sm:col-span-2">
            <Select
              name="matriculaId"
              required
              value={matriculaId}
              onChange={(e) => setMatriculaId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {matriculas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.rotulo}
                </option>
              ))}
            </Select>
            {matricula && (
              <span className="mt-1.5 block text-sm font-medium text-blue-800">
                Restam {matricula.restantes.pratica} aulas práticas e {matricula.restantes.teorica} teóricas
                para agendar.
              </span>
            )}
          </Campo>
          <Campo label="Tipo *">
            <Select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="pratica">Prática</option>
              <option value="teorica">Teórica</option>
            </Select>
          </Campo>
          <Campo label="Instrutor *">
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
            <Campo label="Veículo *">
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
          <Campo label="Duração">
            <Select name="duracaoMin" value={duracao} onChange={(e) => setDuracao(e.target.value)}>
              {DURACOES.map((d) => (
                <option key={d} value={d}>
                  {d} minutos
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Data *">
            <Input name="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-base font-medium text-slate-800">Horário *</span>
            <SeletorHorario
              name="hora"
              pedido={{
                data,
                duracaoMin: Number(duracao),
                tipo,
                instrutorId: Number(instrutorId) || null,
                veiculoId: tipo === "pratica" ? Number(veiculoId) || null : null,
                alunoId: matricula?.alunoId ?? null,
              }}
              ocupados={ocupados}
              carregando={carregando}
              expediente={expediente}
              valor={hora}
              onChange={setHora}
            />
          </div>
          <Campo label="Observações" className="sm:col-span-2">
            <Textarea name="obs" rows={2} />
          </Campo>
        </div>
      </FormAcao>
    </Cartao>
  );
}
