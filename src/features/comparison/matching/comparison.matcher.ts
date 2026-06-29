/**
 * Matcher — para cada veículo do estoque, escolhe o melhor candidato
 * dentre os veículos do concorrente. Também identifica oportunidades
 * (concorrente tem / eu não) e diferenciais (eu tenho / concorrente não).
 */
import type {
  CompetitorVehicle,
  MatchStatus,
  MyVehicle,
  ScoreBreakdown,
} from "../types/comparison.types";
import { computeScore } from "./comparison.score";

// Match Score mínimo para considerar par. Abaixo disto, o veículo é
// classificado como "Revisão Necessária" (regra estrita do PCM).
const MATCH_THRESHOLD = 80;

export function statusFromScore(total: number): MatchStatus {
  if (total >= 100) return "perfect";
  if (total >= 95) return "partial";
  if (total >= MATCH_THRESHOLD) return "review";
  return "none";
}

export interface MatchPair {
  myVehicle: MyVehicle;
  competitorVehicle: CompetitorVehicle;
  score: ScoreBreakdown;
  status: MatchStatus;
}

export function bestMatchFor(
  me: MyVehicle,
  pool: CompetitorVehicle[],
): { competitor: CompetitorVehicle; score: ScoreBreakdown } | null {
  let best: { competitor: CompetitorVehicle; score: ScoreBreakdown } | null = null;
  for (const c of pool) {
    const score = computeScore(me, c);
    if (!best || score.total > best.score.total) {
      best = { competitor: c, score };
    }
  }
  if (!best || best.score.total < MATCH_THRESHOLD) return null;
  return best;
}

export interface MatchingResult {
  matches: MatchPair[];
  /** veículos do estoque sem correspondência razoável */
  unmatchedMine: MyVehicle[];
  /** veículos do concorrente que não foram pareados a nenhum do estoque */
  opportunities: CompetitorVehicle[];
}

export function matchInventoryAgainstCompetitor(
  mine: MyVehicle[],
  competitor: CompetitorVehicle[],
): MatchingResult {
  const matches: MatchPair[] = [];
  const unmatchedMine: MyVehicle[] = [];
  const usedCompetitor = new Set<string>();

  for (const me of mine) {
    const best = bestMatchFor(me, competitor);
    if (best) {
      matches.push({
        myVehicle: me,
        competitorVehicle: best.competitor,
        score: best.score,
        status: statusFromScore(best.score.total),
      });
      usedCompetitor.add(best.competitor.id);
    } else {
      unmatchedMine.push(me);
    }
  }

  const opportunities = competitor.filter((c) => !usedCompetitor.has(c.id));
  return { matches, unmatchedMine, opportunities };
}
