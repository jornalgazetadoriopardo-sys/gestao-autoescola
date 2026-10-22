"use client";

import { useState } from "react";
import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input, Select, Textarea } from "@/components/ui";
import { DURACOES } from "@/lib/aulas";
import { agendarAula } from "./actions";

export type OpcaoMatricula = {
  id: number;
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
}: {
  matriculas: OpcaoMatricula[];
  instrutores: Opcao[];
  veiculos: Opcao[];
  matriculaInicial?: number;
  dia: string;
}) {
  const [matriculaId, setMatriculaId] = useState(String(matriculaInicial ?? ""));
  const matricula = matriculas.find((m) => String(m.id) === matriculaId);
  const [tipo, setTipo] = useState(matricula && matricula.restantes.pratica === 0 ? "teorica" : "pratica");

  // Mostra só veículos compatíveis com a categoria da matrícula.
  const veiculosCompativeis = matricula
    ? veiculos.filter((v) => matricula.categoria.includes(v.categorias))
    : veiculos;

  return (
    <Cartao className="max-w-3xl">
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
                Restam {matricula.restantes.pratica} aulas práticas e {matricula.restantes.teorica} teóricas para
                agendar.
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
            <Select name="instrutorId" required defaultValue="">
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
              <Select name="veiculoId" required defaultValue="">
                <option value="">Selecione...</option>
                {veiculosCompativeis.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </Select>
            </Campo>
          )}
          <Campo label="Data *">
            <Input name="data" type="date" required defaultValue={dia} />
          </Campo>
          <Campo label="Horário *">
            <Input name="hora" type="time" required step={300} />
          </Campo>
          <Campo label="Duração">
            <Select name="duracaoMin" defaultValue="50">
              {DURACOES.map((d) => (
                <option key={d} value={d}>
                  {d} minutos
                </option>
              ))}
            </Select>
          </Campo>
          <Campo label="Observações" className="sm:col-span-2">
            <Textarea name="obs" rows={2} />
          </Campo>
        </div>
      </FormAcao>
    </Cartao>
  );
}
