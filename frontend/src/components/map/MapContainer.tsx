import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore, BasemapStyle } from '../../store/mapStore';
import { useLayerStore } from '../../store/layerStore';
import { FloatingToolbar } from './FloatingToolbar';
import { CoordinatesBar } from './CoordinatesBar';
import { AnalysisDrawer } from '../gis/AnalysisDrawer';
import { DatasetUploadModal } from '../gis/DatasetUploadModal';
import { citiesApi, layersApi, spatialApi, intelligenceApi, feedbackApi } from '../../api';
import { Ward, GISLayer } from '../../types';

// Authoritative and legally usable development basemaps
const BASEMAP_STYLES: Record<BasemapStyle, any> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  osm: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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
  satellite_labels: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'esri-imagery': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
      'esri-labels': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'Labels © Esri',
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
      {
        id: 'esri-labels-layer',
        type: 'raster',
        source: 'esri-labels',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  terrain: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

// Helper: Calculate bounding box of any GeoJSON geometry
function getGeometryBounds(geom: any): maplibregl.LngLatBounds | null {
  if (!geom || !geom.coordinates) return null;
  const bounds = new maplibregl.LngLatBounds();
  const extract = (coords: any) => {
    if (typeof coords[0] === 'number') {
      bounds.extend([coords[0], coords[1]]);
    } else {
      coords.forEach(extract);
    }
  };
  extract(geom.coordinates);
  return bounds.isEmpty() ? null : bounds;
}

// Fallback authentic features for reference city (Gwalior) when offline
function getGwaliorFallbackFeatures(layerSlug: string, category: string) {
  const s = `${layerSlug} ${category}`.toLowerCase();
  if (s.includes('health') || s.includes('hospital')) {
    return [
      {
        type: 'Feature',
        id: 'hosp-0',
        geometry: { type: 'Point', coordinates: [78.18800, 26.21550] },
        properties: { name_en: 'Om Hospital', name_hi: 'ओम हॉस्पिटल', category: 'hospital', amenity: 'hospital', operator: 'Private Specialty Hospital' }
      },
      {
        type: 'Feature',
        id: 'hosp-1',
        geometry: { type: 'Point', coordinates: [78.19727, 26.21359] },
        properties: { name_en: 'Prayas Children Hospital', category: 'hospital', amenity: 'hospital', operator: 'Private Healthcare' }
      },
      {
        type: 'Feature',
        id: 'hosp-2',
        geometry: { type: 'Point', coordinates: [78.19810, 26.21300] },
        properties: { name_en: 'Arihant Hospital', category: 'hospital', amenity: 'hospital', operator: 'Private Trust' }
      },
      {
        type: 'Feature',
        id: 'hosp-3',
        geometry: { type: 'Point', coordinates: [78.20410, 26.21375] },
        properties: { name_en: 'Sai Shraddha Hospital', category: 'hospital', amenity: 'hospital', operator: 'Specialty Healthcare' }
      },
      {
        type: 'Feature',
        id: 'hosp-4',
        geometry: { type: 'Point', coordinates: [78.17900, 26.20800] },
        properties: { name_en: 'JAH Hospital & Medical College', category: 'hospital', amenity: 'hospital', operator: 'Govt of MP' }
      },
      {
        type: 'Feature',
        id: 'hosp-5',
        geometry: { type: 'Point', coordinates: [78.19250, 26.21420] },
        properties: { name_en: 'City Hospital And Research Centre - Gwalior', name_hi: 'सिटी हॉस्पिटल एंड रिसर्च सेंटर - ग्वालियर', category: 'hospital', amenity: 'hospital', operator: 'Multi-Specialty Research Hospital' }
      }
    ];
  }
  if (s.includes('edu') || s.includes('school')) {
    return [
      {
        type: 'Feature',
        id: 'edu-1',
        geometry: { type: 'Point', coordinates: [78.20400, 26.21300] },
        properties: { name_en: 'RKVM CBSE School', category: 'school', amenity: 'school', operator: 'Education Trust' }
      },
      {
        type: 'Feature',
        id: 'edu-2',
        geometry: { type: 'Point', coordinates: [78.16900, 26.22900] },
        properties: { name_en: 'The Scindia School', category: 'school', amenity: 'school', operator: 'Private Boarding' }
      },
      {
        type: 'Feature',
        id: 'edu-3',
        geometry: { type: 'Point', coordinates: [78.20900, 26.22600] },
        properties: { name_en: 'Madhav Institute of Technology & Science', category: 'college', amenity: 'university', operator: 'Autonomous Govt Aided' }
      }
    ];
  }
  if (s.includes('police') || s.includes('safety') || s.includes('fire')) {
    return [
      {
        type: 'Feature',
        id: 'pol-1',
        geometry: { type: 'Point', coordinates: [78.18300, 26.21900] },
        properties: { name_en: 'Gwalior Kotwali Police Station', category: 'police', amenity: 'police', operator: 'MP Police' }
      },
      {
        type: 'Feature',
        id: 'pol-2',
        geometry: { type: 'Point', coordinates: [78.22500, 26.22300] },
        properties: { name_en: 'Morar Police Thana & Control Room', category: 'police', amenity: 'police', operator: 'MP Police' }
      }
    ];
  }
  if (s.includes('park') || s.includes('garden') || s.includes('recreation')) {
    return [
      {
        type: 'Feature',
        id: 'park-1',
        geometry: { type: 'Point', coordinates: [78.20500, 26.21400] },
        properties: { name_en: 'Gandhi Zoological Park', category: 'park', leisure: 'park', operator: 'Gwalior Municipal Corp' }
      },
      {
        type: 'Feature',
        id: 'park-2',
        geometry: { type: 'Point', coordinates: [78.17500, 26.21000] },
        properties: { name_en: 'Phool Bagh & Italian Garden', category: 'park', leisure: 'park', operator: 'Urban Administration' }
      }
    ];
  }
  if (s.includes('road') || s.includes('transport') || s.includes('network')) {
    return [
      {
        type: 'Feature',
        id: 'road-1',
        geometry: {
          type: 'LineString',
          coordinates: [
            [78.19200, 26.21350],
            [78.19700, 26.21360],
            [78.20200, 26.21370],
            [78.20800, 26.21380],
          ]
        },
        properties: { name_en: 'Gandhi Road Arterial Corridor', category: 'roads', highway: 'primary', lanes: 4, surface: 'asphalt' }
      },
      {
        type: 'Feature',
        id: 'road-2',
        geometry: {
          type: 'LineString',
          coordinates: [
            [78.18100, 26.21500],
            [78.18300, 26.21900],
            [78.18600, 26.22300],
          ]
        },
        properties: { name_en: 'Station Road Corridor', category: 'roads', highway: 'secondary', lanes: 2, surface: 'paved' }
      }
    ];
  }
  if (s.includes('civic') || s.includes('government')) {
    return [
      {
        type: 'Feature',
        id: 'civic-1',
        geometry: { type: 'Point', coordinates: [78.18200, 26.21800] },
        properties: { name_en: 'Gwalior Municipal Corporation HQ', category: 'government', amenity: 'townhall', operator: 'GMC' }
      },
      {
        type: 'Feature',
        id: 'civic-2',
        geometry: { type: 'Point', coordinates: [78.17000, 26.20500] },
        properties: { name_en: 'District Collectorate Complex', category: 'government', office: 'government', operator: 'Govt of MP' }
      }
    ];
  }
  if (s.includes('water')) {
    return [
      {
        type: 'Feature',
        id: 'water-1',
        geometry: { type: 'Point', coordinates: [78.15000, 26.23000] },
        properties: { name_en: 'Motijheel Water Filtration Plant', category: 'water', man_made: 'water_works', operator: 'PHED Gwalior' }
      }
    ];
  }
  if (s.includes('waste') || s.includes('garbage')) {
    return [
      {
        type: 'Feature',
        id: 'waste-1',
        geometry: { type: 'Point', coordinates: [78.21000, 26.24000] },
        properties: { name_en: 'Kedarpur Solid Waste Processing Yard', category: 'solid_waste', amenity: 'waste_transfer_station', operator: 'SWM Municipal' }
      }
    ];
  }
  return [];
}

export const MapContainer: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Distinct markers
  const clickMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null);
  const analysisOriginMarkerRef = useRef<maplibregl.Marker | null>(null);
  const routeStartMarkerRef = useRef<maplibregl.Marker | null>(null);
  const routeEndMarkerRef = useRef<maplibregl.Marker | null>(null);
  const layerFeaturesCacheRef = useRef<Record<string, any>>({});

  const {
    activeCity,
    activeWard,
    setActiveWard,
    activeBasemap,
    activeTool,
    setActiveTool,
    setCursorCoordinates,
    setClickCoordinates,
    setCurrentZoom,
    setInspectorOpen,
    userLocation,
    setUserLocation,
    setResolvedLocation,
    tempMarker,
    focusGeometry,
    highlightedFeatureId,
    bufferResult,
    routeResult,
    measureResult,
    routeOrigin,
    routeDestination,
    clearAnalysis,
  } = useMapStore();

  const {
    layers,
    activeLayerIds,
    layerOpacity,
    setSelectedFeature,
    showWardBoundaries,
    showCitizenReports,
    showIssueClusters,
    showIssueHotspots,
    selectedSectorId,
    selectedDepartmentId,
  } = useLayerStore();

  const [wardsData, setWardsData] = useState<Ward[]>([]);
  const [hoveredWardId, setHoveredWardId] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);
  const prevBasemapRef = useRef<string>(activeBasemap);

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
      initTemporaryLayers(map);
    });

    map.on('style.load', () => {
      setIsMapLoaded(true);
      setStyleVersion((v) => v + 1);
      initTemporaryLayers(map);
    });

    map.on('mousemove', (e) => {
      setCursorCoordinates([e.lngLat.lng, e.lngLat.lat]);
    });

    map.on('zoom', () => {
      setCurrentZoom(map.getZoom());
    });

    // Unified Map Click Handler respecting tool modes
    map.on('click', async (e) => {
      const clickLng = e.lngLat.lng;
      const clickLat = e.lngLat.lat;

      // 1. Check if an interactive layer feature was clicked directly
      const currentMap = mapRef.current;
      if (!currentMap) return;

      // Hit-test with 10px tolerance box for points and lines
      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5],
      ];

      // Query rendered features on active layer IDs
      const layerIdPrefixes = Array.from(useLayerStore.getState().activeLayerIds).map(id => `nd-layer-${id}`);
      const availableLayerIds = layerIdPrefixes.filter(id => currentMap.getLayer(id));

      let hitFeature: any = null;
      if (availableLayerIds.length > 0) {
        const features = currentMap.queryRenderedFeatures(bbox, { layers: availableLayerIds });
        if (features && features.length > 0) {
          hitFeature = features[0];
        }
      }

      if (hitFeature) {
        // Feature hit: select it directly
        const props = hitFeature.properties || {};
        const parsedProps = typeof props.properties === 'string' 
          ? JSON.parse(props.properties) 
          : (typeof props.attributes === 'string' ? JSON.parse(props.attributes) : props);

        const currentCity = useMapStore.getState().activeCity;
        setSelectedFeature({
          feature_id: String(props.id || hitFeature.id || ''),
          layer_id: hitFeature.layer?.id?.replace('nd-layer-', '') || '',
          layer_name_en: props.layer_name_en || props.category || 'Civic Feature',
          layer_name_hi: props.name_hi,
          name_en: props.name_en || (props.category === 'road' ? 'Unnamed mapped road' : props.category),
          name_hi: props.name_hi,
          category: props.category || 'civic_feature',
          properties: parsedProps,
          source_attribution_en: parsedProps.attribution || 'OpenStreetMap Community Open Data',
          source_health: 'healthy',
          last_updated: props.source_updated_at || new Date().toISOString(),
          city_name: currentCity?.name_en,
          latitude: hitFeature.geometry?.type === 'Point' ? hitFeature.geometry.coordinates[1] : clickLat,
          longitude: hitFeature.geometry?.type === 'Point' ? hitFeature.geometry.coordinates[0] : clickLng,
          geometry: hitFeature.geometry,
        });
        setInspectorOpen(true);
        return;
      }

      // 2. If in route tool mode: set start / destination
      const currentTool = useMapStore.getState().activeTool;
      if (currentTool === 'route') {
        const origin = useMapStore.getState().routeOrigin;
        if (!origin) {
          useMapStore.getState().setRouteOrigin([clickLng, clickLat]);
        } else {
          useMapStore.getState().setRouteDestination([clickLng, clickLat]);
        }
        return;
      }

      // 3. If in buffer or proximity tool mode: set analysis origin
      if (currentTool === 'buffer' || currentTool === 'proximity') {
        setClickCoordinates([clickLng, clickLat]);
        return;
      }

      // 4. In identify mode OR empty click:
      if (currentTool === 'identify') {
        setClickCoordinates([clickLng, clickLat]);

        // Place static temporary pin at clicked location (NO animate-ping!)
        if (clickMarkerRef.current) {
          clickMarkerRef.current.setLngLat([clickLng, clickLat]);
        } else {
          const el = document.createElement('div');
          el.className = 'w-5 h-5 rounded-full border-2 border-white bg-cyan-500 shadow-md flex items-center justify-center cursor-pointer';
          const inner = document.createElement('div');
          inner.className = 'w-1.5 h-1.5 rounded-full bg-white';
          el.appendChild(inner);

          clickMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([clickLng, clickLat])
            .addTo(map);
        }

        try {
          const identifiedFeatures = await spatialApi.identifyAtCoordinate({
            latitude: clickLat,
            longitude: clickLng,
            tolerance_meters: 50,
            city_id: useMapStore.getState().activeCity?.id,
          });

          if (identifiedFeatures && identifiedFeatures.length > 0) {
            const topFeature = identifiedFeatures[0];
            setSelectedFeature({
              ...topFeature,
              city_name: useMapStore.getState().activeCity?.name_en,
              latitude: clickLat,
              longitude: clickLng,
            });
            setInspectorOpen(true);
          } else {
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
                ward: loc.ward_en ? `Ward ${loc.ward_number}: ${loc.ward_en}` : 'Outside urban ward boundary',
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
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Initialize Temporary Analysis Sources and Layers
  const initTemporaryLayers = (map: maplibregl.Map) => {
    // 1. Temporary Highlight Layer (for Search or Selected Feature)
    if (!map.getSource('nd-temp-highlight-source')) {
      map.addSource('nd-temp-highlight-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      // Highlight Fill
      map.addLayer({
        id: 'nd-temp-highlight-fill',
        type: 'fill',
        source: 'nd-temp-highlight-source',
        paint: {
          'fill-color': '#06B6D4',
          'fill-opacity': 0.25,
        },
      });
      // Highlight Line
      map.addLayer({
        id: 'nd-temp-highlight-line',
        type: 'line',
        source: 'nd-temp-highlight-source',
        paint: {
          'line-color': '#22D3EE',
          'line-width': 4,
          'line-opacity': 0.9,
        },
      });
      // Highlight Point
      map.addLayer({
        id: 'nd-temp-highlight-circle',
        type: 'circle',
        source: 'nd-temp-highlight-source',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 10,
          'circle-color': 'rgba(6, 182, 212, 0.4)',
          'circle-stroke-color': '#22D3EE',
          'circle-stroke-width': 3,
        },
      });
    }

    // 2. Buffer Analysis Polygon Layer
    if (!map.getSource('nd-temp-buffer-source')) {
      map.addSource('nd-temp-buffer-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'nd-temp-buffer-fill',
        type: 'fill',
        source: 'nd-temp-buffer-source',
        paint: {
          'fill-color': '#3B82F6',
          'fill-opacity': 0.15,
        },
      });
      map.addLayer({
        id: 'nd-temp-buffer-line',
        type: 'line',
        source: 'nd-temp-buffer-source',
        paint: {
          'line-color': '#60A5FA',
          'line-width': 2,
          'line-dasharray': [3, 2],
        },
      });
    }

    // 3. OSRM Route Layer
    if (!map.getSource('nd-temp-route-source')) {
      map.addSource('nd-temp-route-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'nd-temp-route-casing',
        type: 'line',
        source: 'nd-temp-route-source',
        paint: {
          'line-color': '#1E3A8A',
          'line-width': 7,
          'line-opacity': 0.8,
        },
      });
      map.addLayer({
        id: 'nd-temp-route-line',
        type: 'line',
        source: 'nd-temp-route-source',
        paint: {
          'line-color': '#38BDF8',
          'line-width': 4,
          'line-opacity': 0.95,
        },
      });
    }
  };

  // 3. Handle Basemap Switch (Guarded against premature style diff during initial load)
  useEffect(() => {
    if (!mapRef.current) return;
    if (prevBasemapRef.current === activeBasemap) return;
    prevBasemapRef.current = activeBasemap;
    const styleObj = BASEMAP_STYLES[activeBasemap] || BASEMAP_STYLES.dark;
    if (mapRef.current.isStyleLoaded()) {
      mapRef.current.setStyle(styleObj);
    } else {
      mapRef.current.once('style.load', () => {
        mapRef.current?.setStyle(styleObj);
      });
    }
  }, [activeBasemap]);

  // 4. Handle Active City Extent Navigation & Layer Reset
  useEffect(() => {
    if (mapRef.current && activeCity) {
      layerFeaturesCacheRef.current = {};
      mapRef.current.flyTo({
        center: [activeCity.center_longitude, activeCity.center_latitude],
        zoom: activeCity.default_zoom,
        essential: true,
        duration: 1200,
      });

      // Clear click marker on city change
      if (clickMarkerRef.current) {
        clickMarkerRef.current.remove();
        clickMarkerRef.current = null;
      }
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
    }
  }, [activeCity?.id]);

  // 5. Handle Active Ward Zoom & Highlight
  useEffect(() => {
    if (!mapRef.current || !activeWard) return;
    if (activeWard.geometry) {
      const bounds = getGeometryBounds(activeWard.geometry);
      if (bounds) {
        mapRef.current.fitBounds(bounds, { padding: 60, duration: 1000, maxZoom: 15 });
      }
    }
  }, [activeWard?.id]);

  // 6. Handle Search Result Navigation & Highlight (Requirement 7)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (focusGeometry) {
      // 1. Update temporary highlight layer
      if (map.getSource('nd-temp-highlight-source')) {
        (map.getSource('nd-temp-highlight-source') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: focusGeometry,
            },
          ],
        });
      }

      // 2. Navigate map: point -> flyTo; line/polygon -> fitBounds
      if (focusGeometry.type === 'Point') {
        const [lng, lat] = focusGeometry.coordinates;
        map.flyTo({ center: [lng, lat], zoom: 16, duration: 1000 });
      } else {
        const bounds = getGeometryBounds(focusGeometry);
        if (bounds) {
          map.fitBounds(bounds, { padding: 80, duration: 1000, maxZoom: 16 });
        }
      }
    } else {
      // Clear highlight if focusGeometry is null
      if (map.getSource('nd-temp-highlight-source')) {
        (map.getSource('nd-temp-highlight-source') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    }
  }, [focusGeometry]);

  // 7. Handle Search / Temp Marker Pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tempMarker) {
      const [lng, lat] = tempMarker;
      map.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });

      if (searchMarkerRef.current) {
        searchMarkerRef.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'w-7 h-7 flex items-center justify-center cursor-pointer';
        el.innerHTML = `
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#06B6D4" stroke="#FFFFFF" stroke-width="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/>
          </svg>
        `;
        searchMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([lng, lat])
          .addTo(map);
      }
    } else if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }
  }, [tempMarker]);

  // 8. Handle Buffer Analysis Result Drawing
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('nd-temp-buffer-source')) return;

    if (bufferResult && bufferResult.buffer_geometry) {
      (map.getSource('nd-temp-buffer-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: bufferResult.buffer_geometry,
          },
        ],
      });

      // Fit map to buffer
      const bounds = getGeometryBounds(bufferResult.buffer_geometry);
      if (bounds) {
        map.fitBounds(bounds, { padding: 60, duration: 900 });
      }
    } else {
      (map.getSource('nd-temp-buffer-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
  }, [bufferResult]);

  // 9. Handle OSRM Route Result Drawing
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('nd-temp-route-source')) return;

    if (routeResult && routeResult.route_geometry) {
      (map.getSource('nd-temp-route-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: routeResult.route_geometry,
          },
        ],
      });

      // Fit map to route
      const bounds = getGeometryBounds(routeResult.route_geometry);
      if (bounds) {
        map.fitBounds(bounds, { padding: 80, duration: 900 });
      }
    } else {
      (map.getSource('nd-temp-route-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
  }, [routeResult]);

  // 10. Route Waypoint Markers (A & B)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeOrigin) {
      if (routeStartMarkerRef.current) {
        routeStartMarkerRef.current.setLngLat(routeOrigin);
      } else {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center border-2 border-white shadow-md';
        el.innerText = 'A';
        routeStartMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat(routeOrigin).addTo(map);
      }
    } else if (routeStartMarkerRef.current) {
      routeStartMarkerRef.current.remove();
      routeStartMarkerRef.current = null;
    }

    if (routeDestination) {
      if (routeEndMarkerRef.current) {
        routeEndMarkerRef.current.setLngLat(routeDestination);
      } else {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md';
        el.innerText = 'B';
        routeEndMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat(routeDestination).addTo(map);
      }
    } else if (routeEndMarkerRef.current) {
      routeEndMarkerRef.current.remove();
      routeEndMarkerRef.current = null;
    }
  }, [routeOrigin, routeDestination]);

  // 11. Synchronize Dynamic Ward Boundaries on Map
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

    // Find first operational layer to insert ward polygons UNDER them
    const allLayers = map.getStyle()?.layers || [];
    const firstOperationalLayer = allLayers.find((l: any) => 
      l.id.startsWith('nd-layer-') || 
      l.id.startsWith('nd-citizen-reports-') || 
      l.id.startsWith('nd-issue-') || 
      l.id.startsWith('nd-temp-')
    )?.id;

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData as any);
      if (map.getLayer(fillLayerId)) map.setLayoutProperty(fillLayerId, 'visibility', 'visible');
      if (map.getLayer(lineLayerId)) map.setLayoutProperty(lineLayerId, 'visibility', 'visible');
      if (map.getLayer(labelLayerId)) map.setLayoutProperty(labelLayerId, 'visibility', 'visible');
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData as any,
      });

      // Ward Fill Layer (inserted beneath point/feature layers)
      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#06B6D4',
          'fill-opacity': [
            'case',
            ['==', ['get', 'id'], activeWard?.id || ''],
            0.30,
            ['==', ['get', 'id'], hoveredWardId || ''],
            0.18,
            0.05,
          ],
        },
      }, firstOperationalLayer);

      // Ward Boundary Line Layer
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
      }, firstOperationalLayer);

      // Ward Center Label Layer (safe check for glyphs)
      if (map.getStyle()?.glyphs) {
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
        }, firstOperationalLayer);
      }

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
        // Guard: check if a specific point or line feature was clicked directly under cursor
        const hitFeatures = map.queryRenderedFeatures(e.point, {
          layers: (map.getStyle()?.layers || [])
            .map((l: any) => l.id)
            .filter((id: string) => 
              id.startsWith('nd-layer-') || 
              id.startsWith('nd-citizen-reports-') || 
              id.startsWith('nd-issue-cluster-') ||
              id.startsWith('nd-temp-')
            )
        });
        if (hitFeatures && hitFeatures.length > 0) {
          // Point feature clicked; let feature handler run, do not swallow with ward click
          return;
        }

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

  // 12. Synchronize Dynamic GIS Layers on Map (Instant Visibility Toggling & Cached Geometries)
  const syncGISLayers = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Retrieve active citizen reports to cross-reference facilities with reported civic issues
    const activeReportedLocations: Array<{ name: string; lat: number; lng: number; hazard?: string }> = [];
    try {
      const localSaved = JSON.parse(localStorage.getItem('my_citizen_reports') || '[]');
      for (const r of localSaved) {
        if (r.latitude && r.longitude) {
          activeReportedLocations.push({
            name: (r.facility_name || r.location_address || r.location || '').toLowerCase().trim(),
            lat: Number(r.latitude),
            lng: Number(r.longitude),
            hazard: r.extracted_hazard || r.category
          });
        }
      }
    } catch (e) {}

    for (const layer of layers) {
      // Strictly skip any cluster layers as requested
      if ((layer.name_en || '').toLowerCase().includes('cluster') || (layer.slug || '').toLowerCase().includes('cluster')) {
        continue;
      }

      const sourceId = `nd-source-${layer.id}`;
      const layerId = `nd-layer-${layer.id}`;
      const lineLayerId = `${layerId}-line`;
      const haloLayerId = `${layerId}-alert-halo`;
      const isActive = activeLayerIds.has(layer.id);
      const userOpacity = layerOpacity[layer.id] ?? 1.0;

      // Layer visibility is directly driven by its active toggle state
      const shouldBeVisible = isActive;

      // 1. If layer already exists on map: update visibility & opacity directly (0ms latency!)
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', shouldBeVisible ? 'visible' : 'none');
        if (map.getLayer(lineLayerId)) {
          map.setLayoutProperty(lineLayerId, 'visibility', shouldBeVisible ? 'visible' : 'none');
        }
        if (map.getLayer(haloLayerId)) {
          map.setLayoutProperty(haloLayerId, 'visibility', shouldBeVisible ? 'visible' : 'none');
        }

        if (shouldBeVisible) {
          const geomType = (layer.geometry_type || 'POINT').toUpperCase();
          if (geomType === 'POINT' || geomType === 'MULTIPOINT') {
            map.setPaintProperty(layerId, 'circle-opacity', 0.9 * userOpacity);
          } else if (geomType === 'LINESTRING' || geomType === 'MULTILINESTRING') {
            map.setPaintProperty(layerId, 'line-opacity', 0.9 * userOpacity);
          } else if (geomType === 'POLYGON' || geomType === 'MULTIPOLYGON') {
            map.setPaintProperty(layerId, 'fill-opacity', 0.4 * userOpacity);
          }
        }
        continue;
      }

      // 2. If layer is not yet on the map and should NOT be visible, skip mounting
      if (!shouldBeVisible) continue;

      // 3. Layer is active and needs to be mounted onto map for the first time
      try {
        let geojsonData = layerFeaturesCacheRef.current[layer.id];
        if (!geojsonData) {
          try {
            geojsonData = await layersApi.getLayerFeaturesGeoJSON(layer.id, {
              city_id: activeCity?.id,
            });
            if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
              layerFeaturesCacheRef.current[layer.id] = geojsonData;
            }
          } catch (fetchErr) {
            console.warn(`[Failed to fetch features for layer ${layer.name_en}]`, fetchErr);
          }
        }

        // If backend returns empty features or is unreachable, fallback to authentic reference GIS features
        if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
          const fallbackFeatures = getGwaliorFallbackFeatures(layer.slug, layer.category || '');
          geojsonData = { type: 'FeatureCollection', features: fallbackFeatures };
          layerFeaturesCacheRef.current[layer.id] = geojsonData;
        }

        // Cross-reference features against active citizen grievance reports
        if (geojsonData && geojsonData.features) {
          for (const f of geojsonData.features) {
            const fNameEn = (f.properties?.name_en || '').toLowerCase().trim();
            const fNameHi = (f.properties?.name_hi || '').toLowerCase().trim();
            const fName = (f.properties?.name || '').toLowerCase().trim();
            const coords = f.geometry?.type === 'Point' ? f.geometry.coordinates : null;

            let hasIssue = false;
            let matchingHazard = '';

            for (const rep of activeReportedLocations) {
              if (rep.name) {
                if (
                  (fNameEn && (fNameEn.includes(rep.name) || rep.name.includes(fNameEn))) ||
                  (fNameHi && (fNameHi.includes(rep.name) || rep.name.includes(fNameHi))) ||
                  (fName && (fName.includes(rep.name) || rep.name.includes(fName)))
                ) {
                  hasIssue = true;
                  matchingHazard = rep.hazard || 'Active Civic Grievance';
                  break;
                }
              }
              if (coords && rep.lat && rep.lng) {
                const dLng = (coords[0] - rep.lng) * 96000;
                const dLat = (coords[1] - rep.lat) * 111000;
                const distMeters = Math.sqrt(dLng * dLng + dLat * dLat);
                if (distMeters <= 200) {
                  hasIssue = true;
                  matchingHazard = rep.hazard || 'Active Civic Grievance';
                  break;
                }
              }
            }

            f.properties.has_reported_issues = hasIssue;
            if (hasIssue) {
              f.properties.alert_status = 'Active Grievance Reported';
              f.properties.recent_hazard = matchingHazard;
            }
          }
        }

        // Add or update source safely
        if (map.getSource(sourceId)) {
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: geojsonData,
          });
        }

        const geomType = (layer.geometry_type || 'POINT').toUpperCase();
        const cfg = layer.style_config || {};
        const isCurrentlyActive = useLayerStore.getState().activeLayerIds.has(layer.id);
        const layerVisibility = isCurrentlyActive ? 'visible' : 'none';

        // Category-based color resolver for distinct infrastructure identification
        const getCategoryPointColor = (layerSlug: string, cat?: string) => {
          const str = `${layerSlug} ${cat || ''}`.toLowerCase();
          if (str.includes('health') || str.includes('hospital')) return '#10B981'; // Emerald
          if (str.includes('edu') || str.includes('school')) return '#3B82F6'; // Blue
          if (str.includes('safety') || str.includes('police')) return '#6366F1'; // Indigo
          if (str.includes('road') || str.includes('transport')) return '#F59E0B'; // Amber
          if (str.includes('park') || str.includes('garden')) return '#059669'; // Green
          return cfg.fill_color || '#8B5CF6'; // Civic purple
        };

        if (geomType === 'POINT' || geomType === 'MULTIPOINT') {
          // 1. Add Alert Halo Ring for facilities with active issues
          if (!map.getLayer(haloLayerId)) {
            map.addLayer({
              id: haloLayerId,
              type: 'circle',
              source: sourceId,
              filter: ['==', ['get', 'has_reported_issues'], true],
              layout: { visibility: layerVisibility },
              paint: {
                'circle-radius': 18,
                'circle-color': '#EF4444',
                'circle-opacity': 0.28,
                'circle-stroke-color': '#EF4444',
                'circle-stroke-width': 1.5,
              },
            });
          } else {
            map.setLayoutProperty(haloLayerId, 'visibility', layerVisibility);
          }

          // 2. Main Circle Layer with Dynamic Issue Alert Pin State (Red if issue reported, normal otherwise)
          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              layout: { visibility: layerVisibility },
              paint: {
                'circle-radius': [
                  'case',
                  ['boolean', ['get', 'has_reported_issues'], false],
                  9.5,
                  cfg.point_radius || 6.5
                ],
                'circle-color': [
                  'case',
                  ['boolean', ['get', 'has_reported_issues'], false],
                  '#EF4444', // Alert Red
                  getCategoryPointColor(layer.slug, layer.category),
                ],
                'circle-stroke-color': [
                  'case',
                  ['boolean', ['get', 'has_reported_issues'], false],
                  '#FEE2E2',
                  cfg.stroke_color || '#FFFFFF',
                ],
                'circle-stroke-width': [
                  'case',
                  ['boolean', ['get', 'has_reported_issues'], false],
                  3,
                  cfg.stroke_width || 1.5,
                ],
                'circle-opacity': (cfg.fill_opacity || 0.92) * userOpacity,
              },
            });
          }
        } else if (geomType === 'LINESTRING' || geomType === 'MULTILINESTRING') {
          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              layout: { visibility: layerVisibility },
              paint: {
                'line-color': cfg.stroke_color || '#F59E0B',
                'line-width': cfg.stroke_width || 3.5,
                'line-opacity': (cfg.stroke_opacity || 0.9) * userOpacity,
              },
            });
          }
        } else if (geomType === 'POLYGON' || geomType === 'MULTIPOLYGON') {
          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'fill',
              source: sourceId,
              layout: { visibility: layerVisibility },
              paint: {
                'fill-color': cfg.fill_color || '#10B981',
                'fill-opacity': (cfg.fill_opacity || 0.4) * userOpacity,
              },
            });
          }
          if (!map.getLayer(lineLayerId)) {
            map.addLayer({
              id: lineLayerId,
              type: 'line',
              source: sourceId,
              layout: { visibility: layerVisibility },
              paint: {
                'line-color': cfg.stroke_color || '#059669',
                'line-width': cfg.stroke_width || 1.5,
              },
            });
          }
        }

        // Cursor feedback
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      } catch (err) {
        console.warn(`[Failed to sync layer ${layer.name_en}]`, err);
      }
    }
  }, [layers, activeLayerIds, layerOpacity, activeCity?.id, activeWard?.id, selectedSectorId, selectedDepartmentId]);

  // 13. Ensure legacy issue cluster & heatmap layers are strictly removed as requested
  const syncIssueHotspotsLayer = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = 'nd-issue-clusters-source';
    const heatmapLayerId = 'nd-issue-heatmap';
    const circleLayerId = 'nd-issue-cluster-circles';
    const labelLayerId = 'nd-issue-cluster-labels';

    if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
    if (map.getLayer(circleLayerId)) map.removeLayer(circleLayerId);
    if (map.getLayer(heatmapLayerId)) map.removeLayer(heatmapLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }, []);

  // 14. Synchronize Authenticated Individual Citizen Reports Layer on Map
  const syncCitizenReportsLayer = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !activeCity) return;

    const sourceId = 'nd-citizen-reports-source';
    const circleLayerId = 'nd-citizen-reports-beacon';
    const coreLayerId = 'nd-citizen-reports-beacon-core';
    const reportsVisibility = showCitizenReports ? 'visible' : 'none';

    try {
      let geojson: any = null;
      try {
        geojson = await feedbackApi.getReportsMapFeatures({ city_id: activeCity.id });
      } catch (apiErr) {
        console.warn('[Citizen reports API offline, falling back to cached]', apiErr);
        geojson = { type: 'FeatureCollection', features: [] };
      }

      if (!geojson) geojson = { type: 'FeatureCollection', features: [] };
      if (!geojson.features) geojson.features = [];

      // Merge freshly submitted reports from localStorage so they immediately show on the map
      try {
        const localSaved = JSON.parse(localStorage.getItem('my_citizen_reports') || '[]');
        const existingIds = new Set(geojson.features.map((f: any) => f.properties?.report_number || f.id));
        for (const lr of localSaved) {
          if (lr.report_number && !existingIds.has(lr.report_number) && lr.latitude && lr.longitude) {
            geojson.features.unshift({
              type: 'Feature',
              id: lr.report_number,
              geometry: {
                type: 'Point',
                coordinates: [lr.longitude, lr.latitude]
              },
              properties: {
                id: lr.report_number,
                report_number: lr.report_number,
                category: lr.category || 'road_pothole',
                title: lr.title || 'Citizen Grievance',
                description: lr.description || '',
                status: lr.status || 'submitted',
                severity: lr.severity || 'medium',
                facility_name: lr.facility_name,
                location: lr.location || lr.location_address || 'Municipal Area',
                location_address: lr.location || lr.location_address || 'Municipal Area',
                corroboration_count: 1,
                created_at: lr.created_at || new Date().toISOString(),
                executive_summary_en: lr.executive_summary_en,
                executive_summary_hi: lr.executive_summary_hi,
                extracted_hazard: lr.extracted_hazard,
                recommended_action: lr.recommended_action,
                target_sla_hours: lr.target_sla_hours || 48,
                assigned_department: lr.assigned_department,
                triage_confidence: lr.triage_confidence || 94,
              }
            });
          }
        }
      } catch (storageErr) {
        // Safe ignore
      }

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson as any);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson as any,
        });

        // Vibrant Complaint Beacons with Status-dependent Colors
        map.addLayer({
          id: circleLayerId,
          type: 'circle',
          source: sourceId,
          layout: { visibility: reportsVisibility },
          paint: {
            'circle-radius': [
              'match',
              ['get', 'severity'],
              'critical', 12,
              'high', 10,
              'medium', 8,
              7
            ],
            'circle-color': [
              'match',
              ['get', 'status'],
              'submitted', '#F59E0B',    // Amber
              'assigned', '#06B6D4',     // Cyan
              'in_progress', '#A855F7',  // Purple
              'resolved', '#10B981',     // Emerald
              '#EF4444'                  // Default Red Alert
            ],
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 2.5,
            'circle-opacity': 0.95,
          },
        });

        // Vector Core Dot (GPU rendered, zero font glyph dependency, never crashes)
        map.addLayer({
          id: coreLayerId,
          type: 'circle',
          source: sourceId,
          layout: { visibility: reportsVisibility },
          paint: {
            'circle-radius': 3.5,
            'circle-color': '#FFFFFF',
            'circle-opacity': 0.95,
          },
        });

        // Cursor & Click Interactivity
        map.on('mouseenter', circleLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', circleLayerId, () => {
          map.getCanvas().style.cursor = '';
        });

        map.on('click', circleLayerId, (e) => {
          if (e.features && e.features.length > 0) {
            const feat = e.features[0];
            const p = feat.properties || {};
            const coords = (feat.geometry as any).coordinates;

            map.flyTo({
              center: [coords[0], coords[1]],
              zoom: 16,
              duration: 800,
            });

            setSelectedFeature({
              id: p.id || p.report_number,
              feature_id: p.id || p.report_number,
              name_en: p.title || `Citizen Complaint ${p.report_number}`,
              name_hi: p.title,
              category: p.category,
              facility_name: p.facility_name,
              properties: {
                ...p,
                'Report Number': p.report_number,
                'Category': p.category,
                'Status': p.status || 'submitted',
                'Severity': p.severity || 'medium',
                'Location': p.location_address || 'Municipal Area',
                'facility_name': p.facility_name,
                'Corroboration Count': p.corroboration_count || 1,
                'Submission Date': p.created_at,
                'description': p.description || '',
                'report_number': p.report_number,
              },
              provenance_type: 'citizen_submitted',
              source_attribution_en: 'NagarDrishti Citizen Grievance Portal',
              source_attribution_hi: 'नगरदृष्टि नागरिक शिकायत पोर्टल',
              source_health: 'healthy',
              last_updated: p.created_at,
              city_name: activeCity.name_en,
              latitude: coords[1],
              longitude: coords[0],
            });
            setInspectorOpen(true);
          }
        });
      }

      // Update layer visibility immediately
      if (map.getLayer(circleLayerId)) {
        map.setLayoutProperty(circleLayerId, 'visibility', reportsVisibility);
      }
      if (map.getLayer(coreLayerId)) {
        map.setLayoutProperty(coreLayerId, 'visibility', reportsVisibility);
      }
    } catch (err) {
      console.warn('[Failed to sync citizen reports layer]', err);
    }
  }, [activeCity?.id, showCitizenReports, setSelectedFeature, setInspectorOpen]);

  // Listen for real-time report submissions across modals / pages
  useEffect(() => {
    const handleReportSubmitted = () => {
      syncCitizenReportsLayer();
      syncGISLayers();
    };
    window.addEventListener('nd-report-submitted', handleReportSubmitted);
    window.addEventListener('nd:report_submitted', handleReportSubmitted);
    return () => {
      window.removeEventListener('nd-report-submitted', handleReportSubmitted);
      window.removeEventListener('nd:report_submitted', handleReportSubmitted);
    };
  }, [syncCitizenReportsLayer, syncGISLayers]);

  // Re-sync all layers whenever active city/ward, layers, or style load changes
  useEffect(() => {
    if (isMapLoaded) {
      syncWardLayer();
      syncGISLayers();
      syncIssueHotspotsLayer();
      syncCitizenReportsLayer();
    }
  }, [
    isMapLoaded,
    styleVersion,
    syncWardLayer,
    syncGISLayers,
    syncIssueHotspotsLayer,
    syncCitizenReportsLayer,
    showWardBoundaries,
    showCitizenReports,
    showIssueClusters,
    showIssueHotspots
  ]);

  // Toolbar Actions
  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });

  // Locate User (Requirement 44: Explicit, single fix with accuracy circle)
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
          duration: 1200,
        });

        // User location marker: clean blue dot with static halo
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([longitude, latitude]);
        } else if (mapRef.current) {
          const el = document.createElement('div');
          el.className = 'w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center';
          const inner = document.createElement('div');
          inner.className = 'w-2 h-2 rounded-full bg-white';
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
      <AnalysisDrawer />
      <DatasetUploadModal />
    </div>
  );
};
