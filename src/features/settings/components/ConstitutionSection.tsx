import { useMemo, useState } from "react";
import { BookOpen, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Carrega todos os documentos da Constituição Oficial PCM v2.0 como texto bruto.
const rawDocs = import.meta.glob("/docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

type DocEntry = {
  id: string;
  title: string;
  description: string;
  content: string;
  order: number;
};

const META: Record<string, { title: string; description: string; order: number }> = {
  "README.md": { title: "Índice da Constituição", description: "Visão geral e processo obrigatório", order: 0 },
  "PCM_MASTER_ARCHITECTURE.md": { title: "Master Architecture", description: "Arquitetura oficial, camadas e stack", order: 1 },
  "PCM_PRODUCT_VISION.md": { title: "Visão do Produto", description: "Missão, escopo e o que o PCM não é", order: 2 },
  "PCM_BUSINESS_RULES.md": { title: "Regras de Negócio", description: "Empresas Base, concorrentes e comparação", order: 3 },
  "PCM_ENGINES.md": { title: "Engines Oficiais", description: "Inventory, Competitor, Extraction, Comparison, Analytics", order: 4 },
  "PCM_DASHBOARD.md": { title: "Dashboard Executivo", description: "Centro de Inteligência de Mercado", order: 5 },
  "PCM_DATABASE.md": { title: "Banco de Dados", description: "Tabelas, RLS, funções e padrões", order: 6 },
  "PCM_SECURITY.md": { title: "Segurança", description: "RLS, RBAC, segredos e SSRF", order: 7 },
  "PCM_INTEGRATIONS.md": { title: "Integrações", description: "APIs externas, Firecrawl, Maps, AI Gateway", order: 8 },
  "PCM_API_GUIDE.md": { title: "Guia de API", description: "Requisitos para novas integrações", order: 9 },
  "PCM_DEVELOPMENT_GUIDE.md": { title: "Guia de Desenvolvimento", description: "Padrões de código e convenções", order: 10 },
  "PCM_ROADMAP.md": { title: "Roadmap", description: "Versões 1.1, 2.0 e Enterprise", order: 11 },
  "PCM_CHANGELOG.md": { title: "Changelog", description: "Histórico de alterações", order: 12 },
};

export function ConstitutionSection() {
  const docs = useMemo<DocEntry[]>(() => {
    return Object.entries(rawDocs)
      .map(([path, content]) => {
        const fileName = path.split("/").pop() ?? path;
        const meta = META[fileName] ?? { title: fileName, description: "", order: 999 };
        return { id: fileName, content, ...meta };
      })
      .sort((a, b) => a.order - b.order);
  }, []);

  const [activeId, setActiveId] = useState<string>(docs[0]?.id ?? "");
  const active = docs.find((d) => d.id === activeId) ?? docs[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Constituição Oficial PCM
          <Badge variant="secondary" className="ml-2">v2.0</Badge>
        </CardTitle>
        <CardDescription>
          Documentação permanente do projeto. Toda implementação, correção ou
          melhoria deve respeitar estes documentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <div className="space-y-1">
            {docs.map((doc) => (
              <Button
                key={doc.id}
                variant={doc.id === activeId ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => setActiveId(doc.id)}
              >
                <FileText className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex flex-col items-start">
                  <span className="text-sm font-medium">{doc.title}</span>
                  {doc.description && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {doc.description}
                    </span>
                  )}
                </span>
              </Button>
            ))}
          </div>
          <div className="rounded-md border bg-muted/30">
            <ScrollArea className="h-[600px]">
              <pre className="whitespace-pre-wrap break-words p-4 text-sm font-mono leading-relaxed text-foreground">
                {active?.content ?? "Documento não encontrado."}
              </pre>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
