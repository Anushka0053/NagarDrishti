import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, UploadCloud, FileText, CheckCircle2, AlertTriangle, 
  Layers, ShieldCheck, ArrowRight, Database, Loader2
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { datasetsApi } from '../../api/datasets';
import { DatasetValidateResponse, ProvenanceType } from '../../types';

export const DatasetUploadModal: React.FC = () => {
  const { t } = useTranslation();
  const { isUploadModalOpen, setUploadModalOpen, activeCity } = useMapStore();

  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<DatasetValidateResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [sourceName, setSourceName] = useState<string>('Municipal Department Open Data Registry');
  const [targetLayerId, setTargetLayerId] = useState<string>('fa000000-0000-0000-0000-000000000005');
  const [provenanceType, setProvenanceType] = useState<ProvenanceType>('official_verified');
  const [nameField, setNameField] = useState<string>('');
  const [categoryField, setCategoryField] = useState<string>('');

  if (!isUploadModalOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewData(null);
      setErrorMsg(null);
      setSuccessMsg(null);

      setIsValidating(true);
      try {
        const preview = await datasetsApi.validateDataset(selectedFile);
        setPreviewData(preview);
        if (preview.sample_properties.length > 0) {
          setNameField(preview.sample_properties[0]);
          setCategoryField(preview.sample_properties[1] || preview.sample_properties[0]);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'File validation failed');
      } finally {
        setIsValidating(false);
      }
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !activeCity?.id) return;
    setIsImporting(true);
    setErrorMsg(null);
    try {
      const res = await datasetsApi.importDataset({
        validation_token: previewData.validation_token,
        city_id: activeCity.id,
        layer_id: targetLayerId,
        source_name: sourceName,
        provenance_type: provenanceType,
        authority_level: 'verified_urban_local_body',
        field_mappings: {
          name_en: nameField,
          category: categoryField,
        },
      });
      setSuccessMsg(`Import Complete: ${res.records_imported} features imported into PostGIS.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Dataset import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setUploadModalOpen(false);
    setFile(null);
    setPreviewData(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#0B132B] border border-[#2E3D60] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#2E3D60] flex items-center justify-between bg-[#1C2541]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                Vector Dataset Upload & Ingestion Wizard
              </h3>
              <p className="text-xs text-slate-400">
                Target: {activeCity?.name_en} • Supports GeoJSON, KML, CSV & Shapefile ZIP
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#2E3D60] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* File Upload Zone */}
          {!previewData && (
            <div className="border-2 border-dashed border-[#2E3D60] hover:border-cyan-500/50 rounded-xl p-8 text-center bg-[#1C2541]/30 transition-colors">
              <input
                type="file"
                id="dataset-upload"
                accept=".geojson,.json,.csv,.kml,.zip"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="dataset-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <UploadCloud className="w-10 h-10 text-cyan-400 mb-1 animate-pulse" />
                <span className="font-medium text-slate-200 text-sm">
                  {file ? file.name : 'Choose GIS Vector Dataset File'}
                </span>
                <span className="text-slate-400 text-xs">
                  GeoJSON (.geojson, .json), CSV (with lat/lon), KML (.kml), or Shapefile ZIP (.zip)
                </span>
                <span className="mt-2 px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 transition-colors">
                  Browse Files
                </span>
              </label>

              {isValidating && (
                <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating CRS, Geometry Bounds & Properties...
                </div>
              )}
            </div>
          )}

          {/* Preview & Field Mapping Step */}
          {previewData && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded">
                  <p className="text-slate-400 text-[10px]">Format</p>
                  <p className="font-bold text-slate-200 uppercase">{previewData.file_format}</p>
                </div>
                <div className="p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded">
                  <p className="text-slate-400 text-[10px]">Total Features</p>
                  <p className="font-bold text-cyan-400">{previewData.valid_record_count}</p>
                </div>
                <div className="p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded">
                  <p className="text-slate-400 text-[10px]">CRS</p>
                  <p className="font-bold text-emerald-400 truncate">{previewData.detected_crs}</p>
                </div>
                <div className="p-2.5 bg-[#1C2541] border border-[#2E3D60] rounded">
                  <p className="text-slate-400 text-[10px]">Geometry</p>
                  <p className="font-bold text-amber-400">{previewData.geometry_types.join(', ')}</p>
                </div>
              </div>

              {/* Target Configuration */}
              <div className="space-y-3 bg-[#1C2541]/40 border border-[#2E3D60] p-4 rounded-lg">
                <h4 className="font-semibold text-slate-200 text-xs">Dataset Lineage & Destination Layer</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Source Agency / Dataset Name</label>
                    <input
                      type="text"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      className="w-full bg-[#1C2541] border border-[#2E3D60] rounded p-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Assigned Provenance Classification</label>
                    <select
                      value={provenanceType}
                      onChange={(e) => setProvenanceType(e.target.value as ProvenanceType)}
                      className="w-full bg-[#1C2541] border border-[#2E3D60] rounded p-2 text-slate-100"
                    >
                      <option value="official_verified">Official Govt Verified</option>
                      <option value="community_open">Community Open Data</option>
                      <option value="development_fixture">Development Fixture</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Target GIS Layer</label>
                    <select
                      value={targetLayerId}
                      onChange={(e) => setTargetLayerId(e.target.value)}
                      className="w-full bg-[#1C2541] border border-[#2E3D60] rounded p-2 text-slate-100"
                    >
                      <option value="fa000000-0000-0000-0000-000000000005">Civic Assets, Parks & Heritage</option>
                      <option value="fa000000-0000-0000-0000-000000000002">Hospitals & Healthcare Centers</option>
                      <option value="fa000000-0000-0000-0000-000000000003">Education & Universities</option>
                      <option value="fa000000-0000-0000-0000-000000000004">Police Stations & Safety</option>
                      <option value="fa000000-0000-0000-0000-000000000001">Major Urban Roads</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Feature Name Field (from file)</label>
                    <select
                      value={nameField}
                      onChange={(e) => setNameField(e.target.value)}
                      className="w-full bg-[#1C2541] border border-[#2E3D60] rounded p-2 text-slate-100"
                    >
                      {previewData.sample_properties.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2E3D60] bg-[#1C2541]/80 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
          >
            Cancel
          </button>

          {previewData && (
            <button
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {isImporting ? 'Ingesting into PostGIS...' : `Confirm & Ingest ${previewData.valid_record_count} Features`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
