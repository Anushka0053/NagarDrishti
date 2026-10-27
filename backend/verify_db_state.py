from app.core.database import SessionLocal
from app.models.features import GISFeature
from app.models.layers import GISLayer, DataCoverage
from app.models.admin import City

db = SessionLocal()

print("=================== CURRENT DATABASE STATE ===================")
print(f"{'City':<12} | {'Layer Slug':<25} | {'Count':<6} | {'Coverage Status':<16} | {'Provenance':<16}")
print("-" * 85)

for c in db.query(City).all():
    for l in db.query(GISLayer).all():
        cnt = db.query(GISFeature).filter(
            GISFeature.city_id == c.id,
            GISFeature.layer_id == l.id,
            GISFeature.is_active == True
        ).count()
        cov = db.query(DataCoverage).filter(
            DataCoverage.city_id == c.id,
            DataCoverage.layer_id == l.id
        ).first()
        if cnt > 0 or cov is not None:
            status = cov.coverage_status if cov else "N/A"
            prov = cov.provenance_type if cov else "N/A"
            print(f"{c.slug:<12} | {l.slug:<25} | {cnt:<6} | {status:<16} | {prov:<16}")

print("==============================================================\n")
db.close()
