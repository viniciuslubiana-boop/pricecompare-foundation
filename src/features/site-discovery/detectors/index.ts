import type { ISiteDetector } from "../interfaces/ISiteDetector";
import type { DetectionMatch, SiteFetchResult } from "../types";

function has(html: string, needle: RegExp | string): boolean {
  return typeof needle === "string" ? html.includes(needle) : needle.test(html);
}

function header(input: SiteFetchResult, key: string): string {
  return input.headers[key.toLowerCase()] ?? "";
}

const revendaMais: ISiteDetector = {
  name: "RevendaMais",
  detect(i) {
    if (has(i.html, /revendamais/i) || has(i.html, /cdn\.revendamais/i)) {
      return {
        technology: "RevendaMais",
        confidence: 95,
        htmlSignature: { match: "revendamais" },
      };
    }
    return null;
  },
};

const dealerSites: ISiteDetector = {
  name: "DealerSites",
  detect(i) {
    if (has(i.html, /dealersites/i) || has(i.html, /dealer-sites/i)) {
      return {
        technology: "DealerSites",
        confidence: 95,
        htmlSignature: { match: "dealersites" },
      };
    }
    return null;
  },
};

const shopify: ISiteDetector = {
  name: "Shopify",
  detect(i) {
    if (
      has(i.html, /cdn\.shopify\.com/i) ||
      has(i.html, /Shopify\.theme/) ||
      header(i, "x-shopify-stage") !== ""
    ) {
      return { technology: "Shopify", confidence: 95 };
    }
    return null;
  },
};

const wordpress: ISiteDetector = {
  name: "WordPress",
  detect(i) {
    if (
      has(i.html, /\/wp-content\//) ||
      has(i.html, /\/wp-includes\//) ||
      has(i.html, /<meta[^>]+name=["']generator["'][^>]+WordPress/i)
    ) {
      return { technology: "WordPress", confidence: 90 };
    }
    return null;
  },
};

const nextjs: ISiteDetector = {
  name: "Next.js",
  detect(i) {
    if (
      has(i.html, /id=["']__next["']/) ||
      has(i.html, /\/_next\/static\//) ||
      header(i, "x-powered-by").toLowerCase().includes("next")
    ) {
      return { technology: "Next.js", confidence: 90 };
    }
    return null;
  },
};

const react: ISiteDetector = {
  name: "React",
  detect(i) {
    if (
      has(i.html, /data-reactroot/) ||
      has(i.html, /id=["']root["'][^>]*><\/div>/) ||
      has(i.html, /react(?:-dom)?(?:\.production)?(?:\.min)?\.js/)
    ) {
      return { technology: "React", confidence: 75 };
    }
    return null;
  },
};

const vue: ISiteDetector = {
  name: "Vue",
  detect(i) {
    if (
      has(i.html, /id=["']app["'][^>]*><\/div>/) && has(i.html, /vue(?:\.runtime)?(?:\.min)?\.js/i)
    ) {
      return { technology: "Vue", confidence: 80 };
    }
    if (has(i.html, /__VUE__/) || has(i.html, /data-v-[0-9a-f]{8}/)) {
      return { technology: "Vue", confidence: 70 };
    }
    return null;
  },
};

const angular: ISiteDetector = {
  name: "Angular",
  detect(i) {
    if (
      has(i.html, /ng-version=/) ||
      has(i.html, /<app-root/i) ||
      has(i.html, /angular(?:\.min)?\.js/i)
    ) {
      return { technology: "Angular", confidence: 85 };
    }
    return null;
  },
};

const laravel: ISiteDetector = {
  name: "Laravel",
  detect(i) {
    if (
      header(i, "set-cookie").includes("laravel_session") ||
      header(i, "set-cookie").toLowerCase().includes("xsrf-token")
    ) {
      return { technology: "Laravel", confidence: 85 };
    }
    return null;
  },
};

const aspNet: ISiteDetector = {
  name: "ASP.NET",
  detect(i) {
    if (
      header(i, "x-powered-by").toLowerCase().includes("asp.net") ||
      header(i, "x-aspnet-version") !== "" ||
      has(i.html, /__VIEWSTATE/)
    ) {
      return { technology: "ASP.NET", confidence: 90 };
    }
    return null;
  },
};

const php: ISiteDetector = {
  name: "PHP",
  detect(i) {
    if (
      header(i, "x-powered-by").toLowerCase().includes("php") ||
      header(i, "set-cookie").toUpperCase().includes("PHPSESSID")
    ) {
      return { technology: "PHP", confidence: 80 };
    }
    return null;
  },
};

export const detectors: ISiteDetector[] = [
  revendaMais,
  dealerSites,
  shopify,
  wordpress,
  nextjs,
  angular,
  vue,
  react,
  laravel,
  aspNet,
  php,
];

export function runDetectors(input: SiteFetchResult): DetectionMatch {
  const matches: DetectionMatch[] = [];
  for (const d of detectors) {
    const m = d.detect(input);
    if (m) matches.push(m);
  }
  if (matches.length === 0) {
    // Sites com HTML mínimo + muito JS sugerem plataforma própria/SPA.
    if (input.html.length > 0 && input.html.length < 2000) {
      return {
        technology: "Plataforma Própria",
        confidence: 40,
        htmlSignature: { reason: "html-minimo" },
      };
    }
    return { technology: "Desconhecida", confidence: 0 };
  }
  matches.sort((a, b) => b.confidence - a.confidence);
  const best = matches[0];
  return {
    ...best,
    frameworkSignature: {
      candidates: matches.map((m) => ({
        technology: m.technology,
        confidence: m.confidence,
      })),
    },
  };
}
