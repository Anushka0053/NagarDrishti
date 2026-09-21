import React, { useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { Inspector } from '../components/layout/Inspector';
import { AnalyticsDrawer } from '../components/layout/AnalyticsDrawer';
import { MapContainer } from '../components/map/MapContainer';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { useCities, useLayers, useSectors, useDepartments } from '../api/hooks';
import { useLayerStore } from '../store/layerStore';
import { useMapStore } from '../store/mapStore';

export const DashboardPage: React.FC = () => {
  const { activeCity } = useMapStore();
  const { setLayers } = useLayerStore();

  const { data: cities = [] } = useCities();
  const { data: layers = [] } = useLayers({ city_id: activeCity?.id });
  const { data: sectors = [] } = useSectors();
  const { data: departments = [] } = useDepartments();

  // Sync fetched layers into layerStore
  useEffect(() => {
    if (layers && layers.length > 0) {
      setLayers(layers);
    }
  }, [layers, setLayers]);

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
