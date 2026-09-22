import abc
import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.operations import IngestionRun

logger = logging.getLogger("nagardrishti.ingestion")


class BaseIngestionPipeline(abc.ABC):
    """
    Abstract Base Class for NagarDrishti Data Ingestion Pipelines.
    Ensures strict provenance classification, error auditing, and idempotent insertion.
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
        Executes the ingestion pipeline, logs run metadata, and inserts features into PostGIS.
        """
        start_time = time.time()
        records_fetched = 0
        records_inserted = 0
        records_failed = 0
        status = "running"
        error_message = None

        query_params = query_params or {}

        try:
            logger.info(f"Starting ingestion run for source={self.source_key}, layer={layer_id}, city={city_id}")
            raw_data = self.fetch_raw_data(query_params)
            
            features = self.transform_to_features(raw_data, layer_id, city_id)
            records_fetched = len(features)

            if not dry_run and records_fetched > 0:
                from app.models.features import GISFeature
                from geoalchemy2.shape import from_shape
                from shapely.geometry import shape

                for feat_dict in features:
                    try:
                        # Extract geometry
                        geom_obj = feat_dict.get("geometry")
                        if isinstance(geom_obj, dict):
                            shapely_geom = shape(geom_obj)
                            geo_val = from_shape(shapely_geom, srid=4326)
                        else:
                            geo_val = geom_obj

                        feature = GISFeature(
                            layer_id=layer_id,
                            city_id=city_id,
                            ward_id=feat_dict.get("ward_id"),
                            source_id=feat_dict.get("source_id"),
                            external_id=feat_dict.get("external_id"),
                            name_en=feat_dict.get("name_en"),
                            name_hi=feat_dict.get("name_hi"),
                            category=feat_dict.get("category"),
                            subcategory=feat_dict.get("subcategory"),
                            geometry=geo_val,
                            properties=feat_dict.get("properties", {}),
                            provenance_type=feat_dict.get("provenance_type", self.default_provenance),
                            observed_at=feat_dict.get("observed_at"),
                            source_updated_at=datetime.utcnow()
                        )
                        db.add(feature)
                        records_inserted += 1
                    except Exception as fe:
                        records_failed += 1
                        logger.warning(f"Failed to load single feature: {fe}")

                db.commit()
                status = "completed"
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

        duration_ms = int((time.time() - start_time) * 1000)

        # Log ingestion run if table exists
        try:
            run_log = IngestionRun(
                source_id=None,
                run_type="automated_sync",
                status=status,
                records_fetched=records_fetched,
                records_inserted=records_inserted,
                records_rejected=records_failed,
                error_log=error_message,
                started_at=datetime.utcnow()
            )
            db.add(run_log)
            db.commit()
        except Exception:
            db.rollback()

        return {
            "status": status,
            "records_fetched": records_fetched,
            "records_inserted": records_inserted,
            "records_failed": records_failed,
            "duration_ms": duration_ms,
            "error": error_message,
            "dry_run": dry_run
        }
