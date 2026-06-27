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
  { title: "Extrair Concorrente", url: "/extrair-concorrente", icon: Download },
  { title: "Comparar", url: "/comparar", icon: GitCompareArrows },
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Administração", url: "/administracao", icon: ShieldCheck },
];

