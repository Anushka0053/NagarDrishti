import logging
import time
from app.core.database import SessionLocal
from app.models.admin import City
from app.models.layers import GISLayer, DataCoverage
from app.models.features import GISFeature
from app.ingestion.cli import sync_osm_command, resolve_target_layer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("gwalior_ingestion")

def run_gwalior_ingestion():
    db = SessionLocal()
    city = db.query(City).filter(City.slug == "gwalior").first()
    city_id = city.id
    city_name = city.name_en
    db.close()

    print(f"Starting Real Gwalior Ingestion for City ID: {city_id} ({city_name})\n")

    poi_categories = ["health", "education", "safety", "parks", "amenities", "roads"]
    results = []

    for cat in poi_categories:
        print(f"\n=================== SYNCING GWALIOR: {cat.upper()} ===================")
        res = sync_osm_command(city_slug="gwalior", category=cat, dry_run=False)
        time.sleep(2)
        
        # Fresh DB session for metrics verification
        db = SessionLocal()
        layer = resolve_target_layer(db, cat)
        
        total_features = db.query(GISFeature).filter(
            GISFeature.city_id == city_id,
            GISFeature.layer_id == layer.id,
            GISFeature.is_active == True
        ).count()
        
        coverage = db.query(DataCoverage).filter(
            DataCoverage.city_id == city_id,
            DataCoverage.layer_id == layer.id
        ).first()

        results.append({
            "category": cat,
            "layer_slug": layer.slug,
            "layer_name": layer.name_en,
            "fetched": res.get("records_fetched", 0),
            "inserted": res.get("records_inserted", 0),
            "updated": res.get("records_updated", 0),
            "failed": res.get("records_failed", 0),
            "total_db_count": total_features,
            "coverage_status": coverage.coverage_status if coverage else "N/A",
            "provenance": coverage.provenance_type if coverage else "N/A",
        })
        db.close()

    print("\n\n=================== GWALIOR INGESTION AUDIT TABLE ===================")
    print(f"{'Category':<12} | {'Layer Slug':<24} | {'Fetched':<8} | {'Inserted':<8} | {'Updated':<8} | {'Failed':<6} | {'Final Count':<11} | {'Coverage':<10}")
    print("-" * 105)
    for r in results:
        print(f"{r['category']:<12} | {r['layer_slug']:<24} | {r['fetched']:<8} | {r['inserted']:<8} | {r['updated']:<8} | {r['failed']:<6} | {r['total_db_count']:<11} | {r['coverage_status']:<10}")
    print("=======================================================================\n")

if __name__ == "__main__":
    run_gwalior_ingestion()
