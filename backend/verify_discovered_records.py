from app.core.database import SessionLocal
from app.models.features import GISFeature
from app.models.layers import GISLayer
from app.models.admin import City
from geoalchemy2.shape import to_shape

db = SessionLocal()
city = db.query(City).filter(City.slug == "gwalior").first()

print("\n=================== NEWLY DISCOVERED OSM RECORDS AUDIT (GWALIOR) ===================")

# 1. Healthcare records
health_layer = db.query(GISLayer).filter(GISLayer.slug == "gwalior_hospitals").first()
health_features = db.query(GISFeature).filter(
    GISFeature.city_id == city.id,
    GISFeature.layer_id == health_layer.id,
    GISFeature.external_id.like("osm-%")
).limit(10).all()

print(f"\n[HEALTHCARE - Layer: {health_layer.name_en}] (Total active in layer: {len(health_layer.features)})")
for f in health_features:
    pt = to_shape(f.geometry)
    print(f"  • ID={f.external_id} | Name={f.name_en} | Cat={f.category}/{f.subcategory} | Loc=({pt.y:.4f}, {pt.x:.4f}) | Prov={f.provenance_type}")

# 2. Education records
edu_layer = db.query(GISLayer).filter(GISLayer.slug == "gwalior_education").first()
edu_features = db.query(GISFeature).filter(
    GISFeature.city_id == city.id,
    GISFeature.layer_id == edu_layer.id,
    GISFeature.external_id.like("osm-%")
).limit(10).all()

print(f"\n[EDUCATION - Layer: {edu_layer.name_en}] (Total active in layer: {len(edu_layer.features)})")
for f in edu_features:
    pt = to_shape(f.geometry)
    print(f"  • ID={f.external_id} | Name={f.name_en} | Cat={f.category}/{f.subcategory} | Loc=({pt.y:.4f}, {pt.x:.4f}) | Prov={f.provenance_type}")

# 3. Safety records
safety_layer = db.query(GISLayer).filter(GISLayer.slug == "gwalior_police_stations").first()
safety_features = db.query(GISFeature).filter(
    GISFeature.city_id == city.id,
    GISFeature.layer_id == safety_layer.id,
    GISFeature.external_id.like("osm-%")
).all()

print(f"\n[SAFETY - Layer: {safety_layer.name_en}] (Total active in layer: {len(safety_layer.features)})")
for f in safety_features:
    pt = to_shape(f.geometry)
    print(f"  • ID={f.external_id} | Name={f.name_en} | Cat={f.category}/{f.subcategory} | Loc=({pt.y:.4f}, {pt.x:.4f}) | Prov={f.provenance_type}")

# 4. Urban Assets / Parks records
asset_layer = db.query(GISLayer).filter(GISLayer.slug == "gwalior_urban_assets").first()
asset_features = db.query(GISFeature).filter(
    GISFeature.city_id == city.id,
    GISFeature.layer_id == asset_layer.id,
    GISFeature.external_id.like("osm-%")
).limit(10).all()

print(f"\n[CIVIC & PARKS - Layer: {asset_layer.name_en}] (Total active in layer: {len(asset_layer.features)})")
for f in asset_features:
    pt = to_shape(f.geometry)
    print(f"  • ID={f.external_id} | Name={f.name_en} | Cat={f.category}/{f.subcategory} | Loc=({pt.y:.4f}, {pt.x:.4f}) | Prov={f.provenance_type}")

print("\n====================================================================================\n")
db.close()
