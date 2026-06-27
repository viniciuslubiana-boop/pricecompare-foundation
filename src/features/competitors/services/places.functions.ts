import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const searchSchema = z.object({
  city: z.string().trim().min(1, "Cidade obrigatória").max(120),
  state: z.string().trim().min(1, "Estado obrigatório").max(60),
  radiusKm: z.number().min(1).max(50),
  keyword: z.string().trim().min(1, "Palavra-chave obrigatória").max(120),
});

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  userRatingCount: number | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string;
  distanceKm: number | null;
};

export type SearchCenter = {
  latitude: number;
  longitude: number;
  formattedAddress: string | null;
} | null;


type PlacesApiResponse = {
  places?: Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    location?: { latitude?: number; longitude?: number };
    googleMapsUri?: string;
  }>;
  error?: { message?: string };
};

export const searchNearbyCompetitors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => searchSchema.parse(data))
  .handler(async ({ data }): Promise<{ results: PlaceResult[]; center: SearchCenter }> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !gmKey) {
      throw new Error("Credenciais do Google Maps não configuradas.");
    }

    // 1) Geocode da cidade/UF para obter centro real da busca
    const geoQuery = encodeURIComponent(`${data.city}, ${data.state}, Brasil`);
    const geoRes = await fetch(
      `${GATEWAY_URL}/maps/api/geocode/json?address=${geoQuery}&language=pt-BR&region=br`,
      {
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": gmKey,
        },
      },
    );

    let center: SearchCenter = null;
    if (geoRes.ok) {
      const geoJson = (await geoRes.json()) as {
        status?: string;
        results?: Array<{
          geometry?: { location?: { lat?: number; lng?: number } };
          formatted_address?: string;
        }>;
      };
      const first = geoJson.results?.[0];
      const loc = first?.geometry?.location;
      if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
        center = {
          latitude: loc.lat,
          longitude: loc.lng,
          formattedAddress: first?.formatted_address ?? null,
        };
      }
    }

    const textQuery = `${data.keyword} em ${data.city}, ${data.state}, Brasil`;
    const radiusMeters = Math.min(Math.round(data.radiusKm * 1000), 50000);

    const body = {
      textQuery,
      languageCode: "pt-BR",
      regionCode: "BR",
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: center
            ? { latitude: center.latitude, longitude: center.longitude }
            : { latitude: -14.235, longitude: -51.9253 },
          radius: radiusMeters,
        },
      },
    };

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.location,places.googleMapsUri",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Falha na busca de lugares (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as PlacesApiResponse;
    if (json.error) {
      throw new Error(json.error.message ?? "Erro do Google Places");
    }

    const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };

    const results: PlaceResult[] = (json.places ?? []).map((p) => {
      const lat = p.location?.latitude ?? null;
      const lng = p.location?.longitude ?? null;
      const distanceKm =
        center && lat != null && lng != null
          ? haversineKm(center.latitude, center.longitude, lat, lng)
          : null;
      return {
        placeId: p.id,
        name: p.displayName?.text ?? "Sem nome",
        address: p.formattedAddress ?? "",
        phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
        website: p.websiteUri ?? null,
        rating: typeof p.rating === "number" ? p.rating : null,
        userRatingCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
        latitude: lat,
        longitude: lng,
        googleMapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
        distanceKm,
      };
    });

    // Ordena por distância (sem distância vai para o fim)
    results.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    return { results, center };
  });

