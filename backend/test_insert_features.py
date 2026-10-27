import traceback
from app.core.database import SessionLocal
from app.models.admin import City
from app.models.layers import GISLayer
from app.ingestion.osm_pipeline import OSMOverpassPipeline
from app.ingestion.cli import resolve_target_layer

db = SessionLocal()
try:
    city = db.query(City).filter(City.slug == "gwalior").first()
    layer = resolve_target_layer(db, "health")
    pipeline = OSMOverpassPipeline()
    bbox = pipeline.get_city_bbox("gwalior", city)
    print(f"Testing fetch and insert for health... Layer: {layer.name_en} ({layer.id}), City: {city.name_en} ({city.id})")
    
    raw = pipeline.fetch_raw_data({"category": "health", "bbox": bbox})
    print(f"Fetched {len(raw.get('elements', []))} raw elements.")
    
    features = pipeline.transform_to_features(raw, layer.id, city.id)
    print(f"Transformed {len(features)} features.")
    
    # Try inserting the first 5 features
    from app.models.features import GISFeature
    from geoalchemy2.shape import from_shape
    from shapely.geometry import shape
    from datetime import datetime, timezone
    
    now_dt = datetime.now(timezone.utc)
    for i, f in enumerate(features[:5]):
        ext_id = f.get("external_id")
        existing = db.query(GISFeature).filter(
            GISFeature.layer_id == layer.id,
            GISFeature.city_id == city.id,
            GISFeature.external_id == ext_id
        ).first()
        
        geom_obj = f.get("geometry")
        shapely_geom = shape(geom_obj)
        geo_val = from_shape(shapely_geom, srid=4326)
        
        if existing:
            print(f"[{i}] Feature {ext_id} already exists, updating...")
            existing.name_en = f.get("name_en")
            existing.name_hi = f.get("name_hi")
            existing.geometry = geo_val
            existing.properties = f.get("properties", {})
        else:
            print(f"[{i}] Feature {ext_id} inserting new: {f.get('name_en')}...")
            feat_rec = GISFeature(
                layer_id=layer.id,
                city_id=city.id,
                external_id=ext_id,
                name_en=f.get("name_en"),
                name_hi=f.get("name_hi"),
                category=f.get("category"),
                subcategory=f.get("subcategory"),
                geometry=geo_val,
                properties=f.get("properties", {}),
                provenance_type="community_open",
                observed_at=now_dt,
                source_updated_at=now_dt
            )
            db.add(feat_rec)
        db.commit()
        print(f"[{i}] Success for {ext_id}")

except Exception as e:
    print("Exception caught:")
    traceback.print_exc()
finally:
    db.close()
