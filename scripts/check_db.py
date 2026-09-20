"""
NagarDrishti — Database Connection & PostGIS Health Check Script
"""
import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text
from app.core.config import settings

def main():
    print("=" * 60)
    print("NAGARDRISHTI — POSTGIS DATABASE HEALTH CHECK")
    print(f"Connecting to: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    print("=" * 60)

    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # 1. Check PostgreSQL version
            pg_ver = conn.execute(text("SELECT version();")).fetchone()[0]
            print(f"✓ PostgreSQL: {pg_ver.split(',')[0]}")

            # 2. Check PostGIS extension
            postgis_ver = conn.execute(text("SELECT PostGIS_Full_Version();")).fetchone()[0]
            print(f"✓ PostGIS: {postgis_ver}")

            # 3. Check Table counts
            tables = [
                "admin_units", "cities", "wards", "sectors", 
                "departments", "data_sources", "gis_layers", 
                "gis_features", "citizen_reports", "issue_clusters"
            ]
            print("\nTable Status:")
            for tbl in tables:
                try:
                    count = conn.execute(text(f"SELECT count(*) FROM {tbl};")).fetchone()[0]
                    print(f"  • {tbl.ljust(20)}: {count} rows")
                except Exception as e:
                    print(f"  ✗ {tbl.ljust(20)}: Table missing or query error ({e})")

        print("\n✓ Database check completed successfully.")
    except Exception as e:
        print(f"\n✗ Database connection failed: {e}")
        print("\nTIP: Ensure your Supabase / PostgreSQL credentials in backend/.env or .env are correct.")
        sys.exit(1)

if __name__ == "__main__":
    main()
