import uuid
from app.core.database import SessionLocal
from app.models.admin import City
from app.models.layers import GISLayer
from app.models.features import GISFeature
from app.services.spatial_service import SpatialService
from app.schemas.spatial import BufferRequest, ProximityRequest
from geoalchemy2.shape import to_shape

db = SessionLocal()

print("\n=================== REAL POSTGIS SEARCH & SPATIAL ANALYSIS AUDIT ===================")

# 1. Search for imported real OSM facility in Gwalior
gwalior = db.query(City).filter(City.slug == "gwalior").first()
indore = db.query(City).filter(City.slug == "indore").first()

query_term = "arihant"
searched = db.query(GISFeature).filter(
    GISFeature.city_id == gwalior.id,
    GISFeature.name_en.ilike(f"%{query_term}%")
).all()

print(f"\n[1. SEARCH VERIFICATION: Query for '{query_term}' in Gwalior]")
for f in searched:
    pt = to_shape(f.geometry)
    print(f"  • Found: ID={f.id} | Name={f.name_en} | Layer={f.layer.name_en} | Coords=({pt.y:.4f}, {pt.x:.4f}) | Prov={f.provenance_type}")

# 2. Buffer Analysis around Gwalior Maharaj Bada (26.2045, 78.1695) with 2000m radius
health_layer = db.query(GISLayer).filter(GISLayer.slug == "gwalior_hospitals").first()
print("\n[2. BUFFER ANALYSIS: 2000m Geodesic Buffer around Maharaj Bada Gwalior (26.2045, 78.1695)]")
buf_req = BufferRequest(
    origin_latitude=26.2045,
    origin_longitude=78.1695,
    buffer_meters=2000.0,
    city_id=gwalior.id,
    target_layer_ids=[health_layer.id]
)
buffer_res = SpatialService.run_buffer_analysis(db=db, request=buf_req)

print(f"  Total Intersecting Healthcare Facilities: {buffer_res.feature_count}")
print(f"  Coverage Status: {buffer_res.coverage_status}")
for bf in buffer_res.features[:5]:
    print(f"    • {bf.name_en} | Dist: {bf.distance_meters}m | Prov: {bf.provenance_type}")

# 3. Proximity Analysis around Phoolbagh Gwalior (26.2145, 78.1665)
print("\n[3. PROXIMITY ANALYSIS: Healthcare within 3000m of Phoolbagh Gwalior (26.2145, 78.1665)]")
prox_req = ProximityRequest(
    origin_latitude=26.2145,
    origin_longitude=78.1665,
    max_radius_meters=3000.0,
    city_id=gwalior.id,
    layer_id=health_layer.id,
    limit=10
)
prox_res = SpatialService.run_proximity_analysis(db=db, request=prox_req)

print(f"  Total Facilities in Proximity: {prox_res.results_count}")
print(f"  Coverage Status: {prox_res.coverage_status}")
for item in prox_res.results[:5]:
    print(f"    • {item.name_en} | Dist: {item.distance_meters}m | Prov: {item.provenance_type}")

# 4. Proximity Analysis in Second City (Indore)
print("\n[4. SECOND CITY PROXIMITY: Healthcare in Indore within 3000m of Indore Center (22.7196, 75.8577)]")
indore_prox_req = ProximityRequest(
    origin_latitude=22.7196,
    origin_longitude=75.8577,
    max_radius_meters=3000.0,
    city_id=indore.id,
    layer_id=health_layer.id,
    limit=5
)
indore_prox_res = SpatialService.run_proximity_analysis(db=db, request=indore_prox_req)

print(f"  Indore Facilities in Proximity: {indore_prox_res.results_count}")
for item in indore_prox_res.results[:5]:
    print(f"    • {item.name_en} | Dist: {item.distance_meters}m | Prov: {item.provenance_type}")

print("\n====================================================================================\n")
db.close()
