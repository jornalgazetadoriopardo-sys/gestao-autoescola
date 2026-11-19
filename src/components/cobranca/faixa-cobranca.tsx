import { AlertTriangle, CalendarClock, Clock, Lock, MessageCircle } from "lucide-react";
import { formatarMoeda, hojeISO } from "@/lib/format";
import {
  FORMAS_COBRANCA,
  pixDaMensalidade,
  type Plataforma,
  type SituacaoCobranca,
} from "@/lib/mensalidades";
import { CopiarTexto } from "./copiar";
import { InformarPagamento } from "./informar-pagamento";

// Avisos da mensalidade do sistema no topo de todas as telas da autoescola.

function dataExtensa(dia: string) {
  const d = new Date(`${dia}T12:00:00Z`);
  const semana = d.toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" });
  return `${semana}, ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })}`;
}

function linkWhatsApp(numero: string | null) {
  const d = (numero ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  return `https://wa.me/${d.length <= 11 ? `55${d}` : d}?text=${encodeURIComponent("Olá! Sobre a mensalidade do sistema da autoescola:")}`;
}

type Pendente = Exclude<SituacaoCobranca, { tipo: "em-dia" }>;

// QR Code, chave e "copia e cola" (Pix) ou as instruções da outra forma de pagamento.
async function ComoPagar({ s, p, escuro }: { s: Pendente; p: Plataforma; escuro?: boolean }) {
  const pix = await pixDaMensalidade(s.mensalidade, p);
  const botao = escuro
    ? "border-red-300 bg-white text-red-800 hover:bg-red-50"
    : "border-green-300 bg-white text-green-800 hover:bg-green-50";
  if (!pix) {
    return (
      <p className="text-sm">
        <b>{FORMAS_COBRANCA[s.mensalidade.forma] ?? s.mensalidade.forma}:</b>{" "}
        {p.instrucoes ?? "Fale com o suporte para receber os dados de pagamento."}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        role="img"
        aria-label="QR Code do Pix"
        className="size-28 shrink-0 rounded-lg bg-white p-1.5 [&>svg]:size-full"
        dangerouslySetInnerHTML={{ __html: pix.svg }}
      />
      <div className="min-w-0 space-y-2 text-sm">
        <div>
          Chave Pix: <b className="break-all">{pix.chave}</b>
          {p.nomeRecebedor && <span className="opacity-80"> · {p.nomeRecebedor}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <CopiarTexto texto={pix.chave} rotulo="Copiar chave" className={botao} />
          <CopiarTexto texto={pix.copiaECola} rotulo="Pix copia e cola (com o valor)" className={botao} />
        </div>
      </div>
    </div>
  );
}

export async function FaixaCobranca({ s, p }: { s: SituacaoCobranca; p: Plataforma }) {
  if (s.tipo === "em-dia" || s.tipo === "bloqueada") return null;
  const valor = formatarMoeda(s.mensalidade.valorCentavos);

  if (s.tipo === "informada") {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <Clock className="size-5 shrink-0" aria-hidden />
        Recebemos seu aviso de pagamento da mensalidade de {valor}. Assim que confirmarmos, este aviso some. Obrigado!
      </div>
    );
  }

  if (s.tipo === "aviso") {
    const hoje = s.vencimento === hojeISO();
    return (
      <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-green-950">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-base">
          <CalendarClock className="size-5 shrink-0 text-green-700" aria-hidden />
          <span>
            A mensalidade do sistema, de <b>{valor}</b>, vence <b>{hoje ? "hoje" : dataExtensa(s.vencimento)}</b>.
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <ComoPagar s={s} p={p} />
          <InformarPagamento mensalidadeId={s.mensalidade.id} />
        </div>
      </div>
    );
  }

  // Atrasada, ainda dentro do prazo de tolerância.
  const zap = linkWhatsApp(p.whatsappCobranca);
  return (
    <div className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-5 text-red-950 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-7 shrink-0 text-red-600" aria-hidden />
        <div>
          <div className="text-lg font-bold">Não identificamos o pagamento da mensalidade</div>
          <p className="mt-1 text-base">
            A mensalidade de <b>{valor}</b>, com vencimento em {dataExtensa(s.vencimento)}, ainda não consta como paga.
            {p.bloquearAutomatico ? (
              <>
                {" "}
                Para evitar o bloqueio da conta, pedimos que efetue o pagamento até <b>{dataExtensa(s.limite)}</b>.
              </>
            ) : (
              <> Pedimos que efetue o pagamento até {dataExtensa(s.limite)}.</>
            )}{" "}
            Se já pagou, é só avisar abaixo. Obrigado!
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <ComoPagar s={s} p={p} escuro />
        <div className="flex flex-wrap items-center gap-2">
          {zap && (
            <a
              href={zap}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-800 hover:bg-red-50"
            >
              <MessageCircle className="size-4" aria-hidden /> Falar com o suporte
            </a>
          )}
          <InformarPagamento mensalidadeId={s.mensalidade.id} />
        </div>
      </div>
    </div>
  );
}

// No lugar da tela, quando a conta está bloqueada por falta de pagamento.
export async function TelaBloqueio({ s, p }: { s: Pendente; p: Plataforma }) {
  const zap = linkWhatsApp(p.whatsappCobranca);
  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="rounded-3xl border-2 border-red-200 bg-white p-6 shadow-sm sm:p-10">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <Lock className="size-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Acesso bloqueado temporariamente</h1>
        <p className="mt-3 text-base text-slate-700">
          Não identificamos o pagamento da mensalidade de <b>{formatarMoeda(s.mensalidade.valorCentavos)}</b>, com
          vencimento em {dataExtensa(s.vencimento)}. Os seus dados estão guardados e em segurança: assim que o pagamento
          for feito, o acesso volta ao normal.
        </p>
        <div className="mt-6 rounded-2xl bg-red-50 p-5 text-red-950">
          <ComoPagar s={s} p={p} escuro />
        </div>
        <div className="mt-6 space-y-3">
          <p className="text-sm text-slate-600">
            Já pagou? Avise abaixo e o acesso é liberado enquanto conferimos o pagamento.
          </p>
          <InformarPagamento mensalidadeId={s.mensalidade.id} aberto />
          {zap && (
            <a
              href={zap}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"
            >
              <MessageCircle className="size-4" aria-hidden /> Falar com o suporte pelo WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
