import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Search, ExternalLink, Loader2, Plus, Ban, Settings2, Star } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import {
  searchNearbyCompetitors,
  type PlaceResult,
} from "@/features/competitors/services/places.functions";
import { locatorService } from "@/features/competitors/services/locator.service";
import { SourcesDialog } from "@/features/competitors/components/SourcesDialog";
import type { Competitor } from "@/types/database.types";

const KEYWORD_SUGGESTIONS = [
  "loja de veículos",
  "revenda de veículos",
  "seminovos",
  "carros usados",
  "concessionária",
  "motos usadas",
];

type RowState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "duplicate"; reason: "place_id" | "phone" | "name_address" }
  | { status: "ignored" }
  | { status: "registered"; competitor: Competitor };

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function LocalizarConcorrentesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const runSearch = useServerFn(searchNearbyCompetitors);

  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [keyword, setKeyword] = useState("revenda de veículos");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);

  const [sourcesFor, setSourcesFor] = useState<Competitor | null>(null);

  const setRow = (placeId: string, s: RowState) =>
    setRowStates((prev) => ({ ...prev, [placeId]: s }));

  const handleSearch = async () => {
    if (!city.trim() || !state.trim() || !keyword.trim()) {
      toast.error("Preencha cidade, estado e palavra-chave.");
      return;
    }
    setLoading(true);
    setResults([]);
    setRowStates({});
    setSearchCenter(null);
    try {
      const { results: r } = await runSearch({
        data: { city: city.trim(), state: state.trim(), radiusKm, keyword: keyword.trim() },
      });
      setResults(r);
      const valid = r.filter((p) => p.latitude != null && p.longitude != null);
      if (valid.length > 0) {
        const avgLat =
          valid.reduce((s, p) => s + (p.latitude ?? 0), 0) / valid.length;
        const avgLng =
          valid.reduce((s, p) => s + (p.longitude ?? 0), 0) / valid.length;
        setSearchCenter({ lat: avgLat, lng: avgLng });
      }
      if (r.length === 0) toast.info("Nenhum estabelecimento encontrado.");
    } catch (e) {
      toast.error("Erro na busca", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (place: PlaceResult) => {
    if (!user) {
      toast.error("Sessão expirada");
      return;
    }
    setRow(place.placeId, { status: "saving" });
    try {
      const out = await locatorService.registerPlace(place, city, state, user.id);
      if (out.kind === "duplicate") {
        setRow(place.placeId, { status: "duplicate", reason: out.reason });
        toast.warning(`Já cadastrado: ${out.competitor.name}`);
      } else {
        setRow(place.placeId, { status: "registered", competitor: out.competitor });
        toast.success("Concorrente cadastrado", {
          action: {
            label: "Configurar fontes",
            onClick: () => setSourcesFor(out.competitor),
          },
        });
        qc.invalidateQueries({ queryKey: ["competitors"] });
      }
    } catch (e) {
      setRow(place.placeId, { status: "idle" });
      toast.error("Erro ao cadastrar", { description: (e as Error).message });
    }
  };

  const distance = (p: PlaceResult): number | null => {
    if (!searchCenter || p.latitude == null || p.longitude == null) return null;
    return haversineKm(searchCenter.lat, searchCenter.lng, p.latitude, p.longitude);
  };

  return (
    <div>
      <PageHeader
        title="Localizar Concorrentes"
        description="Descubra revendas e concessionárias próximas via Google Maps e cadastre como concorrentes."
      />

      <Card className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label>Cidade</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" />
          </div>
          <div className="space-y-1">
            <Label>Estado (UF)</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="SP" maxLength={20} />
          </div>
          <div className="space-y-1">
            <Label>Raio (km)</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <Label>Palavra-chave</Label>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {KEYWORD_SUGGESTIONS.map((k) => (
            <Badge
              key={k}
              variant={keyword === k ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setKeyword(k)}
            >
              {k}
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar concorrentes
          </Button>
        </div>
      </Card>

      {results.length === 0 && !loading ? (
        <EmptyState
          icon={MapPin}
          title="Nenhuma busca realizada"
          description="Preencha os filtros acima e clique em Buscar para localizar lojas próximas."
        />
      ) : null}

      {results.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="w-[130px]">Telefone</TableHead>
                <TableHead className="w-[110px]">Site</TableHead>
                <TableHead className="w-[110px]">Avaliação</TableHead>
                <TableHead className="w-[90px]">Distância</TableHead>
                <TableHead className="w-[260px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((p) => {
                const st = rowStates[p.placeId] ?? { status: "idle" };
                const d = distance(p);
                return (
                  <TableRow key={p.placeId}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.address || "—"}</TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell>
                      {p.website ? (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Site <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">sem site</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.rating != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {p.rating.toFixed(1)}
                          {p.userRatingCount ? (
                            <span className="text-muted-foreground text-xs">
                              ({p.userRatingCount})
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{d != null ? `${d.toFixed(1)} km` : "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          title="Abrir no Google Maps"
                        >
                          <a href={p.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                            <MapPin className="h-4 w-4" />
                          </a>
                        </Button>
                        {st.status === "registered" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSourcesFor(st.competitor)}
                          >
                            <Settings2 className="h-4 w-4" /> Fontes
                          </Button>
                        ) : st.status === "duplicate" ? (
                          <Badge variant="secondary">Já cadastrado</Badge>
                        ) : st.status === "ignored" ? (
                          <Badge variant="outline">Ignorado</Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleRegister(p)}
                              disabled={st.status === "saving"}
                            >
                              {st.status === "saving" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              Cadastrar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRow(p.placeId, { status: "ignored" })}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : null}

      <SourcesDialog
        open={!!sourcesFor}
        onOpenChange={(o) => !o && setSourcesFor(null)}
        competitor={sourcesFor}
        onSaved={() => qc.invalidateQueries({ queryKey: ["competitors"] })}
      />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/localizar-concorrentes")({
  head: () => ({ meta: [{ title: "Localizar Concorrentes · PriceCompare" }] }),
  component: LocalizarConcorrentesPage,
});
