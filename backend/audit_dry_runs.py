import sys
import logging
from app.core.database import SessionLocal
from app.models.admin import City
from app.models.layers import GISLayer
from app.ingestion.osm_pipeline import OSMOverpassPipeline, OSM_CATEGORY_CONFIG
from app.ingestion.cli import resolve_target_layer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("dry_run_tester")

def run_dry_runs():
    db = SessionLocal()
    pipeline = OSMOverpassPipeline()
    city = db.query(City).filter(City.slug == "gwalior").first()
    if not city:
        print("Gwalior not found in DB!")
        return

    bbox = pipeline.get_city_bbox("gwalior", city)
    print(f"\n=======================================================")
    print(f"GWALIOR DRY RUN AUDIT: BBox = {bbox}")
    print(f"=======================================================\n")

    categories = ["health", "education", "safety", "parks", "transport", "amenities", "roads"]
    summary = []

    for cat in categories:
        import time
        time.sleep(1.5)
        layer = resolve_target_layer(db, cat)
        print(f"\n--- CATEGORY: {cat.upper()} ---")
        print(f"Resolved Target Layer: {layer.name_en if layer else 'NONE'} (slug={layer.slug if layer else 'NONE'})")
        
        raw_data = pipeline.fetch_raw_data({"category": cat, "bbox": bbox, "city_slug": "gwalior"})
        elements = raw_data.get("elements", [])
        
        node_count = sum(1 for e in elements if e.get("type") == "node")
        way_count = sum(1 for e in elements if e.get("type") == "way")
        rel_count = sum(1 for e in elements if e.get("type") == "relation")
        
        features = pipeline.transform_to_features(raw_data, layer.id if layer else None, city.id)
        
        named_count = sum(1 for f in features if f.get("name_en") is not None)
        unnamed_count = sum(1 for f in features if f.get("name_en") is None)
        
        print(f"Raw Elements: Total={len(elements)} (Nodes={node_count}, Ways={way_count}, Relations={rel_count})")
        print(f"Transformed Features: Total={len(features)} (Named={named_count}, Unnamed={unnamed_count})")
        
        summary.append({
            "category": cat,
            "layer": layer.slug if layer else None,
            "raw_total": len(elements),
            "nodes": node_count,
            "ways": way_count,
            "relations": rel_count,
            "transformed": len(features),
            "named": named_count,
            "unnamed": unnamed_count,
        })

    print("\n\n=================== DRY RUN SUMMARY TABLE ===================")
    print(f"{'Category':<12} | {'Layer Slug':<24} | {'Raw':<5} | {'Node':<5} | {'Way':<5} | {'Rel':<4} | {'Transformed':<11} | {'Named':<5} | {'Unnamed':<7}")
    print("-" * 95)
    for s in summary:
        print(f"{s['category']:<12} | {s['layer']:<24} | {s['raw_total']:<5} | {s['nodes']:<5} | {s['ways']:<5} | {s['relations']:<4} | {s['transformed']:<11} | {s['named']:<5} | {s['unnamed']:<7}")
    print("=============================================================\n")

    db.close()

if __name__ == "__main__":
    run_dry_runs()
