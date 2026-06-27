import {
  LayoutDashboard,
  Package,
  Upload,
  Users,
  Download,
  GitCompareArrows,
  FileBarChart,
  Settings,
  ShieldCheck,
  Activity,
  TrendingUp,
  Radio,
  Radar,
  Wallet,
  Search,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Centro de Operações", url: "/operacoes", icon: Activity },
  { title: "Meu Estoque", url: "/meu-estoque", icon: Package },
  { title: "Importações", url: "/importacoes", icon: Upload },
  { title: "Concorrentes", url: "/concorrentes", icon: Users },
  { title: "Localizar Concorrentes", url: "/localizar-concorrentes", icon: MapPin },
  { title: "Extrair Concorrente", url: "/extrair-concorrente", icon: Download },
  { title: "Consulta Global", url: "/consulta-mercado", icon: Search },
  { title: "Comparar", url: "/comparar", icon: GitCompareArrows },
  { title: "Estratégia de Preço", url: "/estrategia-preco", icon: Wallet },
  { title: "Alterações do Mercado", url: "/alteracoes-mercado", icon: TrendingUp },
  { title: "Monitor de Mercado", url: "/monitor-mercado", icon: Radar },
  { title: "Central de Movimentações", url: "/movimentacoes-mercado", icon: Radio },
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Administração", url: "/administracao", icon: ShieldCheck },
];

