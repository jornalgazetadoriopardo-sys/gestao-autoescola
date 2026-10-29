import "server-only";
import QRCode from "qrcode";
import { cpfValido } from "./format";

// QR Code de Pix "copia e cola" (BR Code estático do Banco Central): o aluno
// aponta a câmera do app do banco e já aparecem a chave, o nome e, quando
// informado, o valor. A chave continua escrita ao lado, como antes.

// A chave como o Pix espera: telefone com +55, CPF/CNPJ só números, e-mail em minúsculas.
export function normalizarChave(chave: string) {
  const c = chave.trim();
  if (c.includes("@")) return c.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)) return c.toLowerCase();
  const digitos = c.replace(/\D/g, "");
  if (c.startsWith("+")) return `+${digitos}`;
  if (digitos.length === 14) return digitos; // CNPJ
  if (digitos.length === 11 && cpfValido(digitos) && !/[()]/.test(c)) return digitos; // CPF
  if (digitos.length === 10 || digitos.length === 11) return `+55${digitos}`; // telefone com DDD
  if (digitos.length === 13 && digitos.startsWith("55")) return `+${digitos}`;
  return c;
}

// Nome e cidade no formato do BR Code: sem acentos, maiúsculas e tamanho limitado.
function limpar(texto: string, max: number) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, max);
}

const campo = (id: string, valor: string) => `${id}${String(valor.length).padStart(2, "0")}${valor}`;

// CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido no fim do código.
function crc16(texto: string) {
  let crc = 0xffff;
  for (const byte of Buffer.from(texto, "utf8")) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function codigoPix({
  chave,
  nome,
  cidade,
  valorCentavos,
  identificador = "***",
}: {
  chave: string;
  nome: string;
  cidade?: string | null;
  valorCentavos?: number | null;
  identificador?: string;
}) {
  const conta = campo("00", "br.gov.bcb.pix") + campo("01", normalizarChave(chave));
  const corpo =
    campo("00", "01") +
    campo("26", conta) +
    campo("52", "0000") +
    campo("53", "986") +
    (valorCentavos && valorCentavos > 0 ? campo("54", (valorCentavos / 100).toFixed(2)) : "") +
    campo("58", "BR") +
    campo("59", limpar(nome, 25) || "AUTOESCOLA") +
    campo("60", limpar(cidade ?? "", 15) || "BRASIL") +
    campo("62", campo("05", identificador.replace(/[^A-Za-z0-9*]/g, "").slice(0, 25) || "***"));
  const semCrc = `${corpo}6304`;
  return semCrc + crc16(semCrc);
}

// QR Code em SVG (fica nítido em qualquer impressora, inclusive a térmica).
export async function qrCodePix(dados: Parameters<typeof codigoPix>[0]) {
  return QRCode.toString(codigoPix(dados), { type: "svg", margin: 0, errorCorrectionLevel: "M" });
}
