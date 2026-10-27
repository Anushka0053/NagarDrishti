import abc
import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.operations import IngestionRun
from app.models.layers import DataCoverage, GISLayer

logger = logging.getLogger("nagardrishti.ingestion")


class BaseIngestionPipeline(abc.ABC):
    """
    Abstract Base Class for NagarDrishti Data Ingestion Pipelines.
    Ensures strict provenance classification, error auditing, deduplication, and coverage auto-updates.
    """

    def __init__(self, source_key: str, default_provenance: str = "community_open"):
        self.source_key = source_key
        self.default_provenance = default_provenance

    @abc.abstractmethod
    def fetch_raw_data(self, query_params: Dict[str, Any]) -> Any:
        """Fetch raw data from upstream API, file, or remote GIS endpoint."""
        pass

    @abc.abstractmethod
    def transform_to_features(self, raw_data: Any, layer_id: uuid.UUID, city_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Transform raw data into standardized GISFeature dictionary payloads."""
        pass

    def run(
        self,
        db: Session,
        layer_id: uuid.UUID,
        city_id: uuid.UUID,
        query_params: Optional[Dict[str, Any]] = None,
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Executes the ingestion pipeline, performs stable upsert deduplication,
        logs run metadata to `ingestion_runs`, and auto-updates `data_coverage`.
        """
        start_time = time.time()
        records_fetched = 0
        records_inserted = 0
        records_updated = 0
        records_failed = 0
        status = "running"
        error_message = None

        query_params = query_params or {}
        from app.models.layers import DataSource
        ds_rec = db.query(DataSource).filter(DataSource.source_key == self.source_key).first()
        if not ds_rec:
            raise ValueError("Register the ingestion source first")
        source_id = ds_rec.id

        try:
            logger.info(f"Starting ingestion run for source={self.source_key}, layer={layer_id}, city={city_id}")
            raw_data = self.fetch_raw_data(query_params)
            
            features = self.transform_to_features(raw_data, layer_id, city_id)
            records_fetched = len(features)

            if not dry_run and records_fetched > 0:
                from app.models.features import GISFeature
                from geoalchemy2.shape import from_shape
                from shapely.geometry import shape
                from app.models.layers import DataSource

                ds_rec = db.query(DataSource).filter(DataSource.source_key == self.source_key).first()
                default_source_id = ds_rec.id if ds_rec else None
                existing_by_id = {f.external_id: f for f in db.query(GISFeature).filter(
                    GISFeature.layer_id == layer_id, GISFeature.city_id == city_id).all()}
                target_layer = db.get(GISLayer, layer_id)

                for i, feat_dict in enumerate(features):
                    try:
                        ext_id = feat_dict.get("external_id")
                        existing_feat = None
                        if ext_id:
                            existing_feat = existing_by_id.get(ext_id)

                        geom_obj = feat_dict.get("geometry")
                        if isinstance(geom_obj, dict):
                            shapely_geom = shape(geom_obj)
                            layer = target_layer
                            if shapely_geom.is_empty or not shapely_geom.is_valid or shapely_geom.geom_type.upper() != layer.geometry_type.upper():
                                raise ValueError("Invalid geometry or target-layer geometry mismatch")
                            geo_val = from_shape(shapely_geom, srid=4326)
                        else:
                            geo_val = geom_obj

                        now_dt = datetime.now(timezone.utc)

                        if existing_feat:
                            # Update existing record
                            existing_feat.name_en = feat_dict.get("name_en")
                            existing_feat.name_hi = feat_dict.get("name_hi")
                            existing_feat.category = feat_dict.get("category", existing_feat.category)
                            existing_feat.subcategory = feat_dict.get("subcategory", existing_feat.subcategory)
                            existing_feat.geometry = geo_val
                            existing_feat.properties = feat_dict.get("properties", existing_feat.properties)
                            existing_feat.source_updated_at = now_dt
                            records_updated += 1
                        else:
                            # Insert new feature
                            feature = GISFeature(
                                layer_id=layer_id,
                                city_id=city_id,
                                ward_id=feat_dict.get("ward_id"),
                                source_id=feat_dict.get("source_id") or default_source_id,
                                external_id=ext_id,
                                name_en=feat_dict.get("name_en"),
                                name_hi=feat_dict.get("name_hi"),
                                category=feat_dict.get("category"),
                                subcategory=feat_dict.get("subcategory"),
                                geometry=geo_val,
                                properties=feat_dict.get("properties", {}),
                                provenance_type=feat_dict.get("provenance_type", self.default_provenance),
                                observed_at=feat_dict.get("observed_at"),
                                source_updated_at=now_dt
                            )
                            db.add(feature)
                            existing_by_id[ext_id] = feature
                            records_inserted += 1


                    except Exception as fe:
                        records_failed += 1
                        logger.warning(f"Failed to load single feature: {fe}")
                        db.rollback()
                        raise

                db.commit()
                status = "completed"

                # Auto-update Data Coverage record
                try:
                    total_count = db.query(GISFeature).filter(
                        GISFeature.layer_id == layer_id,
                        GISFeature.city_id == city_id,
                        GISFeature.is_active == True
                    ).count()

                    cov_rec = db.query(DataCoverage).filter(
                        DataCoverage.city_id == city_id,
                        DataCoverage.layer_id == layer_id
                    ).first()

                    now_dt = datetime.now(timezone.utc)
                    # For community_open / automated OSM datasets, coverage is conservative (partial)
                    status_val = "partial" if total_count > 0 else "unavailable"
                    notes_val = (
                        f"Community-maintained dataset ({self.source_key}). "
                        f"Coverage is partial and subject to volunteer mapping density. "
                        f"Total active features: {total_count}."
                    )

                    if cov_rec:
                        cov_rec.feature_count = total_count
                        cov_rec.coverage_status = status_val
                        cov_rec.last_successful_sync = now_dt
                        cov_rec.completeness_notes = notes_val
                        cov_rec.source_id = source_id
                        cov_rec.provenance_type = self.default_provenance
                        cov_rec.authority_level = "community_open"
                    else:
                        layer_obj = db.query(GISLayer).filter(GISLayer.id == layer_id).first()
                        new_cov = DataCoverage(
                            city_id=city_id,
                            layer_id=layer_id,
                            sector_id=layer_obj.sector_id if layer_obj else None,
                            source_id=source_id,
                            coverage_status=status_val,
                            feature_count=total_count,
                            geographic_coverage="Configured city query envelope",
                            authority_level="community_open",
                            provenance_type=self.default_provenance,
                            last_successful_sync=now_dt,
                            completeness_notes=notes_val
                        )
                        db.add(new_cov)
                    db.commit()
                except Exception as ce:
                    logger.warning(f"Failed to auto-update data coverage metadata: {ce}")
                    db.rollback()

            elif dry_run:
                status = "dry_run_completed"
                records_inserted = records_fetched
            else:
                status = "no_data"

        except Exception as e:
            logger.error(f"Ingestion pipeline run failed: {e}", exc_info=True)
            db.rollback()
            status = "failed"
            error_message = str(e)
            records_inserted = 0
            records_updated = 0

        duration_ms = int((time.time() - start_time) * 1000)

        # Log ingestion run
        try:
            if dry_run:
                return {"status": status, "records_fetched": records_fetched, "records_inserted": 0, "records_updated": 0, "records_failed": records_failed, "duration_ms": duration_ms, "error": error_message, "dry_run": True}
            run_log = IngestionRun(
                source_id=source_id,
                run_type="automated_sync",
                status="completed" if status == "no_data" else status,
                records_fetched=records_fetched,
                records_inserted=records_inserted,
                records_updated=records_updated,
                records_quarantined=records_failed,
                error_summary=error_message,
                completed_at=datetime.now(timezone.utc),
                execution_metadata={"city_id": str(city_id), "layer_id": str(layer_id), **query_params},
                started_at=datetime.fromtimestamp(start_time, timezone.utc)
            )
            db.add(run_log)
            db.commit()
        except Exception:
            db.rollback()
            logger.exception("Could not persist ingestion audit log")

        return {
            "status": status,
            "records_fetched": records_fetched,
            "records_inserted": records_inserted,
            "records_updated": records_updated,
            "records_failed": records_failed,
            "duration_ms": duration_ms,
            "error": error_message,
            "dry_run": dry_run
        }
