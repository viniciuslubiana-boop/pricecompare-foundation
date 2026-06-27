import {
  locatorRepository,
  type CompetitorSourceUrls,
  type LocatorCompetitorInsert,
} from "./locator.repository";
import type { PlaceResult } from "./places.functions";
import type { Competitor } from "@/types/database.types";

export type DuplicateReason = "place_id" | "phone" | "name_address";

export type RegisterPlaceResult =
  | { kind: "duplicate"; competitor: Competitor; reason: DuplicateReason }
  | { kind: "created"; competitor: Competitor };

function normalizeUrl(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export const locatorService = {
  async detectDuplicate(place: PlaceResult): Promise<
    | { reason: DuplicateReason; competitor: Competitor }
    | null
  > {
    const byPlace = await locatorRepository.findByPlaceId(place.placeId);
    if (byPlace) return { reason: "place_id", competitor: byPlace };

    if (place.phone) {
      const byPhone = await locatorRepository.findByPhone(place.phone);
      if (byPhone) return { reason: "phone", competitor: byPhone };
    }

    if (place.name && place.address) {
      const byNa = await locatorRepository.findByNameAndAddress(place.name, place.address);
      if (byNa) return { reason: "name_address", competitor: byNa };
    }

    return null;
  },

  async registerPlace(
    place: PlaceResult,
    cityFallback: string,
    stateFallback: string,
    userId: string,
  ): Promise<RegisterPlaceResult> {
    const dup = await locatorService.detectDuplicate(place);
    if (dup) return { kind: "duplicate", competitor: dup.competitor, reason: dup.reason };

    const payload: LocatorCompetitorInsert = {
      name: place.name.trim(),
      url: normalizeUrl(place.website),
      address: place.address || null,
      city: cityFallback || null,
      state: stateFallback || null,
      phone: place.phone,
      latitude: place.latitude,
      longitude: place.longitude,
      google_place_id: place.placeId,
      created_by: userId,
    };

    const created = await locatorRepository.insert(payload);
    return { kind: "created", competitor: created };
  },

  updateSources(id: string, sources: CompetitorSourceUrls) {
    return locatorRepository.updateSources(id, sources);
  },
};

export type { CompetitorSourceUrls };
