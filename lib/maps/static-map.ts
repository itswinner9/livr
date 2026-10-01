export function staticMapUrl(
  latitude: number,
  longitude: number,
  token: string | null,
  size = "640x400",
) {
  if (!token) return null;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+2563eb(${longitude},${latitude})/${longitude},${latitude},14/${size}@2x?access_token=${token}`;
}
