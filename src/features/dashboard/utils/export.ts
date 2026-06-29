import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { DashboardFilters } from "../preferences/types";

interface DashboardSummary {
  summary: {
    totalMyVehicles: number;
    totalCompetitors: number;
    totalCompetitorVehicles: number;
    totalComparisons: number;
    differentials: number;
    opportunities: number;
  };
  comparison: {
    meCheaper: number;
    competitorCheaper: number;
    ties: number;
    unmatched: number;
    totalSavings: number | null;
  };
  competitiveness: { percent: number | null; level: string };
  market: { avgPriceDiff: number | null };
}

function filtersDescription(filters: DashboardFilters, baseCompanyId: string | null): string[] {
  const lines = [
    `Empresa Base: ${baseCompanyId ?? "Todas"}`,
    `Período: ${filters.period}`,
  ];
  if (filters.brand) lines.push(`Marca: ${filters.brand}`);
  if (filters.model) lines.push(`Modelo: ${filters.model}`);
  if (filters.competitorId) lines.push(`Concorrente: ${filters.competitorId}`);
  if (filters.city) lines.push(`Cidade: ${filters.city}`);
  if (filters.state) lines.push(`UF: ${filters.state}`);
  return lines;
}

function rowsFromSummary(data: DashboardSummary): [string, string | number][] {
  return [
    ["Veículos monitorados", data.summary.totalMyVehicles],
    ["Concorrentes monitorados", data.summary.totalCompetitors],
    ["Veículos da concorrência", data.summary.totalCompetitorVehicles],
    ["Comparações", data.summary.totalComparisons],
    ["Diferenciais (você mais barato)", data.summary.differentials],
    ["Oportunidades (concorrente mais barato)", data.summary.opportunities],
    ["Competitividade %", data.competitiveness.percent ?? "—"],
    ["Você mais barato", data.comparison.meCheaper],
    ["Concorrente mais barato", data.comparison.competitorCheaper],
    ["Empates", data.comparison.ties],
    ["Sem correspondência", data.comparison.unmatched],
    [
      "Economia total (R$)",
      data.comparison.totalSavings ?? "—",
    ],
    [
      "Δ médio (R$)",
      data.market.avgPriceDiff ?? "—",
    ],
  ];
}

export function exportDashboardToPDF(
  data: DashboardSummary,
  filters: DashboardFilters,
  baseCompanyId: string | null,
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Dashboard Executivo · PriceCompare", 14, 18);
  doc.setFontSize(9);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 24);

  const desc = filtersDescription(filters, baseCompanyId);
  doc.setFontSize(10);
  desc.forEach((line, i) => doc.text(line, 14, 32 + i * 5));

  autoTable(doc, {
    startY: 32 + desc.length * 5 + 4,
    head: [["Indicador", "Valor"]],
    body: rowsFromSummary(data).map(([k, v]) => [k, String(v)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [249, 115, 22] },
  });

  doc.save(`pcm-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportDashboardToExcel(
  data: DashboardSummary,
  filters: DashboardFilters,
  baseCompanyId: string | null,
) {
  const wb = XLSX.utils.book_new();

  const filtersSheet = XLSX.utils.aoa_to_sheet([
    ["Dashboard Executivo · PriceCompare"],
    [`Gerado em ${new Date().toLocaleString("pt-BR")}`],
    [],
    ...filtersDescription(filters, baseCompanyId).map((l) => [l]),
  ]);
  XLSX.utils.book_append_sheet(wb, filtersSheet, "Filtros");

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Indicador", "Valor"],
    ...rowsFromSummary(data),
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Indicadores");

  XLSX.writeFile(wb, `pcm-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
