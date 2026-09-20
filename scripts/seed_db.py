"""
NagarDrishti — Direct Database Seeder Script (Executes 001_dev_seed.sql)
"""
import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text
from app.core.config import settings

def main():
    seed_sql_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "seeds", "001_dev_seed.sql"))
    if not os.path.exists(seed_sql_path):
        print(f"Error: Seed file not found at {seed_sql_path}")
        sys.exit(1)

    print(f"Reading seed SQL from: {seed_sql_path}")
    with open(seed_sql_path, "r", encoding="utf-8") as f:
        sql_statements = f.read()

    print(f"Connecting to database to execute seed data...")
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text(sql_statements))
            conn.commit()
        print("✓ Development seed data successfully inserted!")
    except Exception as e:
        print(f"✗ Seeding failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
