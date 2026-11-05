import { FORMATOS_POST, type FormatoPost } from "@/lib/posts";
import { PALETAS, paletaValida } from "@/lib/paletas";

// Desenha a imagem do post (1080 de largura) num <canvas>, no navegador.
// Cada modelo monta uma lista de blocos (texto, selo, lista...) que primeiro
// são medidos e depois posicionados: assim o mesmo modelo serve no quadrado
// (feed) e no vertical (stories) sem cortar texto.

export type Marca = {
  nome: string;
  contato: string | null;
  cidade: string | null;
  paleta: string;
  logo: HTMLImageElement | null;
};

export type Imagens = { foto?: HTMLImageElement | null };

const FONTE = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

// OKLCH → hex (sRGB), para usar a cor da paleta da autoescola no canvas.
function oklch(l: number, c: number, h: number) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return (
    "#" +
    lin
      .map((x) => {
        const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
        return Math.round(Math.min(Math.max(v, 0), 1) * 255)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

export function coresDaPaleta(paleta: string) {
  const p = PALETAS[paletaValida(paleta)];
  const c = (l: number, croma: number) => oklch(l, croma * p.croma, p.matiz);
  return {
    principal: c(0.56, 0.22),
    forte: c(0.45, 0.2),
    escuro: c(0.2, 0.05),
    escuro2: c(0.3, 0.09),
    claro: c(0.97, 0.015),
    claro2: c(0.92, 0.04),
    destaque: c(0.85, 0.12),
  };
}
type Cores = ReturnType<typeof coresDaPaleta>;

// ---- Texto -----------------------------------------------------------------

function quebrar(ctx: CanvasRenderingContext2D, texto: string, larguraMax: number) {
  const linhas: string[] = [];
  for (const paragrafo of texto.split("\n")) {
    let atual = "";
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (ctx.measureText(teste).width <= larguraMax || !atual) atual = teste;
      else {
        linhas.push(atual);
        atual = palavra;
      }
    }
    linhas.push(atual);
  }
  return linhas;
}

type Bloco = { h: number; desenhar: (y: number) => void };

type OpcoesTexto = {
  tamanho: number;
  minimo?: number;
  peso?: number;
  cor: string;
  maxLinhas?: number;
  altura?: number; // entrelinha (× tamanho)
  alinhar?: CanvasTextAlign;
  x: number;
  largura: number;
};

// Texto que diminui sozinho até caber no número de linhas.
function texto(ctx: CanvasRenderingContext2D, conteudo: string, o: OpcoesTexto): Bloco {
  if (!conteudo.trim()) return { h: 0, desenhar: () => {} };
  const peso = o.peso ?? 400;
  const maxLinhas = o.maxLinhas ?? 3;
  let tamanho = o.tamanho;
  let linhas: string[] = [];
  for (;;) {
    ctx.font = `${peso} ${tamanho}px ${FONTE}`;
    linhas = quebrar(ctx, conteudo, o.largura);
    if (linhas.length <= maxLinhas || tamanho <= (o.minimo ?? o.tamanho * 0.55)) break;
    tamanho -= 2;
  }
  if (linhas.length > maxLinhas) {
    linhas = linhas.slice(0, maxLinhas);
    linhas[maxLinhas - 1] = linhas[maxLinhas - 1].replace(/\s*\S*$/, "") + "…";
  }
  const passo = tamanho * (o.altura ?? 1.15);
  return {
    h: passo * linhas.length,
    desenhar: (y) => {
      ctx.font = `${peso} ${tamanho}px ${FONTE}`;
      ctx.fillStyle = o.cor;
      ctx.textAlign = o.alinhar ?? "left";
      ctx.textBaseline = "top";
      const x = o.alinhar === "center" ? o.x + o.largura / 2 : o.alinhar === "right" ? o.x + o.largura : o.x;
      linhas.forEach((l, i) => ctx.fillText(l, x, y + i * passo + (passo - tamanho) / 2));
    },
  };
}

function selo(
  ctx: CanvasRenderingContext2D,
  conteudo: string,
  o: { x: number; tamanho: number; fundo: string; cor: string; centro?: number },
): Bloco {
  if (!conteudo.trim()) return { h: 0, desenhar: () => {} };
  ctx.font = `800 ${o.tamanho}px ${FONTE}`;
  const w = ctx.measureText(conteudo).width + o.tamanho * 1.4;
  const h = o.tamanho * 1.9;
  return {
    h,
    desenhar: (y) => {
      const x = o.centro !== undefined ? o.centro - w / 2 : o.x;
      ctx.fillStyle = o.fundo;
      retangulo(ctx, x, y, w, h, h / 2);
      ctx.fill();
      ctx.font = `800 ${o.tamanho}px ${FONTE}`;
      ctx.fillStyle = o.cor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(conteudo, x + w / 2, y + h / 2 + o.tamanho * 0.04);
    },
  };
}

const espaco = (h: number): Bloco => ({ h, desenhar: () => {} });

// Posiciona os blocos na área (de cima, no centro ou embaixo).
function posicionar(blocos: Bloco[], topo: number, base: number, ancora: "topo" | "centro" | "base") {
  const total = blocos.reduce((s, b) => s + b.h, 0);
  let y = ancora === "topo" ? topo : ancora === "base" ? base - total : topo + (base - topo - total) / 2;
  for (const b of blocos) {
    b.desenhar(y);
    y += b.h;
  }
}

// ---- Formas e imagens --------------------------------------------------------

function retangulo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Imagem cobrindo a área (corta as sobras, como object-fit: cover).
function cobrir(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const escala = Math.max(w / iw, h / ih);
  const sw = w / escala;
  const sh = h / escala;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 3, sw, sh, x, y, w, h);
}

function circuloFoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  r: number,
  borda: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  cobrir(ctx, img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
  ctx.lineWidth = r * 0.06;
  ctx.strokeStyle = borda;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function degrade(ctx: CanvasRenderingContext2D, y0: number, y1: number, de: string, ate: string, W: number, H: number) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, de);
  g.addColorStop(1, ate);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

const transparente = (hex: string, alfa: number) =>
  `${hex}${Math.round(alfa * 255)
    .toString(16)
    .padStart(2, "0")}`;

// ---- Cabeçalho e rodapé -------------------------------------------------------

const MARGEM = 80;

function cabecalho(ctx: CanvasRenderingContext2D, marca: Marca, claro: boolean, cores: Cores) {
  const y = 64;
  let x = MARGEM;
  if (marca.logo) {
    const s = 96;
    ctx.fillStyle = "#ffffff";
    retangulo(ctx, x, y, s, s, 22);
    ctx.fill();
    const iw = marca.logo.naturalWidth || 1;
    const ih = marca.logo.naturalHeight || 1;
    const e = Math.min((s - 16) / iw, (s - 16) / ih);
    ctx.drawImage(marca.logo, x + (s - iw * e) / 2, y + (s - ih * e) / 2, iw * e, ih * e);
    x += s + 24;
  }
  texto(ctx, marca.nome, {
    tamanho: 38,
    minimo: 26,
    peso: 700,
    cor: claro ? cores.escuro : "#ffffff",
    maxLinhas: 2,
    x,
    largura: 1080 - x - MARGEM,
    altura: 1.1,
  }).desenhar(y + 6);
  return y + 96 + 40;
}

function rodape(ctx: CanvasRenderingContext2D, marca: Marca, H: number, fundo: string, cor: string) {
  const h = 128;
  ctx.fillStyle = fundo;
  ctx.fillRect(0, H - h, 1080, h);
  const partes = [marca.contato, marca.cidade].filter(Boolean).join("   ·   ");
  texto(ctx, partes || marca.nome, {
    tamanho: 36,
    minimo: 26,
    peso: 600,
    cor,
    maxLinhas: 1,
    x: MARGEM,
    largura: 1080 - MARGEM * 2,
    alinhar: "center",
  }).desenhar(H - h + (h - 42) / 2);
  return H - h;
}

// ---- Modelos -----------------------------------------------------------------

export function desenharPost(
  canvas: HTMLCanvasElement,
  modelo: string,
  dados: Record<string, string>,
  imagens: Imagens,
  marca: Marca,
  formato: FormatoPost,
) {
  const { largura: W, altura: H } = FORMATOS_POST[formato];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const cores = coresDaPaleta(marca.paleta);
  const v = (k: string) => (dados[k] ?? "").trim();
  const largura = W - MARGEM * 2;
  const story = formato === "story";
  const foto = imagens.foto ?? null;
  ctx.clearRect(0, 0, W, H);

  switch (modelo) {
    case "aprovado": {
      if (foto) {
        cobrir(ctx, foto, 0, 0, W, H);
        degrade(ctx, H * 0.3, H, "rgba(0,0,0,0)", transparente(cores.escuro, 0.96), W, H);
        degrade(ctx, 0, H * 0.22, transparente(cores.escuro, 0.75), "rgba(0,0,0,0)", W, H * 0.22);
      } else {
        degrade(ctx, 0, H, cores.escuro2, cores.escuro, W, H);
        // Selo de aprovado desenhado (sem foto).
        const cx = W / 2;
        const cy = story ? H * 0.36 : H * 0.36;
        const r = story ? 210 : 150;
        ctx.fillStyle = cores.principal;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = r * 0.16;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.42, cy + r * 0.02);
        ctx.lineTo(cx - r * 0.1, cy + r * 0.34);
        ctx.lineTo(cx + r * 0.46, cy - r * 0.3);
        ctx.stroke();
      }
      cabecalho(ctx, marca, false, cores);
      const base = rodape(ctx, marca, H, cores.principal, "#ffffff") - (story ? 140 : 56);
      posicionar(
        [
          selo(ctx, "APROVADO!", { x: MARGEM, tamanho: story ? 60 : 50, fundo: cores.principal, cor: "#ffffff" }),
          espaco(28),
          texto(ctx, v("nome"), {
            tamanho: story ? 120 : 100,
            peso: 800,
            cor: "#ffffff",
            maxLinhas: 2,
            x: MARGEM,
            largura,
            altura: 1.05,
          }),
          espaco(14),
          texto(ctx, v("categoria") ? `Habilitado(a) na categoria ${v("categoria").toUpperCase()}` : "", {
            tamanho: story ? 50 : 42,
            peso: 600,
            cor: cores.destaque,
            maxLinhas: 1,
            x: MARGEM,
            largura,
          }),
          espaco(10),
          texto(ctx, v("mensagem"), { tamanho: story ? 46 : 38, cor: "#ffffffdd", maxLinhas: 2, x: MARGEM, largura }),
        ],
        0,
        base,
        "base",
      );
      break;
    }

    case "matriculas": {
      if (foto) {
        cobrir(ctx, foto, 0, 0, W, H);
        ctx.fillStyle = transparente(cores.escuro, 0.78);
        ctx.fillRect(0, 0, W, H);
      } else {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, cores.escuro);
        g.addColorStop(1, cores.forte);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        // Faixas diagonais discretas, lembrando a pista.
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#ffffff";
        for (let i = -2; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(W * 0.55 + i * 140, H);
          ctx.lineTo(W * 0.55 + i * 140 + 60, H);
          ctx.lineTo(W + i * 140 + 60, H * 0.35);
          ctx.lineTo(W + i * 140, H * 0.35);
          ctx.fill();
        }
        ctx.restore();
      }
      const topo = cabecalho(ctx, marca, false, cores);
      const base = rodape(ctx, marca, H, cores.principal, "#ffffff");
      const condicoes = v("condicoes")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 4);
      posicionar(
        [
          selo(ctx, v("destaque").toUpperCase(), {
            x: MARGEM,
            tamanho: story ? 40 : 34,
            fundo: cores.principal,
            cor: "#ffffff",
          }),
          espaco(v("destaque") ? 30 : 0),
          texto(ctx, v("titulo"), {
            tamanho: story ? 130 : 108,
            peso: 800,
            cor: "#ffffff",
            maxLinhas: 3,
            x: MARGEM,
            largura,
            altura: 1.0,
          }),
          espaco(30),
          texto(ctx, v("preco"), {
            tamanho: story ? 80 : 66,
            peso: 800,
            cor: cores.destaque,
            maxLinhas: 2,
            x: MARGEM,
            largura,
            altura: 1.05,
          }),
          espaco(condicoes.length ? 34 : 0),
          ...condicoes.flatMap((c) => [
            texto(ctx, `✓  ${c}`, {
              tamanho: story ? 44 : 36,
              peso: 500,
              cor: "#ffffff",
              maxLinhas: 1,
              x: MARGEM,
              largura,
            }),
            espaco(10),
          ]),
          espaco(v("validade") ? 18 : 0),
          texto(ctx, v("validade"), {
            tamanho: story ? 36 : 30,
            peso: 600,
            cor: "#ffffffbb",
            maxLinhas: 1,
            x: MARGEM,
            largura,
          }),
        ],
        topo + 20,
        base - 50,
        story ? "centro" : "base",
      );
      break;
    }

    case "aviso": {
      ctx.fillStyle = cores.claro;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = cores.principal;
      ctx.fillRect(0, 0, 24, H);
      const topo = cabecalho(ctx, marca, true, cores);
      const base = rodape(ctx, marca, H, cores.escuro, "#ffffff");
      posicionar(
        [
          selo(ctx, "AVISO", { x: MARGEM, tamanho: story ? 44 : 38, fundo: cores.principal, cor: "#ffffff" }),
          espaco(34),
          texto(ctx, v("titulo"), {
            tamanho: story ? 110 : 92,
            peso: 800,
            cor: cores.escuro,
            maxLinhas: 3,
            x: MARGEM,
            largura,
            altura: 1.05,
          }),
          espaco(30),
          texto(ctx, v("texto"), {
            tamanho: story ? 48 : 40,
            cor: "#334155",
            maxLinhas: story ? 7 : 5,
            x: MARGEM,
            largura,
            altura: 1.35,
          }),
          espaco(v("data") ? 40 : 0),
          selo(ctx, v("data"), { x: MARGEM, tamanho: story ? 38 : 32, fundo: cores.claro2, cor: cores.forte }),
        ],
        topo,
        base - 40,
        "centro",
      );
      break;
    }

    case "dica": {
      degrade(ctx, 0, H, cores.forte, cores.escuro, W, H);
      ctx.save();
      ctx.font = `800 ${story ? 560 : 440}px Georgia, serif`;
      ctx.fillStyle = "#ffffff14";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText("“", W - 30, story ? 120 : 60);
      ctx.restore();
      const topo = cabecalho(ctx, marca, false, cores);
      const base = rodape(ctx, marca, H, cores.principal, "#ffffff");
      posicionar(
        [
          selo(ctx, (v("titulo") || "Dica de trânsito").toUpperCase(), {
            x: MARGEM,
            tamanho: story ? 40 : 34,
            fundo: "#ffffff",
            cor: cores.forte,
          }),
          espaco(44),
          texto(ctx, v("dica"), {
            tamanho: story ? 76 : 62,
            minimo: 38,
            peso: 700,
            cor: "#ffffff",
            maxLinhas: story ? 9 : 6,
            x: MARGEM,
            largura,
            altura: 1.22,
          }),
        ],
        topo,
        base - 30,
        "centro",
      );
      break;
    }

    case "curso": {
      degrade(ctx, 0, H, cores.escuro2, cores.escuro, W, H);
      ctx.fillStyle = cores.principal;
      ctx.beginPath();
      ctx.arc(W + 60, story ? H * 0.2 : H * 0.12, story ? 380 : 300, 0, Math.PI * 2);
      ctx.fill();
      const topo = cabecalho(ctx, marca, false, cores);
      const base = rodape(ctx, marca, H, cores.principal, "#ffffff");
      const info = [
        ["INÍCIO", v("inicio")],
        ["HORÁRIO", v("horario")],
      ].filter(([, valor]) => valor);
      posicionar(
        [
          selo(ctx, "NOVA TURMA", { x: MARGEM, tamanho: story ? 40 : 34, fundo: cores.principal, cor: "#ffffff" }),
          espaco(30),
          texto(ctx, v("curso"), {
            tamanho: story ? 120 : 100,
            peso: 800,
            cor: "#ffffff",
            maxLinhas: 3,
            x: MARGEM,
            largura,
            altura: 1.02,
          }),
          espaco(info.length ? 50 : 0),
          ...info.flatMap(([rotulo, valor]) => [
            texto(ctx, rotulo, {
              tamanho: story ? 30 : 26,
              peso: 700,
              cor: cores.destaque,
              maxLinhas: 1,
              x: MARGEM,
              largura,
            }),
            espaco(4),
            texto(ctx, valor, {
              tamanho: story ? 64 : 54,
              peso: 700,
              cor: "#ffffff",
              maxLinhas: 1,
              x: MARGEM,
              largura,
            }),
            espaco(26),
          ]),
          espaco(v("detalhes") ? 10 : 0),
          texto(ctx, v("detalhes"), {
            tamanho: story ? 40 : 34,
            peso: 500,
            cor: "#ffffffcc",
            maxLinhas: 2,
            x: MARGEM,
            largura,
          }),
        ],
        topo,
        base - 50,
        story ? "centro" : "base",
      );
      break;
    }

    case "depoimento": {
      ctx.fillStyle = cores.claro;
      ctx.fillRect(0, 0, W, H);
      const topo = cabecalho(ctx, marca, true, cores);
      const base = rodape(ctx, marca, H, cores.principal, "#ffffff");
      const r = story ? 130 : 96;
      const blocos: Bloco[] = [
        texto(ctx, "★★★★★", {
          tamanho: story ? 64 : 52,
          cor: cores.principal,
          maxLinhas: 1,
          x: MARGEM,
          largura,
          alinhar: "center",
        }),
        espaco(30),
        texto(ctx, `“${v("depoimento")}”`, {
          tamanho: story ? 66 : 54,
          minimo: 34,
          peso: 600,
          cor: cores.escuro,
          maxLinhas: story ? 9 : 6,
          x: MARGEM,
          largura,
          alinhar: "center",
          altura: 1.28,
        }),
        espaco(46),
      ];
      if (foto) {
        blocos.push({ h: r * 2 + 24, desenhar: (y) => circuloFoto(ctx, foto, W / 2, y + r, r, cores.principal) });
      }
      blocos.push(
        texto(ctx, v("nome"), {
          tamanho: story ? 50 : 42,
          peso: 800,
          cor: cores.escuro,
          maxLinhas: 1,
          x: MARGEM,
          largura,
          alinhar: "center",
        }),
        espaco(6),
        texto(ctx, v("categoria") ? `Habilitado(a) na categoria ${v("categoria").toUpperCase()}` : "", {
          tamanho: story ? 36 : 30,
          cor: "#475569",
          maxLinhas: 1,
          x: MARGEM,
          largura,
          alinhar: "center",
        }),
      );
      posicionar(blocos, topo, base - 30, "centro");
      break;
    }
  }
}
