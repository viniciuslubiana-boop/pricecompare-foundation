import type { DetectionMatch, SiteFetchResult } from "../types";

/**
 * ISiteDetector
 * Analisa o conteúdo bruto de um site (HTML, headers, robots, sitemap)
 * e retorna a tecnologia detectada com um nível de confiança.
 */
export interface ISiteDetector {
  readonly name: string;
  detect(input: SiteFetchResult): DetectionMatch | null;
}
