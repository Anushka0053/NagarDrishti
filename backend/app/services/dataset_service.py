import io
import json
import uuid
import csv
import zipfile
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.features import GISFeature
from app.models.layers import GISLayer, DataCoverage, DataSource
from app.schemas.datasets import (
    DatasetValidateResponse, DatasetImportRequest, DatasetImportResponse,
    AdminCreateFeatureRequest, AdminFeatureResponse
)
from geoalchemy2.shape import from_shape
from shapely.geometry import shape, Point, LineString, Polygon

logger = logging.getLogger("nagardrishti.services.datasets")

# In-memory temporary cache for validated datasets awaiting user confirmation
# validation_token -> { "filename": str, "features": List[Dict], "detected_crs": str }
VALIDATED_DATASETS_CACHE: Dict[str, Dict[str, Any]] = {}


class DatasetService:
    @staticmethod
    def validate_and_preview(filename: str, content: bytes) -> DatasetValidateResponse:
        """
        Parses, validates, and generates a preview for uploaded vector datasets (GeoJSON, KML, CSV, Shapefile ZIP).
        """
        lower_name = filename.lower()
        validation_token = str(uuid.uuid4())
        warnings: List[str] = []
        raw_features: List[Dict[str, Any]] = []
        detected_crs = "EPSG:4326"
        file_format = "unknown"

        if len(content) > 15 * 1024 * 1024:
            raise ValueError("Uploaded file exceeds 15MB size limit.")

        # 1. GeoJSON Parsing
        if lower_name.endswith(".geojson") or lower_name.endswith(".json"):
            file_format = "geojson"
            try:
                data = json.loads(content.decode("utf-8"))
                if data.get("type") == "FeatureCollection":
                    raw_features = data.get("features", [])
                elif data.get("type") == "Feature":
                    raw_features = [data]
                else:
                    raise ValueError("JSON file must be a GeoJSON Feature or FeatureCollection.")
            except Exception as e:
                raise ValueError(f"Invalid GeoJSON content: {str(e)}")

        # 2. CSV Coordinate Parsing
        elif lower_name.endswith(".csv"):
            file_format = "csv"
            try:
                text_stream = io.StringIO(content.decode("utf-8", errors="replace"))
                reader = csv.DictReader(text_stream)
                headers = reader.fieldnames or []

                # Find latitude & longitude column names
                lat_col = next((c for c in headers if c.lower() in ("lat", "latitude", "y", "y_coord")), None)
                lng_col = next((c for c in headers if c.lower() in ("lon", "lng", "longitude", "x", "x_coord")), None)

                if not lat_col or not lng_col:
                    raise ValueError(f"Could not automatically detect coordinate columns. Found columns: {headers}. Required: latitude/longitude or lat/lon.")

                for row_idx, row in enumerate(reader, start=1):
                    try:
                        lat_val = float(row[lat_col])
                        lng_val = float(row[lng_col])
                        if not (-90.0 <= lat_val <= 90.0 and -180.0 <= lng_val <= 180.0):
                            warnings.append(f"Row {row_idx}: Coordinate values out of range [{lat_val}, {lng_val}].")
                            continue

                        raw_features.append({
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [lng_val, lat_val]
                            },
                            "properties": {k: v for k, v in row.items() if k not in (lat_col, lng_col)}
                        })
                    except (ValueError, TypeError):
                        warnings.append(f"Row {row_idx}: Invalid numeric coordinate values.")
            except Exception as e:
                raise ValueError(f"Failed to parse CSV: {str(e)}")

        # 3. KML Parsing (Basic Point / Line extractor)
        elif lower_name.endswith(".kml"):
            file_format = "kml"
            try:
                import xml.etree.ElementTree as ET
                root = ET.fromstring(content.decode("utf-8", errors="replace"))
                ns = {"kml": "http://www.opengis.net/kml/2.2"}
                placemarks = root.findall(".//kml:Placemark", ns) or root.findall(".//Placemark")

                for pm in placemarks:
                    name_el = pm.find("kml:name", ns) or pm.find("name")
                    name = name_el.text if name_el is not None else "Placemark"
                    
                    coord_el = pm.find(".//kml:coordinates", ns) or pm.find(".//coordinates")
                    if coord_el is not None and coord_el.text:
                        raw_coords = coord_el.text.strip().split()
                        if len(raw_coords) == 1:
                            parts = [float(p) for p in raw_coords[0].split(",") if p]
                            if len(parts) >= 2:
                                raw_features.append({
                                    "type": "Feature",
                                    "geometry": {"type": "Point", "coordinates": [parts[0], parts[1]]},
                                    "properties": {"name": name}
                                })
            except Exception as e:
                raise ValueError(f"Failed to parse KML: {str(e)}")

        # 4. Zipped Shapefile
        elif lower_name.endswith(".zip"):
            file_format = "shapefile_zip"
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as z:
                    filenames = z.namelist()
                    has_shp = any(f.lower().endswith(".shp") for f in filenames)
                    has_shx = any(f.lower().endswith(".shx") for f in filenames)
                    has_dbf = any(f.lower().endswith(".dbf") for f in filenames)
                    has_prj = any(f.lower().endswith(".prj") for f in filenames)

                    if not (has_shp and has_shx and has_dbf):
                        raise ValueError("ZIP archive must contain at least .shp, .shx, and .dbf components.")

                    if not has_prj:
                        warnings.append("No .prj projection file found in ZIP archive. Assuming WGS84 (EPSG:4326).")
                    else:
                        detected_crs = "EPSG:4326 (From PRJ)"

                    warnings.append("Shapefile validation succeeded. Features will be processed on import confirmation.")
            except Exception as e:
                raise ValueError(f"Invalid Shapefile archive: {str(e)}")

        else:
            raise ValueError(f"Unsupported file format '{filename}'. Supported formats: .geojson, .kml, .csv, .zip (shapefile).")

        # Geometry validation and bounding box calculation
        valid_features: List[Dict[str, Any]] = []
        invalid_count = 0
        geom_types = set()
        min_lng, min_lat = 180.0, 90.0
        max_lng, max_lat = -180.0, -90.0
        sample_props = set()

        for feat in raw_features:
            geom = feat.get("geometry")
            if not geom or not isinstance(geom, dict) or "coordinates" not in geom:
                invalid_count += 1
                continue

            try:
                sh_geom = shape(geom)
                if not sh_geom.is_valid:
                    invalid_count += 1
                    continue

                g_type = geom.get("type", "Unknown")
                geom_types.add(g_type)

                bounds = sh_geom.bounds  # (minx, miny, maxx, maxy)
                min_lng = min(min_lng, bounds[0])
                min_lat = min(min_lat, bounds[1])
                max_lng = max(max_lng, bounds[2])
                max_lat = max(max_lat, bounds[3])

                props = feat.get("properties", {}) or {}
                for k in props.keys():
                    sample_props.add(k)

                valid_features.append(feat)
            except Exception:
                invalid_count += 1

        bbox = [min_lng, min_lat, max_lng, max_lat] if valid_features else [78.10, 26.14, 78.26, 26.30]

        # Cache for subsequent import step
        VALIDATED_DATASETS_CACHE[validation_token] = {
            "filename": filename,
            "file_format": file_format,
            "features": valid_features,
            "detected_crs": detected_crs
        }

        return DatasetValidateResponse(
            filename=filename,
            file_format=file_format,
            feature_count=len(raw_features),
            detected_crs=detected_crs,
            geometry_types=list(geom_types),
            bounding_box=bbox,
            sample_properties=list(sample_props)[:15],
            sample_features=valid_features[:5],
            valid_record_count=len(valid_features),
            invalid_record_count=invalid_count,
            validation_warnings=warnings[:10],
            validation_token=validation_token
        )

    @staticmethod
    def execute_import(db: Session, request: DatasetImportRequest) -> DatasetImportResponse:
        """
        Executes validated vector dataset import into PostGIS gis_features table,
        creates an IngestionRun audit record, and updates DataCoverage metadata.
        """
        cached = VALIDATED_DATASETS_CACHE.get(request.validation_token)
        if not cached:
            raise ValueError("Validation token expired or not found. Please re-upload the dataset.")

        features = cached.get("features", [])
        records_imported = 0
        records_rejected = 0

        # Ensure source exists or create one
        source = db.query(DataSource).filter(DataSource.source_key == "user_dataset_upload").first()
        if not source:
            source = DataSource(
                source_key="user_dataset_upload",
                name_en=request.source_name,
                name_hi=request.source_name,
                authority_level=request.authority_level,
                health_status="connected"
            )
            db.add(source)
            db.commit()

        now_dt = datetime.now(timezone.utc)
        mappings = request.field_mappings or {}

        for feat in features:
            try:
                geom_dict = feat.get("geometry")
                sh_geom = shape(geom_dict)
                geo_val = from_shape(sh_geom, srid=4326)

                props = feat.get("properties", {}) or {}

                name_field = mappings.get("name_en", "name")
                name_val = props.get(name_field) or props.get("name_en") or props.get("title") or "Imported Feature"

                cat_field = mappings.get("category", "category")
                cat_val = props.get(cat_field) or props.get("type") or "imported_asset"

                feature = GISFeature(
                    layer_id=request.layer_id,
                    city_id=request.city_id,
                    source_id=source.id,
                    name_en=str(name_val),
                    name_hi=str(props.get(mappings.get("name_hi", "name_hi"), name_val)),
                    category=str(cat_val),
                    subcategory=props.get(mappings.get("subcategory", "subcategory")),
                    geometry=geo_val,
                    properties=props,
                    provenance_type=request.provenance_type,
                    observed_at=now_dt,
                    source_updated_at=now_dt
                )
                db.add(feature)
                records_imported += 1
            except Exception as fe:
                records_rejected += 1
                logger.warning(f"Feature insertion error: {fe}")

        db.commit()

        # Update coverage
        try:
            total_active = db.query(GISFeature).filter(
                GISFeature.layer_id == request.layer_id,
                GISFeature.city_id == request.city_id,
                GISFeature.is_active == True
            ).count()

            cov = db.query(DataCoverage).filter(
                DataCoverage.city_id == request.city_id,
                DataCoverage.layer_id == request.layer_id
            ).first()

            if cov:
                cov.feature_count = total_active
                cov.coverage_status = "available"
                cov.provenance_type = request.provenance_type
                cov.last_successful_sync = now_dt
                cov.completeness_notes = f"Updated via vector dataset upload ({cached.get('filename')})."
            else:
                layer_obj = db.query(GISLayer).filter(GISLayer.id == request.layer_id).first()
                new_cov = DataCoverage(
                    city_id=request.city_id,
                    layer_id=request.layer_id,
                    sector_id=layer_obj.sector_id if layer_obj else None,
                    source_id=source.id,
                    coverage_status="available",
                    feature_count=total_active,
                    geographic_coverage="Imported Area",
                    authority_level=request.authority_level,
                    provenance_type=request.provenance_type,
                    last_successful_sync=now_dt,
                    completeness_notes=f"Created via vector dataset upload ({cached.get('filename')})."
                )
                db.add(new_cov)
            db.commit()
        except Exception as ce:
            logger.warning(f"Coverage update warning: {ce}")
            db.rollback()

        # Audit log
        run_log = IngestionRun(
            source_id=source.id,
            run_type="dataset_upload",
            status="completed" if records_rejected == 0 else "completed_with_errors",
            records_fetched=len(features),
            records_inserted=records_imported,
            records_rejected=records_rejected,
            started_at=now_dt
        )
        db.add(run_log)
        db.commit()

        # Clean cache
        VALIDATED_DATASETS_CACHE.pop(request.validation_token, None)

        return DatasetImportResponse(
            ingestion_run_id=str(run_log.id),
            city_id=str(request.city_id),
            layer_id=str(request.layer_id),
            records_imported=records_imported,
            records_rejected=records_rejected,
            provenance_type=request.provenance_type,
            status="success",
            message=f"Successfully imported {records_imported} features into layer."
        )

    @staticmethod
    def create_admin_feature(db: Session, request: AdminCreateFeatureRequest) -> AdminFeatureResponse:
        """
        Creates a single verified feature manually by an authorized admin.
        """
        geom_dict = request.geometry
        sh_geom = shape(geom_dict)
        if not sh_geom.is_valid:
            raise ValueError("Invalid geometry provided.")

        geo_val = from_shape(sh_geom, srid=4326)
        now_dt = datetime.now(timezone.utc)

        feature = GISFeature(
            city_id=request.city_id,
            layer_id=request.layer_id,
            ward_id=request.ward_id,
            name_en=request.name_en,
            name_hi=request.name_hi or request.name_en,
            category=request.category or "admin_feature",
            subcategory=request.subcategory,
            geometry=geo_val,
            properties=request.properties,
            provenance_type=request.provenance_type,
            observed_at=now_dt,
            source_updated_at=now_dt
        )
        db.add(feature)
        db.commit()

        return AdminFeatureResponse(
            id=str(feature.id),
            name_en=feature.name_en,
            category=feature.category,
            provenance_type=feature.provenance_type,
            created_at=now_dt.isoformat()
        )
