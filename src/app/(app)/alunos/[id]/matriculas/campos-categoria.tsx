"use client";

import { useState } from "react";
import { Campo, Input, Select } from "@/components/ui";
import { CATEGORIAS } from "@/lib/format";

// Categoria da matrícula e aulas práticas contratadas em cada categoria
// (ex.: AB → 10 aulas de moto e 20 de carro). O agendamento controla o saldo de cada uma.
export function CamposCategoria({
  categoria: inicial,
  praticas,
  totalAntigo,
}: {
  categoria: string;
  // Aulas por categoria já gravadas (alteração da matrícula).
  praticas?: Record<string, number> | null;
  // Matrícula antiga de duas categorias, ainda sem a divisão.
  totalAntigo?: number;
}) {
  const [categoria, setCategoria] = useState(inicial);
  const letras = [...new Set(categoria.split(""))];
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(praticas ?? {}).map(([l, n]) => [l, String(n)])),
  );
  const total = letras.reduce((s, l) => s + (Number(valores[l]) || 0), 0);

  return (
    <>
      <Campo label="Categoria">
        <Select name="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Campo>
      {letras.map((l) => (
        <Campo key={l} label={letras.length > 1 ? `Aulas práticas – categoria ${l}` : "Aulas práticas"}>
          <Input
            name={`praticas_${l}`}
            type="number"
            min={0}
            required
            placeholder="0"
            value={valores[l] ?? (letras.length === 1 && praticas === undefined ? "0" : "")}
            onChange={(e) => setValores({ ...valores, [l]: e.target.value })}
          />
        </Campo>
      ))}
      {letras.length > 1 && (
        <p className="text-sm text-slate-600 sm:col-span-3">
          Total: <b>{total} aulas práticas</b>. No agendamento, cada aula conta na categoria do veículo usado.
          {totalAntigo ? ` Antes estavam ${totalAntigo} aulas sem divisão: informe quantas são de cada categoria.` : ""}
        </p>
      )}
    </>
  );
}
