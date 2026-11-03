import React, { useEffect } from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { Inspector } from '../components/layout/Inspector';
import { AnalyticsDrawer } from '../components/layout/AnalyticsDrawer';
import { MapContainer } from '../components/map/MapContainer';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { useCities, useLayers, useSectors, useDepartments } from '../api/hooks';
import { useLayerStore } from '../store/layerStore';
import { useMapStore } from '../store/mapStore';

export const PublicHomePage: React.FC = () => {
  const { activeCity } = useMapStore();
  const { setLayers } = useLayerStore();

  const { data: cities = [] } = useCities();
  const { data: layers } = useLayers({ city_id: activeCity?.id });
  const { data: sectors = [] } = useSectors();
  const { data: departments = [] } = useDepartments();

  // Sync fetched layers into layerStore
  useEffect(() => {
    if (layers) {
      setLayers(layers);
    }
  }, [layers, setLayers]);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#0B132B]">
      <PublicHeader cities={cities} />
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

