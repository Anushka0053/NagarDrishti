import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../store/mapStore';
import { useLayerStore } from '../../store/layerStore';
import { FloatingToolbar } from './FloatingToolbar';
import { CoordinatesBar } from './CoordinatesBar';

// Free high-contrast Carto & OSM tile styles for development
const BASEMAP_STYLES: Record<string, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // fallback or maptiler imagery
  terrain: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

export const MapContainer: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const { activeCity, activeBasemap, setCursorCoordinates, setCurrentZoom } = useMapStore();
  const { setSelectedFeature } = useLayerStore();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = activeCity?.center_latitude ?? 26.2183;
    const initialLng = activeCity?.center_longitude ?? 78.1828;
    const initialZoom = activeCity?.default_zoom ?? 12;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLES[activeBasemap] || BASEMAP_STYLES.dark,
      center: [initialLng, initialLat],
      zoom: initialZoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('mousemove', (e) => {
      setCursorCoordinates([e.lngLat.lng, e.lngLat.lat]);
    });

    map.on('zoom', () => {
      setCurrentZoom(map.getZoom());
    });

    // Sample Identify Click Handler
    map.on('click', (e) => {
      // Simulate identifying a feature near click for dev environment
      setSelectedFeature({
        feature_id: 'f-click-' + Math.floor(Math.random() * 1000),
        layer_name_en: 'Identified Civic Feature',
        layer_name_hi: 'पहचानी गई नागरिक सुविधा',
        name_en: `Facility at [${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}]`,
        name_hi: `सुविधा [${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}]`,
        category: 'civic_infrastructure',
        distance_meters: 0,
        properties: {
          latitude: e.lngLat.lat.toFixed(5),
          longitude: e.lngLat.lng.toFixed(5),
          ward: 'Ward 15 - Maharaj Bada',
          jurisdiction: 'Gwalior Municipal Corporation',
          status: 'operational',
        },
        source_attribution_en: 'Directorate of Urban Administration & Development, Govt of MP (GARUD GIS)',
        source_attribution_hi: 'स्रोत: नगरीय प्रशासन एवं विकास संचालनालय, म.प्र. शासन (गरुड़)',
        source_health: 'healthy',
        last_updated: new Date().toISOString(),
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update map center when activeCity changes
  useEffect(() => {
    if (mapRef.current && activeCity) {
      mapRef.current.flyTo({
        center: [activeCity.center_longitude, activeCity.center_latitude],
        zoom: activeCity.default_zoom,
        essential: true,
        duration: 1500,
      });
    }
  }, [activeCity]);

  // Update basemap style when activeBasemap changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(BASEMAP_STYLES[activeBasemap] || BASEMAP_STYLES.dark);
    }
  }, [activeBasemap]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleLocateUser = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapRef.current?.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 15,
            duration: 1500,
          });
        },
        (err) => console.warn('Geolocation denied:', err.message)
      );
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="relative flex-1 h-[calc(100vh-3.5rem)] bg-[#0B132B] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      <FloatingToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocateUser={handleLocateUser}
        onToggleFullscreen={handleToggleFullscreen}
      />
      <CoordinatesBar />
    </div>
  );
};
