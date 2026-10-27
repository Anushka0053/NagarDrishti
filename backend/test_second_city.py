import logging
import time
from app.core.database import SessionLocal
from app.models.admin import City
from app.models.layers import GISLayer, DataCoverage
from app.models.features import GISFeature
from app.ingestion.cli import sync_osm_command, resolve_target_layer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def test_second_city_ingestion():
    db = SessionLocal()
    indore = db.query(City).filter(City.slug == "indore").first()
    gwalior = db.query(City).filter(City.slug == "gwalior").first()
    indore_id = indore.id
    gwalior_id = gwalior.id
    db.close()

    print(f"\n=================== SECOND CITY TEST: INDORE (City ID: {indore_id}) ===================")

    for cat in ["health", "education"]:
        print(f"\n--- INGESTING INDORE: {cat.upper()} ---")
        res = sync_osm_command(city_slug="indore", category=cat, dry_run=False)
        print(f"Result for Indore/{cat}: {res}")
        time.sleep(2)

    db = SessionLocal()
    print("\n--- VERIFYING INDORE POSTGIS RECORDS ---")
    for cat in ["health", "education"]:
        layer = resolve_target_layer(db, cat)
        indore_feats = db.query(GISFeature).filter(
            GISFeature.city_id == indore_id,
            GISFeature.layer_id == layer.id,
            GISFeature.is_active == True
        ).all()
        gwalior_feats = db.query(GISFeature).filter(
            GISFeature.city_id == gwalior_id,
            GISFeature.layer_id == layer.id,
            GISFeature.is_active == True
        ).all()

        print(f"\n[Category: {cat.upper()} | Layer: {layer.name_en}]")
        print(f"  Indore features count: {len(indore_feats)}")
        print(f"  Gwalior features count: {len(gwalior_feats)}")
        print("  Sample Indore Features:")
        for f in indore_feats[:5]:
            print(f"    • ID={f.external_id} | Name={f.name_en} | CityID={f.city_id} | Prov={f.provenance_type}")

    db.close()

if __name__ == "__main__":
    test_second_city_ingestion()
