import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { Inspector } from '../components/layout/Inspector';
import { AnalyticsDrawer } from '../components/layout/AnalyticsDrawer';
import { MapContainer } from '../components/map/MapContainer';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { civicApi } from '../api/services';
import { useLayerStore } from '../store/layerStore';
import { City, Sector, Department } from '../types';

export const DashboardPage: React.FC = () => {
  const { setLayers } = useLayerStore();
  const [cities, setCities] = useState<City[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    // Initial fetch of master data from API or fallbacks
    civicApi.getCities()
      .then((data) => setCities(data))
      .catch(() => {
        // Safe development fallback
        setCities([
          {
            id: 'c0000000-0000-0000-0000-000000000001',
            name_en: 'Gwalior',
            name_hi: 'ग्वालियर',
            slug: 'gwalior',
            ulb_type: 'nagar_nigam',
            center_latitude: 26.2183,
            center_longitude: 78.1828,
            default_zoom: 12,
            is_reference_city: true,
            is_enabled: true,
          },
          {
            id: 'c0000000-0000-0000-0000-000000000002',
            name_en: 'Indore',
            name_hi: 'इंदौर',
            slug: 'indore',
            ulb_type: 'nagar_nigam',
            center_latitude: 22.7196,
            center_longitude: 75.8577,
            default_zoom: 12,
            is_reference_city: false,
            is_enabled: true,
          },
          {
            id: 'c0000000-0000-0000-0000-000000000003',
            name_en: 'Bhopal',
            name_hi: 'भोपाल',
            slug: 'bhopal',
            ulb_type: 'nagar_nigam',
            center_latitude: 23.2599,
            center_longitude: 77.4126,
            default_zoom: 12,
            is_reference_city: false,
            is_enabled: true,
          },
        ]);
      });

    civicApi.getLayers()
      .then((data) => setLayers(data))
      .catch(() => {
        setLayers([
          {
            id: 'l0000000-0000-0000-0000-000000000001',
            slug: 'gwalior_major_roads',
            name_en: 'Major Urban Roads & Arterials',
            name_hi: 'प्रमुख शहरी एवं मुख्य सड़कें',
            description_en: 'Primary road network with pavement condition in Gwalior',
            description_hi: 'ग्वालियर की मुख्य सड़क प्रणाली एवं स्थिति',
            geometry_type: 'LINESTRING',
            source_type: 'internal_postgis',
            min_zoom: 10,
            max_zoom: 22,
            default_visibility: true,
            is_queryable: true,
            is_clusterable: false,
            style_config: { stroke_color: '#F59E0B' },
            legend_config: { items: [{ label_en: 'Road', label_hi: 'सड़क', color: '#F59E0B' }] },
            freshness_sla_days: 30,
            is_active: true,
          },
          {
            id: 'l0000000-0000-0000-0000-000000000002',
            slug: 'gwalior_hospitals',
            name_en: 'Hospitals & Healthcare Centers',
            name_hi: 'अस्पताल एवं स्वास्थ्य केंद्र',
            description_en: 'Government and major private medical institutions',
            description_hi: 'ग्वालियर के सरकारी एवं प्रमुख अस्पताल',
            geometry_type: 'POINT',
            source_type: 'internal_postgis',
            min_zoom: 11,
            max_zoom: 22,
            default_visibility: true,
            is_queryable: true,
            is_clusterable: false,
            style_config: { point_radius: 7, fill_color: '#EF4444' },
            legend_config: { items: [{ label_en: 'Hospital', label_hi: 'अस्पताल', color: '#EF4444' }] },
            freshness_sla_days: 30,
            is_active: true,
          },
          {
            id: 'l0000000-0000-0000-0000-000000000005',
            slug: 'citizen_issue_clusters',
            name_en: 'Active Civic Issue Clusters',
            name_hi: 'सक्रिय नागरिक समस्या क्लस्टर',
            description_en: 'Real-time clustered citizen feedback and road distress',
            description_hi: 'नागरिक समस्याएं एवं जलभराव क्लस्टर',
            geometry_type: 'POINT',
            source_type: 'internal_postgis',
            min_zoom: 9,
            max_zoom: 22,
            default_visibility: true,
            is_queryable: true,
            is_clusterable: true,
            style_config: { point_radius: 8, fill_color: '#EC4899' },
            legend_config: { items: [{ label_en: 'Cluster', label_hi: 'क्लस्टर', color: '#EC4899' }] },
            freshness_sla_days: 1,
            is_active: true,
          },
        ]);
      });

    civicApi.getSectors()
      .then((data) => setSectors(data))
      .catch(() => {
        setSectors([
          { id: 's1', code: 'transport', name_en: 'Transport & Roads', name_hi: 'परिवहन एवं सड़कें', icon: 'navigation', display_order: 1, color_hex: '#F59E0B', is_active: true },
          { id: 's2', code: 'water_sanitation', name_en: 'Water & Sanitation', name_hi: 'जल एवं स्वच्छता', icon: 'droplet', display_order: 2, color_hex: '#06B6D4', is_active: true },
          { id: 's3', code: 'health', name_en: 'Healthcare & Hospitals', name_hi: 'स्वास्थ्य एवं अस्पताल', icon: 'activity', display_order: 3, color_hex: '#EF4444', is_active: true },
        ]);
      });

    civicApi.getDepartments()
      .then((data) => setDepartments(data))
      .catch(() => {
        setDepartments([
          { id: 'd1', code: 'gmc_water', name_en: 'GMC Water Works', name_hi: 'ग्वालियर जल विभाग', short_name_en: 'GMC Water', is_active: true },
          { id: 'd2', code: 'mp_pwd', name_en: 'Public Works Dept, MP', name_hi: 'म.प्र. लोक निर्माण विभाग', short_name_en: 'MP PWD', is_active: true },
        ]);
      });
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0B132B]">
      <Header cities={cities} />
      <div className="flex-1 flex overflow-hidden relative">
        <LeftSidebar sectors={sectors} departments={departments} />
        <MapContainer />
        <Inspector />
      </div>
      <AnalyticsDrawer />
      <FeedbackModal />
    </div>
  );
};
