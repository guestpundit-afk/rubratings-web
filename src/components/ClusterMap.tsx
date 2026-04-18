'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';

type Pin = {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  tier?: string | null;
  href?: string;
};

type Props = {
  pins: Pin[];
  center?: [number, number];
  zoom?: number;
};

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export default function ClusterMap({ pins, center, zoom = 14 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (cancelled || !containerRef.current) return;

      const fallbackCenter: [number, number] = center
        ? center
        : pins.length
        ? [pins[0].lng, pins[0].lat]
        : [151.1793, -33.8985];

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: OPENFREEMAP_STYLE,
        center: fallbackCenter,
        zoom,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        for (const pin of pins) {
          if (pin.lat == null || pin.lng == null) continue;
          const el = document.createElement('a');
          el.className = 'rr-pin';
          if (pin.href) el.href = pin.href;
          el.title = pin.name;
          el.setAttribute('aria-label', pin.name);

          const popup = new maplibregl.Popup({ offset: 16, closeButton: false, className: 'rr-popup' }).setHTML(
            `<strong>${escapeHtml(pin.name)}</strong>${
              pin.tier ? `<br/><span class="rr-tier">Tier ${escapeHtml(pin.tier)}</span>` : ''
            }`,
          );

          new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([pin.lng, pin.lat])
            .setPopup(popup)
            .addTo(map);
        }

        if (pins.length >= 2) {
          const bounds = new maplibregl.LngLatBounds();
          for (const p of pins) bounds.extend([p.lng, p.lat]);
          map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
        }
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [pins, center, zoom]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[420px] rounded-lg overflow-hidden border border-ink-20"
    />
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
