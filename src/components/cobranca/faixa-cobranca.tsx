import { AlertTriangle, CalendarClock, Clock, Hourglass, Lock, MessageCircle } from "lucide-react";
import { formatarMoeda, hojeISO } from "@/lib/format";
import { FORMAS_COBRANCA, pixDaMensalidade, type Plataforma, type SituacaoCobranca } from "@/lib/mensalidades";
import { BotoesPagamento, PainelPagamento, type DadosPagamento } from "./pagamento";

// Avisos da mensalidade do sistema no topo de todas as telas da autoescola.

export function dataExtensa(dia: string) {
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

// Dados do modal de pagamento (QR Code, chave e "copia e cola", ou as instruções).
export async function dadosPagamento(
  m: Pendente["mensalidade"],
  vencimento: string,
  p: Plataforma,
): Promise<DadosPagamento> {
  return {
    mensalidadeId: m.id,
    valor: formatarMoeda(m.valorCentavos),
    vencimento: dataExtensa(vencimento),
    forma: FORMAS_COBRANCA[m.forma] ?? m.forma,
    pix: await pixDaMensalidade(m, p),
    recebedor: p.nomeRecebedor,
    instrucoes: p.instrucoes,
  };
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

  const dados = await dadosPagamento(s.mensalidade, s.vencimento, p);

  // Período de avaliação: tarja laranja presa no topo da tela.
  if (s.tipo === "avaliacao") {
    const [ano, mes, dia] = s.vencimento.split("-");
    return (
      <div className="sticky top-14 z-20 -mx-4 -mt-4 mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-orange-500 px-4 py-2.5 text-white shadow-sm sm:-mx-6 sm:-mt-6 md:top-0 lg:-mx-10 lg:-mt-8">
        <span className="flex items-center gap-2 text-base font-medium">
          <Hourglass className="size-5 shrink-0" aria-hidden />
          <span>
            Período de avaliação válido até{" "}
            <b>
              {dia}/{mes}/{ano}
            </b>
            .
          </span>
        </span>
        <BotoesPagamento dados={dados} cor="laranja" contratar />
      </div>
    );
  }

  if (s.tipo === "aviso") {
    const hoje = s.vencimento === hojeISO();
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-3 text-green-950">
        <span className="flex items-center gap-2 text-base">
          <CalendarClock className="size-5 shrink-0 text-green-700" aria-hidden />
          <span>
            A mensalidade do sistema, de <b>{valor}</b>, vence <b>{hoje ? "hoje" : dataExtensa(s.vencimento)}</b>.
          </span>
        </span>
        <BotoesPagamento dados={dados} cor="verde" />
      </div>
    );
  }

  // Atrasada, ainda dentro do prazo de tolerância.
  const zap = linkWhatsApp(p.whatsappCobranca);
  return (
    <div className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-5 text-red-950 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-7 shrink-0 text-red-600" aria-hidden />
        <div className="min-w-0 flex-1">
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
            Se já pagou, é só avisar. Obrigado!
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <BotoesPagamento dados={dados} cor="vermelho" />
            {zap && (
              <a
                href={zap}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-800 hover:underline"
              >
                <MessageCircle className="size-4" aria-hidden /> Falar com o suporte
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// No lugar da tela, quando a conta está bloqueada por falta de pagamento.
export async function TelaBloqueio({ s, p }: { s: Pendente; p: Plataforma }) {
  const zap = linkWhatsApp(p.whatsappCobranca);
  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="rounded-3xl border-2 border-red-200 bg-white p-6 shadow-sm sm:p-10">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <Lock className="size-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Acesso bloqueado temporariamente</h1>
        <p className="mt-3 text-base text-slate-700">
          Não identificamos o pagamento da mensalidade de <b>{formatarMoeda(s.mensalidade.valorCentavos)}</b>, com
          vencimento em {dataExtensa(s.vencimento)}. Os seus dados estão guardados e em segurança: assim que o pagamento
          for feito, o acesso volta ao normal. Ao avisar que pagou, o acesso é liberado enquanto conferimos.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-200 p-5">
          <PainelPagamento dados={await dadosPagamento(s.mensalidade, s.vencimento, p)} />
        </div>
        {zap && (
          <a
            href={zap}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"
          >
            <MessageCircle className="size-4" aria-hidden /> Falar com o suporte pelo WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
