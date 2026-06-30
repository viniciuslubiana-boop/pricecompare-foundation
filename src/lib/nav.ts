import {
  LayoutDashboard,
  Package,
  Upload,
  Users,
  
  GitCompareArrows,
  
  Settings,
  ShieldCheck,
  Activity,
  TrendingUp,
  Radio,
  Radar,
  Wallet,
  Search,
  MapPin,
  History,
  Stethoscope,
  Gauge,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Centro de Operações", url: "/operacoes", icon: Activity },
  { title: "Meu Estoque", url: "/meu-estoque", icon: Package },
  { title: "Importações", url: "/importacoes", icon: Upload },
  { title: "Concorrentes", url: "/concorrentes", icon: Users },
  { title: "Localizar Concorrentes", url: "/localizar-concorrentes", icon: MapPin },
  
  { title: "Diagnóstico de Extração", url: "/diagnostico-extracao", icon: Stethoscope },
  { title: "Consulta Global", url: "/consulta-mercado", icon: Search },
  { title: "Central de Consulta", url: "/central-consulta", icon: Search },
  { title: "Comparar", url: "/comparar", icon: GitCompareArrows },
  { title: "Estratégia de Preço", url: "/estrategia-preco", icon: Wallet },
  { title: "Alterações do Mercado", url: "/alteracoes-mercado", icon: TrendingUp },
  { title: "Monitor de Mercado", url: "/monitor-mercado", icon: Radar },
  { title: "Histórico de Mercado", url: "/historico-mercado", icon: History },
  { title: "Central de Movimentações", url: "/movimentacoes-mercado", icon: Radio },
  
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  
  { title: "Administração", url: "/administracao", icon: ShieldCheck, adminOnly: true },
];

