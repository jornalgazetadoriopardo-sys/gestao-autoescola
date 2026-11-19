"use client";

import { useRef, useState } from "react";
import { BadgeCheck, QrCode, Smartphone, X } from "lucide-react";
import { CopiarTexto } from "./copiar";
import { InformarPagamento } from "./informar-pagamento";

// Dados para pagar uma mensalidade (montados no servidor, ver faixa-cobranca.tsx).
export type DadosPagamento = {
  mensalidadeId: number;
  valor: string; // "R$ 99,00"
  vencimento: string; // "terça-feira, 10/11"
  forma: string; // "Pix", "Boleto"...
  pix: { chave: string; copiaECola: string; svg: string } | null;
  recebedor: string | null;
  instrucoes: string | null;
};

// Tudo o que é preciso para pagar: QR Code, chave em destaque, copiar e "Já paguei".
export function PainelPagamento({
  dados,
  jaPaguei = false,
  contratar = false,
}: {
  dados: DadosPagamento;
  jaPaguei?: boolean;
  // Contratação no fim da avaliação: o pagamento é o da 1ª mensalidade.
  contratar?: boolean;
}) {
  return (
    <div className="space-y-5 text-slate-900">
      {contratar && (
        <div className="rounded-2xl bg-orange-50 p-4 text-center text-orange-950">
          <div className="text-lg font-bold">Contratar o Gestão Autoescola</div>
          <p className="mt-1 text-sm">
            Para continuar usando depois da avaliação, é só pagar a 1ª mensalidade. Os seus dados continuam todos aqui.
          </p>
        </div>
      )}
      <div className="text-center">
        <div className="text-sm text-slate-600">{contratar ? "1ª mensalidade" : "Mensalidade do sistema"}</div>
        <div className="text-3xl font-bold tracking-tight">{dados.valor}</div>
        <div className="text-sm text-slate-600">Vencimento: {dados.vencimento}</div>
      </div>

      {dados.pix ? (
        <div className="flex flex-col items-center gap-5">
          {/* Borda branca larga: os apps de banco leem o QR Code com mais facilidade. */}
          <div
            role="img"
            aria-label="QR Code do Pix"
            className="sem-tema size-60 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: dados.pix.svg }}
          />
          <div className="w-full space-y-2 text-center">
            <div className="text-sm font-medium text-slate-600">Chave Pix</div>
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-xl font-bold break-all text-blue-950">
              {dados.pix.chave}
            </div>
            <CopiarTexto
              texto={dados.pix.chave}
              rotulo="Copiar chave Pix"
              className="border-blue-300 bg-white text-blue-800 hover:bg-blue-50"
            />
            {dados.recebedor && <div className="text-sm text-slate-600">Recebedor: {dados.recebedor}</div>}
          </div>
          <div className="w-full border-t border-slate-200 pt-4 text-center">
            <CopiarTexto
              texto={dados.pix.copiaECola}
              rotulo="Pix copia e cola (já com o valor)"
              className="w-full justify-center border-blue-600 bg-blue-600 py-3 text-base text-white hover:bg-blue-700"
            />
            <p className="mt-3 flex items-start gap-2 text-left text-sm text-slate-600">
              <Smartphone className="mt-0.5 size-4 shrink-0" aria-hidden />
              No app do banco, abra o Pix e escolha “Ler QR Code” ou “Pix copia e cola”. Confira o valor e o recebedor
              antes de confirmar.
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 p-4 text-base">
          <b>{dados.forma}:</b> {dados.instrucoes ?? "Fale com o suporte para receber os dados de pagamento."}
        </p>
      )}

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-3 text-sm text-slate-600">
          Já pagou? Avise aqui (o comprovante ajuda a confirmar mais rápido). O aviso some quando confirmarmos.
        </p>
        <InformarPagamento key={String(jaPaguei)} mensalidadeId={dados.mensalidadeId} aberto={jaPaguei} />
      </div>
    </div>
  );
}

// Botões "Pagar agora" e "Já paguei" das faixas (ou "Contratar agora", na avaliação);
// todos abrem o modal de pagamento.
export function BotoesPagamento({
  dados,
  cor,
  contratar = false,
}: {
  dados: DadosPagamento;
  cor: "verde" | "vermelho" | "laranja";
  contratar?: boolean;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [jaPaguei, setJaPaguei] = useState(false);
  const abrir = (informar: boolean) => {
    setJaPaguei(informar);
    dialogo.current?.showModal();
  };
  const principal = {
    verde: "bg-green-700 text-white hover:bg-green-800",
    vermelho: "bg-red-700 text-white hover:bg-red-800",
    laranja: "bg-white text-orange-700 hover:bg-orange-50",
  }[cor];
  const secundario =
    cor === "verde"
      ? "border-green-400 bg-white text-green-800 hover:bg-green-50"
      : "border-red-300 bg-white text-red-800 hover:bg-red-50";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => abrir(false)}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-base font-semibold shadow-sm ${principal}`}
        >
          {contratar ? (
            <>
              <BadgeCheck className="size-5" aria-hidden /> Contratar agora
            </>
          ) : (
            <>
              <QrCode className="size-5" aria-hidden /> Pagar agora
            </>
          )}
        </button>
        {!contratar && (
          <button
            type="button"
            onClick={() => abrir(true)}
            className={`inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-base font-semibold ${secundario}`}
          >
            <BadgeCheck className="size-5" aria-hidden /> Já paguei
          </button>
        )}
      </div>

      <dialog
        ref={dialogo}
        aria-label="Pagamento da mensalidade"
        // Clicar fora da janela fecha.
        onClick={(e) => e.target === e.currentTarget && dialogo.current?.close()}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60"
      >
        <div className="max-h-[90dvh] overflow-y-auto p-6">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Fechar"
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>
          <PainelPagamento dados={dados} jaPaguei={jaPaguei} contratar={contratar} />
        </div>
      </dialog>
    </>
  );
}
