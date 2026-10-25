import {
  Building2,
  Ellipsis,
  Fuel,
  HandCoins,
  Landmark,
  PiggyBank,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Ícone de cada tipo de despesa (importado direto pelos componentes de cliente).
export const ICONES_DESPESA: Record<string, LucideIcon> = {
  folha: Users,
  vale: HandCoins,
  combustivel: Fuel,
  retirada: PiggyBank,
  aluguel: Building2,
  contas: Zap,
  impostos: Landmark,
  outras: Ellipsis,
  manutencao: Wrench,
};
