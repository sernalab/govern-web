import { useRef, useEffect, useState } from 'preact/hooks';
import ChartWrapper from './ChartWrapper';

interface MapDataPoint {
  comunitat: string;
  valor: number;
}

interface SpainMapProps {
  data: MapDataPoint[];
  title?: string;
}

function getColor(value: number, min: number, max: number): string {
  if (max === min) return '#10b981';
  const ratio = (value - min) / (max - min);
  const r = Math.round(16 + ratio * (239 - 16));
  const g = Math.round(185 - ratio * (185 - 68));
  const b = Math.round(129 - ratio * (129 - 68));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function SpainMap({ data, title = 'Mapa de España' }: SpainMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let cancelled = false;

    async function initMap() {
      const L = await import('leaflet');

      if (cancelled || !mapContainerRef.current) return;

      // Clean up previous map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [40.0, -3.5],
        zoom: 6,
        zoomControl: true,
        attributionControl: false,
      });

      mapRef.current = map;

      // Light tile layer (CartoDB positron)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Load GeoJSON
      try {
        const response = await fetch('/data/spain-communities.geojson');
        if (!response.ok) throw new Error('GeoJSON not found');
        const geojson = await response.json();

        const values = data.map((d) => d.valor);
        const min = Math.min(...values);
        const max = Math.max(...values);

        const dataMap = new Map(data.map((d) => [d.comunitat.toLowerCase(), d.valor]));

        L.geoJSON(geojson, {
          style: (feature: any) => {
            const name = (feature?.properties?.name || '').toLowerCase();
            const value = dataMap.get(name);
            return {
              fillColor: value !== undefined ? getColor(value, min, max) : '#e5e7eb',
              weight: 1,
              opacity: 0.8,
              color: '#d1d5db',
              fillOpacity: 0.7,
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            const name = feature?.properties?.name || 'Desconocido';
            const value = dataMap.get(name.toLowerCase());
            const displayValue = value !== undefined ? value.toLocaleString('es-ES') : 'Sin datos';
            layer.bindPopup(
              `<div style="font-family: system-ui; padding: 4px; color: #111827;">
                <strong>${name}</strong><br/>
                <span>${displayValue}</span>
              </div>`
            );
          },
        }).addTo(map);
      } catch (err) {
        console.warn('Could not load GeoJSON for Spain map:', err);
      }

      setLoading(false);
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [data, title]);

  return (
    <ChartWrapper height="450px" loading={loading}>
      {title && (
        <h3 class="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
      )}
      <div
        ref={mapContainerRef}
        style={{ height: '380px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}
      />
    </ChartWrapper>
  );
}
