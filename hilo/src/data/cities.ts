import raw from "./cities.json";

export type City = { name: string; country: string; tz: string; lat: number; lon: number };
export const CITIES: City[] = (raw as [string, string, string, number, number][]).map(([name, country, tz, lat, lon]) => ({ name, country, tz, lat, lon }));

export function findCity(name?: string | null): City | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();
  return CITIES.find((c) => c.name.toLowerCase() === n);
}

export function searchCities(q: string, limit = 8): City[] {
  const n = q.trim().toLowerCase();
  if (!n) return [];
  return CITIES.filter((c) => c.name.toLowerCase().startsWith(n)).concat(CITIES.filter((c) => !c.name.toLowerCase().startsWith(n) && c.name.toLowerCase().includes(n))).slice(0, limit);
}

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function timeIn(tz: string, d = new Date(), hour12 = true) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12, timeZone: tz }).format(d);
}
