import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Building2, Loader2, Plug, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BaseCompaniesSection } from "@/features/base-companies/components/BaseCompaniesSection";
import { ApiIntegrationsSection } from "@/features/api-integrations/components/ApiIntegrationsSection";
import { ConstitutionSection } from "@/features/settings/components/ConstitutionSection";

import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import { useSettings, useSaveSettingsSection } from "@/features/settings/hooks/useSettings";
import {
  DEFAULT_SETTINGS,
  type AppSettingsBundle,
  type MarketSource,
} from "@/features/settings/types/settings.types";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · PriceCompare" }] }),
  component: SettingsPage,
});

const SOURCES: { value: MarketSource; label: string }[] = [
  { value: "site", label: "Site próprio" },
  { value: "olx", label: "OLX" },
  { value: "webmotors", label: "Webmotors" },
  { value: "mobiauto", label: "Mobiauto" },
  { value: "icarros", label: "iCarros" },
];

function SettingsPage() {
  const { data, isLoading } = useSettings();
  const bundle = data ?? DEFAULT_SETTINGS;

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Ajuste as preferências do sistema, comparação, mercado, importação e relatórios."
      />
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="base-companies" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="base-companies">
              <Building2 className="h-4 w-4 mr-1.5" /> Empresas Base
            </TabsTrigger>
            <TabsTrigger value="reference">
              <Store className="h-4 w-4 mr-1.5" /> Loja de Referência
            </TabsTrigger>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="comparison">Comparação</TabsTrigger>
            <TabsTrigger value="market">Mercado</TabsTrigger>
            <TabsTrigger value="imports">Importação</TabsTrigger>
            <TabsTrigger value="api">
              <Plug className="h-4 w-4 mr-1.5" /> Integração por API
            </TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>


          <TabsContent value="base-companies">
            <BaseCompaniesSection />
          </TabsContent>
          <TabsContent value="reference">
            <ReferenceStoreSection value={bundle.referenceStore} />
          </TabsContent>
          <TabsContent value="general">
            <GeneralSection value={bundle.general} />
          </TabsContent>
          <TabsContent value="comparison">
            <ComparisonSection value={bundle.comparison} />
          </TabsContent>
          <TabsContent value="market">
            <MarketSection value={bundle.market} />
          </TabsContent>
          <TabsContent value="imports">
            <ImportsSection value={bundle.imports} />
          </TabsContent>
          <TabsContent value="api">
            <ApiIntegrationsSection />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsSection value={bundle.reports} />
          </TabsContent>

        </Tabs>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  onSave,
  saving,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <Separator />
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GeneralSection({ value }: { value: AppSettingsBundle["general"] }) {
  const save = useSaveSettingsSection("general");
  const [v, setV] = useState(value);
  const { setTheme } = useTheme();
  useEffect(() => setV(value), [value]);

  return (
    <SectionCard
      title="Configurações Gerais"
      description="Identificação da empresa e preferências de exibição."
      saving={save.isPending}
      onSave={() => {
        setTheme(v.theme);
        save.mutate(v);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome da empresa</Label>
          <Input value={v.companyName} onChange={(e) => setV({ ...v, companyName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Moeda padrão</Label>
          <Input value="BRL" disabled />
        </div>
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Input value={v.state} onChange={(e) => setV({ ...v, state: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Tema</Label>
          <Select value={v.theme} onValueChange={(val) => setV({ ...v, theme: val as typeof v.theme })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SectionCard>
  );
}

function ComparisonSection({ value }: { value: AppSettingsBundle["comparison"] }) {
  const save = useSaveSettingsSection("comparison");
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);

  return (
    <SectionCard
      title="Configurações de Comparação"
      description="Tolerâncias e regras usadas pelo motor de comparação."
      saving={save.isPending}
      onSave={() => save.mutate(v)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Compatibilidade mínima (%)</Label>
          <Input
            type="number"
            value={v.minCompatibility}
            onChange={(e) => setV({ ...v, minCompatibility: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Tolerância de ano (anos)</Label>
          <Input
            type="number"
            value={v.yearTolerance}
            onChange={(e) => setV({ ...v, yearTolerance: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Tolerância de KM</Label>
          <Input
            type="number"
            value={v.kmTolerance}
            onChange={(e) => setV({ ...v, kmTolerance: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Tolerância de preço (%)</Label>
          <Input
            type="number"
            value={v.priceTolerance}
            onChange={(e) => setV({ ...v, priceTolerance: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label>Considerar somente o mesmo ano</Label>
          <p className="text-xs text-muted-foreground">Ignora veículos fora do ano exato.</p>
        </div>
        <Switch checked={v.sameYearOnly} onCheckedChange={(c) => setV({ ...v, sameYearOnly: c })} />
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label>Considerar versão no matching</Label>
          <p className="text-xs text-muted-foreground">Compara versões específicas do veículo.</p>
        </div>
        <Switch
          checked={v.considerVersion}
          onCheckedChange={(c) => setV({ ...v, considerVersion: c })}
        />
      </div>
    </SectionCard>
  );
}

function MarketSection({ value }: { value: AppSettingsBundle["market"] }) {
  const save = useSaveSettingsSection("market");
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);

  function toggleSource(s: MarketSource, checked: boolean) {
    setV((prev) => ({
      ...prev,
      sources: checked ? [...new Set([...prev.sources, s])] : prev.sources.filter((x) => x !== s),
    }));
  }

  return (
    <SectionCard
      title="Configurações de Mercado"
      description="Raio padrão e fontes consideradas na busca de concorrentes."
      saving={save.isPending}
      onSave={() => save.mutate(v)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Raio padrão (km)</Label>
          <Input
            type="number"
            value={v.defaultRadiusKm}
            onChange={(e) => setV({ ...v, defaultRadiusKm: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Frequência de atualização</Label>
          <Select value={v.frequency} onValueChange={(val) => setV({ ...v, frequency: val as typeof v.frequency })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="daily">Diária</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Fontes padrão</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <label key={s.value} className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox
                checked={v.sources.includes(s.value)}
                onCheckedChange={(c) => toggleSource(s.value, Boolean(c))}
              />
              <span className="text-sm">{s.label}</span>
            </label>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function ImportsSection({ value }: { value: AppSettingsBundle["imports"] }) {
  const save = useSaveSettingsSection("imports");
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);

  return (
    <SectionCard
      title="Configurações de Importação"
      description="Comportamento padrão ao importar CSV/XLSX."
      saving={save.isPending}
      onSave={() => save.mutate(v)}
    >
      <div className="space-y-2">
        <Label>Tratamento de duplicados</Label>
        <Select
          value={v.duplicateStrategy}
          onValueChange={(val) => setV({ ...v, duplicateStrategy: val as typeof v.duplicateStrategy })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ignore">Ignorar duplicados</SelectItem>
            <SelectItem value="import">Importar duplicados</SelectItem>
            <SelectItem value="update">Atualizar existentes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Delimitador de CSV</Label>
        <Select
          value={v.csvDelimiter}
          onValueChange={(val) => setV({ ...v, csvDelimiter: val as typeof v.csvDelimiter })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detectar</SelectItem>
            <SelectItem value=",">Vírgula (,)</SelectItem>
            <SelectItem value=";">Ponto e vírgula (;)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label>Remover espaços em branco</Label>
          <p className="text-xs text-muted-foreground">Faz trim de valores ao importar.</p>
        </div>
        <Switch
          checked={v.trimWhitespace}
          onCheckedChange={(c) => setV({ ...v, trimWhitespace: c })}
        />
      </div>
    </SectionCard>
  );
}

function ReportsSection({ value }: { value: AppSettingsBundle["reports"] }) {
  const save = useSaveSettingsSection("reports");
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);

  const toggles: { key: keyof typeof v; label: string }[] = [
    { key: "showLogo", label: "Mostrar logo da empresa" },
    { key: "showDateTime", label: "Mostrar data/hora" },
    { key: "showCompetitors", label: "Mostrar concorrentes" },
    { key: "showPriceHistory", label: "Mostrar histórico de preços" },
    { key: "showListingLinks", label: "Mostrar links dos anúncios" },
  ];

  return (
    <SectionCard
      title="Configurações de Relatório"
      description="O que aparece nos relatórios gerados pelo PriceCompare."
      saving={save.isPending}
      onSave={() => save.mutate(v)}
    >
      <div className="space-y-2">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between rounded-md border p-3">
            <Label>{t.label}</Label>
            <Switch
              checked={v[t.key]}
              onCheckedChange={(c) => setV({ ...v, [t.key]: c })}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ReferenceStoreSection({ value }: { value: AppSettingsBundle["referenceStore"] }) {
  const { isAdmin, user } = useAuth();
  const save = useSaveSettingsSection("referenceStore");
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);

  const readOnly = !isAdmin;

  const handleSave = () => {
    save.mutate({
      ...v,
      // Garante singleton: ao salvar como ativo, esta passa a ser A loja de referência.
      active: true,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.id ?? null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" /> Loja de Referência
        </CardTitle>
        <CardDescription>
          Empresa base de TODAS as comparações do PCM. Apenas administradores podem alterar.
          Todo estoque importado é vinculado automaticamente a esta loja.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome da empresa</Label>
            <Input
              value={v.name}
              disabled={readOnly}
              onChange={(e) => setV({ ...v, name: e.target.value })}
              placeholder="Ex.: Uninova Veículos"
            />
          </div>
          <div className="space-y-2">
            <Label>Site</Label>
            <Input
              value={v.website}
              disabled={readOnly}
              onChange={(e) => setV({ ...v, website: e.target.value })}
              placeholder="https://uninova.com.br"
            />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              value={v.city}
              disabled={readOnly}
              onChange={(e) => setV({ ...v, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Input
              value={v.state}
              disabled={readOnly}
              onChange={(e) => setV({ ...v, state: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Logotipo (URL)</Label>
            <Input
              value={v.logoUrl}
              disabled={readOnly}
              onChange={(e) => setV({ ...v, logoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Estoque principal</Label>
            <Input
              value={v.mainStock}
              disabled={readOnly}
              onChange={(e) => setV({ ...v, mainStock: e.target.value })}
              placeholder="Ex.: Matriz / Filial 1"
            />
          </div>
        </div>

        {v.active && v.name && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
            <strong>{v.name}</strong> está ativa como Loja de Referência.
            {v.updatedAt && (
              <span className="text-muted-foreground">
                {" "}· Atualizada em {new Date(v.updatedAt).toLocaleString("pt-BR")}
              </span>
            )}
          </div>
        )}

        {readOnly ? (
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Somente administradores podem alterar a Loja de Referência. Você pode visualizar as informações.
          </div>
        ) : (
          <>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={save.isPending || !v.name.trim()}>
                {save.isPending ? "Salvando..." : "Definir como Loja de Referência"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
