import React, { useEffect } from 'react';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { Inspector } from '../components/layout/Inspector';
import { AnalysisDrawer } from '../components/gis/AnalysisDrawer';
import { DatasetUploadModal } from '../components/gis/DatasetUploadModal';
import { MapContainer } from '../components/map/MapContainer';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { useCities, useLayers, useSectors, useDepartments } from '../api/hooks';
import { useLayerStore } from '../store/layerStore';
import { useMapStore } from '../store/mapStore';

export const GovGISExplorerPage: React.FC = () => {
  const { activeCity } = useMapStore();
  const { setLayers } = useLayerStore();

  const { data: cities = [] } = useCities();
  const { data: layers } = useLayers({ city_id: activeCity?.id });
  const { data: sectors = [] } = useSectors();
  const { data: departments = [] } = useDepartments();

  useEffect(() => {
    if (layers) {
      setLayers(layers);
    }
  }, [layers, setLayers]);

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex overflow-hidden relative bg-[#0B132B]">
      <LeftSidebar sectors={sectors} departments={departments} />
      <MapContainer />
      <AnalysisDrawer />
      <Inspector />
      <DatasetUploadModal />
      <FeedbackModal />
    </div>
  );
};

