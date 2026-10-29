"use client";

import { useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import type { Configuracao } from "@prisma/client";
import { ORIENTACOES_PADRAO } from "@/lib/orientacoes";
import { FormAcao } from "@/components/form-acao";
import { Botao, Campo, Input, Select, Textarea } from "@/components/ui";
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
            <Botao
              type="button"
              variante="secundario"
              tamanho="pequeno"
              icone={ImageUp}
              onClick={() => arquivo.current?.click()}
            >
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
        <Campo
          label="Chave Pix"
          ajuda="Impressa no carnê e na guia, junto com o QR Code para pagar. Telefone: escreva com o DDD entre parênteses, ex.: (11) 99999-9999."
          className="sm:col-span-2"
        >
          <Input name="chavePix" defaultValue={config.chavePix ?? ""} />
        </Campo>
        <Campo
          label="Aviso no carnê"
          ajuda="Texto impresso em cada parcela. Ex.: Após o vencimento, multa de 2% e juros de 1% ao mês."
          className="sm:col-span-2"
        >
          <Textarea name="avisoCarne" rows={2} defaultValue={config.avisoCarne ?? ""} />
        </Campo>
        <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
          <legend className="px-1 text-base font-semibold text-slate-800">Horários das aulas</legend>
          <p className="mb-3 text-sm text-slate-600">
            Ao agendar, o sistema oferece os horários dentro do expediente e desabilita os que estiverem ocupados.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label="Primeira aula às">
              <Input name="horaInicio" type="time" step={300} required defaultValue={config.horaInicio} />
            </Campo>
            <Campo label="Expediente termina às">
              <Input name="horaFim" type="time" step={300} required defaultValue={config.horaFim} />
            </Campo>
            <Campo label="Uma aula a cada">
              <Select name="intervaloMin" defaultValue={String(config.intervaloMin)}>
                {[10, 15, 20, 30, 45, 50, 60, 90, 100, 120].map((m) => (
                  <option key={m} value={m}>
                    {m < 60
                      ? `${m} minutos`
                      : m === 60
                        ? "1 hora"
                        : `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}`}
                  </option>
                ))}
              </Select>
            </Campo>
          </div>
        </fieldset>
        <Campo
          label="Orientações para o aluno"
          ajuda="Impressas no guia entregue na matrícula. Uma orientação por linha."
          className="sm:col-span-2"
        >
          <Textarea name="orientacoesAluno" rows={6} defaultValue={config.orientacoesAluno ?? ORIENTACOES_PADRAO} />
        </Campo>
      </div>
    </FormAcao>
  );
}
