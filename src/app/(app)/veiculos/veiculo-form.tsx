import type { Veiculo } from "@prisma/client";
import { FormAcao } from "@/components/form-acao";
import { Campo, Cartao, Input, Select } from "@/components/ui";
import { salvarVeiculo } from "./actions";

export function VeiculoForm({ veiculo }: { veiculo?: Veiculo }) {
  return (
    <Cartao className="max-w-xl">
      <FormAcao acao={salvarVeiculo.bind(null, veiculo?.id ?? null)}>
        <Campo label="Placa *">
          <Input name="placa" required placeholder="ABC1D23" defaultValue={veiculo?.placa} className="uppercase" />
        </Campo>
        <Campo label="Modelo *">
          <Input name="modelo" required placeholder="Ex.: Fiat Mobi 2023" defaultValue={veiculo?.modelo} />
        </Campo>
        <Campo label="Categoria *">
          <Select name="categoria" defaultValue={veiculo?.categoria ?? "B"}>
            <option value="A">A (moto)</option>
            <option value="B">B (carro)</option>
            <option value="C">C (caminhão)</option>
            <option value="D">D (ônibus)</option>
            <option value="E">E (carreta)</option>
          </Select>
        </Campo>
        <label className="flex items-center gap-2 text-base">
          <input type="checkbox" name="ativo" defaultChecked={veiculo?.ativo ?? true} />
          Ativo
        </label>
      </FormAcao>
    </Cartao>
  );
}
