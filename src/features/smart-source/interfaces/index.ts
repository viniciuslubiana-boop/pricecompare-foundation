import type { SourceCandidate, SourceProfileRow } from "../types";

/**
 * ISourceAnalyzer — produz candidatos de fonte para uma combinação tecnologia/URL.
 */
export interface ISourceAnalyzer {
  analyze(input: {
    technology: string;
    url: string;
    profiles: SourceProfileRow[];
  }): SourceCandidate[];
}

/**
 * ISourceValidator — confirma que um candidato é executável (sem extrair dados).
 * Nesta sprint, validadores apenas inspecionam a disponibilidade da fonte.
 */
export interface ISourceValidator {
  validate(candidate: SourceCandidate, url: string): Promise<boolean>;
}

/**
 * ISourceStrategy — combina seletor + paginação + parser de card para um método.
 * Esqueleto contratual; implementações concretas chegam em sprints futuras.
 */
export interface ISourceStrategy {
  readonly method: SourceCandidate["method"];
  describe(): { selector?: unknown; pagination?: unknown; card?: unknown };
}
