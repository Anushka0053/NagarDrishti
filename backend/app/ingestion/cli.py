import argparse
import sys
import logging
from app.core.database import SessionLocal
from app.models.admin import City
from app.models.layers import GISLayer
from app.ingestion.osm_pipeline import OSMOverpassPipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("nagardrishti.ingestion.cli")


def run_osm_sync(city_name: str, category: str, dry_run: bool = False):
    db = SessionLocal()
    try:
        city = db.query(City).filter(City.name_en.ilike(f"%{city_name}%")).first()
        if not city:
            logger.error(f"City '{city_name}' not found in database.")
            sys.exit(1)

        layer_slug = f"{category}_infrastructure" if not category.endswith("_infrastructure") else category
        layer = db.query(GISLayer).filter(GISLayer.slug.ilike(f"%{category}%")).first()
        if not layer:
            logger.error(f"Layer for category '{category}' not found in database.")
            sys.exit(1)

        pipeline = OSMOverpassPipeline()
        result = pipeline.run(
            db=db,
            layer_id=layer.id,
            city_id=city.id,
            query_params={"category": category},
            dry_run=dry_run
        )
        logger.info(f"Sync Results: {result}")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="NagarDrishti GIS Data Ingestion Engine CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    osm_parser = subparsers.add_parser("sync-osm", help="Sync OpenStreetMap data for a city and category")
    osm_parser.add_argument("--city", type=str, default="Gwalior", help="City name (e.g. Gwalior)")
    osm_parser.add_argument("--category", type=str, default="health", choices=["health", "education", "safety", "heritage", "civic"], help="Category to sync")
    osm_parser.add_argument("--dry-run", action="store_true", help="Perform dry run without database insertion")

    args = parser.parse_args()

    if args.command == "sync-osm":
        run_osm_sync(city_name=args.city, category=args.category, dry_run=args.dry_run)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
