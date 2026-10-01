import type { StyleSpecification } from "maplibre-gl";

const ATTRIBUTION =
  '© <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener">Mapbox</a> ' +
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> ' +
  '<a href="https://www.mapbox.com/map-feedback/" target="_blank" rel="noopener">Improve this map</a>';

/**
 * MapLibre can't resolve `mapbox://` vector style URLs, so Mapbox styles are rendered
 * through the Static Tiles API as raster tiles.
 */
export function mapboxRasterStyle(token: string, styleId: "streets-v12" | "dark-v11"): StyleSpecification {
  return {
    version: 8,
    sources: {
      mapbox: {
        type: "raster",
        tiles: [
          `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(token)}`,
        ],
        tileSize: 512,
        maxzoom: 22,
        attribution: ATTRIBUTION,
      },
    },
    layers: [{ id: "mapbox", type: "raster", source: "mapbox" }],
  };
}

/** Styles for mapcn's `<Map styles>`; undefined keeps mapcn's free CARTO basemap. */
export function mapStyles(token: string | null | undefined) {
  if (!token) return undefined;
  return { light: mapboxRasterStyle(token, "streets-v12"), dark: mapboxRasterStyle(token, "dark-v11") };
}
