import argparse
import sys
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.admin import City
from app.models.layers import GISLayer, Sector
from app.ingestion.osm_pipeline import OSMOverpassPipeline, OSM_CATEGORY_CONFIG

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("nagardrishti.ingestion.cli")

# Supported canonical CLI categories
SUPPORTED_CATEGORIES = list(OSM_CATEGORY_CONFIG.keys())


def resolve_target_layer(db: Session, category: str) -> Optional[GISLayer]:
    """
    Resolves the intentional target GISLayer for a category in a multi-city architecture.
    Precedence:
    1. Direct candidate layer slug lookup (canonical category slugs first, legacy seeded slugs second).
    2. Sector code matching based on OSM_CATEGORY_CONFIG.
    NEVER falls back to an arbitrary first layer.
    """
    config = OSM_CATEGORY_CONFIG.get(category)
    if not config:
        return None

    # 1. Match candidates
    candidates = config.get("layer_candidates", [])
    for slug in candidates:
        layer = db.query(GISLayer).filter(GISLayer.slug == slug, GISLayer.is_active == True).first()
        if layer:
            return layer

    # 2. Match by sector code
    sector_code = config.get("sector_code")
    if sector_code:
        sector = db.query(Sector).filter(Sector.code == sector_code).first()
        if sector:
            # Match layer with matching sector and appropriate geometry type
            geom_type = "LINESTRING" if category == "roads" else "POINT"
            layer = db.query(GISLayer).filter(
                GISLayer.sector_id == sector.id,
                GISLayer.geometry_type == geom_type,
                GISLayer.is_active == True
            ).first()
            if layer:
                return layer

    return None


def sync_osm_command(city_slug: str, category: str, dry_run: bool = False):
    """
    Executes OSM sync for a given city and category with strict validation.
    """
    if category not in OSM_CATEGORY_CONFIG:
        logger.error(f"Unsupported category '{category}'. Available categories: {SUPPORTED_CATEGORIES}")
        sys.exit(1)

    db = SessionLocal()
    try:
        city = db.query(City).filter(City.slug == city_slug).first()
        if not city:
            logger.error(f"City '{city_slug}' not found in NagarDrishti database.")
            sys.exit(1)

        # Resolve target GIS layer strictly
        layer = resolve_target_layer(db, category)
        if not layer:
            logger.error(f"No configured GIS layer exists for category '{category}'. Aborting ingestion without write.")
            sys.exit(1)

        pipeline = OSMOverpassPipeline()
        try:
            bbox = pipeline.get_city_bbox(city_slug, city)
        except ValueError as ve:
            logger.error(f"Boundary resolution failed: {ve}")
            sys.exit(1)

        logger.info(
            f"Syncing OSM dataset: City={city.name_en} (ID={city.id}), Category='{category}', "
            f"TargetLayer='{layer.name_en}' (Slug={layer.slug}, ID={layer.id}), DryRun={dry_run}"
        )
        result = pipeline.run(
            db=db,
            layer_id=layer.id,
            city_id=city.id,
            query_params={"category": category, "bbox": bbox, "city_slug": city_slug},
            dry_run=dry_run
        )

        logger.info(f"Ingestion outcome for {city_slug}/{category}: {result}")
        return result
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="NagarDrishti Data Ingestion CLI")
    subparsers = parser.add_subparsers(dest="subcommand", help="Available subcommands")

    # sync-osm subcommand
    sync_parser = subparsers.add_parser("sync-osm", help="Sync OpenStreetMap data for a specific city and category")
    sync_parser.add_argument("--city", default="gwalior", help="City slug (e.g. gwalior, indore, bhopal, jabalpur, ujjain)")
    sync_parser.add_argument(
        "--category",
        default="health",
        choices=SUPPORTED_CATEGORIES,
        help="Civic category to sync"
    )
    sync_parser.add_argument("--dry-run", action="store_true", help="Perform query & transformation without saving to database")

    # sync-city subcommand
    city_parser = subparsers.add_parser("sync-city", help="Sync all standard categories for a city")
    city_parser.add_argument("--city", required=True, help="City slug (e.g. gwalior, indore, bhopal)")
    city_parser.add_argument("--dry-run", action="store_true", help="Dry run mode")
    city_parser.add_argument("--include-roads", action="store_true", help="Include roads in multi-category sync")

    args = parser.parse_args()

    if args.subcommand == "sync-osm":
        sync_osm_command(args.city, args.category, dry_run=args.dry_run)
    elif args.subcommand == "sync-city":
        poi_categories = ["health", "education", "safety", "civic", "parks", "transport", "amenities"]
        if args.include_roads:
            poi_categories.append("roads")
        
        logger.info(f"Starting batch city sync for '{args.city}' across {len(poi_categories)} categories...")
        for cat in poi_categories:
            sync_osm_command(args.city, cat, dry_run=args.dry_run)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
