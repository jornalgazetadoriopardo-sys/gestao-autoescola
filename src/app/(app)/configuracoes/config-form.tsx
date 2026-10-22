"use client";

import { useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import type { Configuracao } from "@prisma/client";
import { FormAcao } from "@/components/form-acao";
import { Botao, Campo, Input, Textarea } from "@/components/ui";
import { salvarConfig } from "./actions";

const LADO_MAX = 360;

// Reduz a imagem no navegador antes de enviar, para o logotipo ficar leve.
function reduzirImagem(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    img.src = URL.createObjectURL(arquivo);
  });
}

export function ConfigForm({ config }: { config: Configuracao }) {
  const [logo, setLogo] = useState(config.logo ?? "");
  const [erroLogo, setErroLogo] = useState("");
  const arquivo = useRef<HTMLInputElement>(null);

  return (
    <FormAcao acao={salvarConfig} textoBotao="Salvar dados da autoescola">
      <div className="flex flex-wrap items-center gap-5 rounded-xl bg-slate-50 p-4">
        <div className="flex size-28 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Logotipo" className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <ImageUp className="size-10 text-slate-400" aria-hidden />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-base font-medium text-slate-800">Logotipo</p>
          <p className="text-sm text-slate-600">Aparece no menu, nos recibos, no carnê e nos relatórios.</p>
          <div className="flex flex-wrap gap-2">
            <Botao type="button" variante="secundario" tamanho="pequeno" icone={ImageUp} onClick={() => arquivo.current?.click()}>
              {logo ? "Trocar imagem" : "Escolher imagem"}
            </Botao>
            {logo && (
              <Botao type="button" variante="perigo" tamanho="pequeno" icone={Trash2} onClick={() => setLogo("")}>
                Remover
              </Botao>
            )}
          </div>
          {erroLogo && <p className="text-sm text-red-700">{erroLogo}</p>}
        </div>
        <input
          ref={arquivo}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              setErroLogo("");
              setLogo(await reduzirImagem(f));
            } catch (err) {
              setErroLogo((err as Error).message);
            }
            e.target.value = "";
          }}
        />
        <input type="hidden" name="logo" value={logo} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Nome da autoescola *" className="sm:col-span-2">
          <Input name="nome" required defaultValue={config.nome} />
        </Campo>
        <Campo label="Razão social">
          <Input name="razaoSocial" defaultValue={config.razaoSocial ?? ""} />
        </Campo>
        <Campo label="CNPJ">
          <Input name="cnpj" placeholder="00.000.000/0000-00" defaultValue={config.cnpj ?? ""} />
        </Campo>
        <Campo label="Endereço" className="sm:col-span-2">
          <Input name="endereco" placeholder="Rua, número" defaultValue={config.endereco ?? ""} />
        </Campo>
        <Campo label="Bairro">
          <Input name="bairro" defaultValue={config.bairro ?? ""} />
        </Campo>
        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <Campo label="Cidade">
            <Input name="cidade" defaultValue={config.cidade ?? ""} />
          </Campo>
          <Campo label="UF">
            <Input name="uf" maxLength={2} className="uppercase" defaultValue={config.uf ?? ""} />
          </Campo>
        </div>
        <Campo label="CEP">
          <Input name="cep" inputMode="numeric" defaultValue={config.cep ?? ""} />
        </Campo>
        <Campo label="Telefone">
          <Input name="telefone" inputMode="tel" defaultValue={config.telefone ?? ""} />
        </Campo>
        <Campo label="WhatsApp">
          <Input name="whatsapp" inputMode="tel" defaultValue={config.whatsapp ?? ""} />
        </Campo>
        <Campo label="E-mail">
          <Input name="email" type="email" defaultValue={config.email ?? ""} />
        </Campo>
        <Campo label="Chave Pix" ajuda="Impressa no carnê para o aluno pagar por Pix." className="sm:col-span-2">
          <Input name="chavePix" defaultValue={config.chavePix ?? ""} />
        </Campo>
        <Campo
          label="Aviso no carnê"
          ajuda="Texto impresso em cada parcela. Ex.: Após o vencimento, multa de 2% e juros de 1% ao mês."
          className="sm:col-span-2"
        >
          <Textarea name="avisoCarne" rows={2} defaultValue={config.avisoCarne ?? ""} />
        </Campo>
      </div>
    </FormAcao>
  );
}
