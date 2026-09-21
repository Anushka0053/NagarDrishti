import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore, BasemapStyle } from '../../store/mapStore';
import { useLayerStore } from '../../store/layerStore';
import { FloatingToolbar } from './FloatingToolbar';
import { CoordinatesBar } from './CoordinatesBar';
import { citiesApi, layersApi, spatialApi } from '../../api';
import { Ward, GISLayer } from '../../types';

// Authoritative and legally usable development basemaps
const BASEMAP_STYLES: Record<BasemapStyle, any> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  osm: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  satellite: {
    version: 8,
    sources: {
      'esri-imagery': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
    },
    layers: [
      {
        id: 'esri-imagery-layer',
        type: 'raster',
        source: 'esri-imagery',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  terrain: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

export const MapContainer: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const clickMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const {
    activeCity,
    activeWard,
    setActiveWard,
    activeBasemap,
    setCursorCoordinates,
    setClickCoordinates,
    setCurrentZoom,
    setInspectorOpen,
    setUserLocation,
    setResolvedLocation,
    tempMarker,
  } = useMapStore();

  const {
    layers,
    activeLayerIds,
    layerOpacity,
    setSelectedFeature,
    showWardBoundaries,
  } = useLayerStore();

  const [wardsData, setWardsData] = useState<Ward[]>([]);
  const [hoveredWardId, setHoveredWardId] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 1. Fetch Wards when activeCity changes
  useEffect(() => {
    if (!activeCity) return;
    let isMounted = true;
    citiesApi
      .getCityWards(activeCity.id)
      .then((data) => {
        if (isMounted) setWardsData(data || []);
      })
      .catch((err) => {
        console.warn('[MapContainer] Could not fetch city wards:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [activeCity?.id]);

  // 2. Initialize MapLibre Map
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
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 150 }), 'bottom-left');

    map.on('load', () => {
      setIsMapLoaded(true);
    });

    map.on('style.load', () => {
      setIsMapLoaded(true);
    });

    map.on('mousemove', (e) => {
      setCursorCoordinates([e.lngLat.lng, e.lngLat.lat]);
    });

    map.on('zoom', () => {
      setCurrentZoom(map.getZoom());
    });

    // Universal Map Click Identify Handler
    map.on('click', async (e) => {
      const clickLng = e.lngLat.lng;
      const clickLat = e.lngLat.lat;

      setClickCoordinates([clickLng, clickLat]);

      // Place visual pulse marker at clicked location
      if (clickMarkerRef.current) {
        clickMarkerRef.current.setLngLat([clickLng, clickLat]);
      } else {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 rounded-full border-2 border-cyan-400 bg-cyan-500/40 animate-ping flex items-center justify-center';
        const inner = document.createElement('div');
        inner.className = 'w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-lg';
        el.appendChild(inner);

        clickMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([clickLng, clickLat])
          .addTo(map);
      }

      try {
        // Query PostGIS Identify endpoint
        const identifiedFeatures = await spatialApi.identifyAtCoordinate({
          latitude: clickLat,
          longitude: clickLng,
          tolerance_meters: 50,
        });

        if (identifiedFeatures && identifiedFeatures.length > 0) {
          const topFeature = identifiedFeatures[0];
          setSelectedFeature({
            ...topFeature,
            city_name: activeCity?.name_en,
            latitude: clickLat,
            longitude: clickLng,
          });
          setInspectorOpen(true);
        } else {
          // Resolve administrative context when no specific asset is clicked
          const loc = await spatialApi.resolveLocation({ latitude: clickLat, longitude: clickLng });
          setResolvedLocation(loc);
          setSelectedFeature({
            name_en: `Location at ${clickLat.toFixed(5)}° N, ${clickLng.toFixed(5)}° E`,
            name_hi: `स्थान: ${clickLat.toFixed(5)}° N, ${clickLng.toFixed(5)}° E`,
            category: 'geographic_coordinate',
            properties: {
              latitude: clickLat.toFixed(5),
              longitude: clickLng.toFixed(5),
              state: loc.state,
              district: loc.district_en,
              city: loc.city_en,
              ward: loc.ward_en ? `Ward ${loc.ward_number}: ${loc.ward_en}` : 'Outside urban ward',
              corporator: loc.corporator || 'N/A',
            },
            source_attribution_en: 'NagarDrishti Spatial Resolution Engine',
            source_attribution_hi: 'नगरदृष्टि स्थानिक विश्लेषण इंजन',
            source_health: 'healthy',
            last_updated: new Date().toISOString(),
            latitude: clickLat,
            longitude: clickLng,
          });
          setInspectorOpen(true);
        }
      } catch (err) {
        console.warn('[Map Click Identify Failed]', err);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 3. Handle Basemap Switch
  useEffect(() => {
    if (!mapRef.current) return;
    const styleObj = BASEMAP_STYLES[activeBasemap] || BASEMAP_STYLES.dark;
    mapRef.current.setStyle(styleObj);
  }, [activeBasemap]);

  // 4. Handle Active City Extent Navigation
  useEffect(() => {
    if (mapRef.current && activeCity) {
      mapRef.current.flyTo({
        center: [activeCity.center_longitude, activeCity.center_latitude],
        zoom: activeCity.default_zoom,
        essential: true,
        duration: 1200,
      });
    }
  }, [activeCity?.id]);

  // 5. Handle Active Ward Zoom & Highlight
  useEffect(() => {
    if (!mapRef.current || !activeWard) return;
    if (activeWard.geometry && activeWard.geometry.coordinates) {
      try {
        const coords = activeWard.geometry.coordinates[0];
        const bounds = coords.reduce(
          (b: maplibregl.LngLatBounds, coord: number[]) => b.extend(coord as [number, number]),
          new maplibregl.LngLatBounds(coords[0], coords[0])
        );
        mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000, maxZoom: 15 });
      } catch (e) {
        console.warn('Could not compute ward bounds:', e);
      }
    }
  }, [activeWard?.id]);

  // 6. Handle Temp Marker (from Search or Selection)
  useEffect(() => {
    if (!mapRef.current) return;
    if (tempMarker) {
      const [lng, lat] = tempMarker;
      mapRef.current.flyTo({ center: [lng, lat], zoom: 14, duration: 1200 });

      if (clickMarkerRef.current) {
        clickMarkerRef.current.setLngLat([lng, lat]);
      } else {
        clickMarkerRef.current = new maplibregl.Marker({ color: '#06B6D4' })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
      }
    }
  }, [tempMarker]);

  // 7. Synchronize Dynamic Ward Boundaries on Map
  const syncWardLayer = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = 'nd-wards-source';
    const fillLayerId = 'nd-wards-fill';
    const lineLayerId = 'nd-wards-line';
    const labelLayerId = 'nd-wards-label';

    if (!showWardBoundaries || wardsData.length === 0) {
      if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      return;
    }

    const wardFeatures = wardsData
      .filter((w) => w.geometry)
      .map((w) => ({
        type: 'Feature',
        id: w.id,
        properties: {
          id: w.id,
          ward_number: w.ward_number,
          ward_code: w.ward_code || `W-${w.ward_number}`,
          name_en: w.name_en,
          name_hi: w.name_hi,
          zone_name_en: w.zone_name_en || 'Zone',
          corporator_name: w.corporator_name || 'N/A',
          population: w.population || 0,
        },
        geometry: w.geometry,
      }));

    const geojsonData = {
      type: 'FeatureCollection',
      features: wardFeatures,
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData as any);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData as any,
      });

      // 1. Ward Fill Layer
      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#06B6D4',
          'fill-opacity': [
            'case',
            ['==', ['get', 'id'], activeWard?.id || ''],
            0.35,
            ['==', ['get', 'id'], hoveredWardId || ''],
            0.2,
            0.06,
          ],
        },
      });

      // 2. Ward Boundary Line Layer
      map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'id'], activeWard?.id || ''],
            '#22D3EE',
            '#0891B2',
          ],
          'line-width': [
            'case',
            ['==', ['get', 'id'], activeWard?.id || ''],
            2.5,
            1.2,
          ],
          'line-dasharray': [3, 2],
        },
      });

      // 3. Ward Center Label Layer
      map.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['concat', 'Ward ', ['get', 'ward_number'], '\n', ['get', 'name_en']],
          'text-size': 11,
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center',
          'text-max-width': 10,
        },
        paint: {
          'text-color': '#E2E8F0',
          'text-halo-color': '#0B132B',
          'text-halo-width': 2,
        },
      });

      // Ward Interactivity
      map.on('mousemove', fillLayerId, (e) => {
        if (e.features && e.features.length > 0) {
          const fid = e.features[0].properties?.id;
          setHoveredWardId(fid);
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', fillLayerId, () => {
        setHoveredWardId(null);
        map.getCanvas().style.cursor = '';
      });

      map.on('click', fillLayerId, (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          const matchedWard = wardsData.find((w) => w.id === props?.id);
          if (matchedWard) {
            setActiveWard(matchedWard);
          }
        }
      });
    }
  }, [wardsData, activeWard?.id, hoveredWardId, showWardBoundaries]);

  // 8. Synchronize Dynamic GIS Layers on Map
  const syncGISLayers = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    for (const layer of layers) {
      const sourceId = `nd-source-${layer.id}`;
      const layerId = `nd-layer-${layer.id}`;
      const isActive = activeLayerIds.has(layer.id);
      const userOpacity = layerOpacity[layer.id] ?? 1.0;

      if (!isActive) {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getLayer(`${layerId}-line`)) map.removeLayer(`${layerId}-line`);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        continue;
      }

      // Layer is active — fetch GeoJSON features
      try {
        const geojsonData = await layersApi.getLayerFeaturesGeoJSON(layer.id, {
          city_id: activeCity?.id,
          ward_id: activeWard?.id,
        });

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: geojsonData,
          });

          const geomType = layer.geometry_type.toUpperCase();
          const cfg = layer.style_config || {};

          if (geomType === 'POINT' || geomType === 'MULTIPOINT') {
            map.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              minzoom: layer.min_zoom || 8,
              maxzoom: layer.max_zoom || 22,
              paint: {
                'circle-radius': cfg.point_radius || 6,
                'circle-color': cfg.fill_color || '#06B6D4',
                'circle-stroke-color': cfg.stroke_color || '#FFFFFF',
                'circle-stroke-width': cfg.stroke_width || 1.5,
                'circle-opacity': (cfg.fill_opacity || 0.9) * userOpacity,
              },
            });
          } else if (geomType === 'LINESTRING' || geomType === 'MULTILINESTRING') {
            map.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              minzoom: layer.min_zoom || 8,
              maxzoom: layer.max_zoom || 22,
              paint: {
                'line-color': cfg.stroke_color || '#F59E0B',
                'line-width': cfg.stroke_width || 3,
                'line-opacity': (cfg.stroke_opacity || 0.9) * userOpacity,
              },
            });
          } else if (geomType === 'POLYGON' || geomType === 'MULTIPOLYGON') {
            map.addLayer({
              id: layerId,
              type: 'fill',
              source: sourceId,
              minzoom: layer.min_zoom || 8,
              maxzoom: layer.max_zoom || 22,
              paint: {
                'fill-color': cfg.fill_color || '#10B981',
                'fill-opacity': (cfg.fill_opacity || 0.4) * userOpacity,
              },
            });
            map.addLayer({
              id: `${layerId}-line`,
              type: 'line',
              source: sourceId,
              minzoom: layer.min_zoom || 8,
              maxzoom: layer.max_zoom || 22,
              paint: {
                'line-color': cfg.stroke_color || '#059669',
                'line-width': cfg.stroke_width || 1.5,
              },
            });
          }

          // Feature click handler on layer
          map.on('click', layerId, (e) => {
            if (e.features && e.features.length > 0) {
              const feat = e.features[0];
              const props = feat.properties || {};
              setSelectedFeature({
                feature_id: String(props.id || feat.id || ''),
                layer_id: layer.id,
                layer_name_en: layer.name_en,
                layer_name_hi: layer.name_hi,
                name_en: props.name_en || layer.name_en,
                name_hi: props.name_hi || layer.name_hi,
                category: props.category || layer.slug,
                properties: typeof props.attributes === 'string' ? JSON.parse(props.attributes) : (props.attributes || props),
                source_attribution_en: layer.source_type,
                source_health: 'healthy',
                last_updated: new Date().toISOString(),
                city_name: activeCity?.name_en,
              });
              setInspectorOpen(true);
            }
          });

          map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
          });
        } else {
          // Source exists — update data and opacity
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
          if (map.getLayer(layerId)) {
            const geomType = layer.geometry_type.toUpperCase();
            if (geomType === 'POINT') {
              map.setPaintProperty(layerId, 'circle-opacity', 0.9 * userOpacity);
            } else if (geomType === 'LINESTRING') {
              map.setPaintProperty(layerId, 'line-opacity', 0.9 * userOpacity);
            } else if (geomType === 'POLYGON') {
              map.setPaintProperty(layerId, 'fill-opacity', 0.4 * userOpacity);
            }
          }
        }
      } catch (err) {
        console.warn(`[Failed to sync layer ${layer.name_en}]`, err);
      }
    }
  }, [layers, activeLayerIds, layerOpacity, activeCity?.id, activeWard?.id]);

  // Re-sync all layers whenever active city/ward, layers, or style load changes
  useEffect(() => {
    if (isMapLoaded) {
      syncWardLayer();
      syncGISLayers();
    }
  }, [isMapLoaded, syncWardLayer, syncGISLayers]);

  // Toolbar Actions
  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });

  const handleLocateUser = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ latitude, longitude, accuracy });

        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 1500,
        });

        // User location marker
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([longitude, latitude]);
        } else if (mapRef.current) {
          const el = document.createElement('div');
          el.className = 'w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center';
          const inner = document.createElement('div');
          inner.className = 'w-2 h-2 rounded-full bg-white animate-ping';
          el.appendChild(inner);

          userMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);
        }

        // Reverse location hierarchy resolution via PostGIS
        try {
          const loc = await spatialApi.resolveLocation({ latitude, longitude });
          setResolvedLocation(loc);
        } catch (err) {
          console.warn('[Resolve Location Failed]', err);
        }
      },
      (err) => {
        console.warn('[Geolocation Error]', err.message);
        alert(`Could not obtain location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
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
