import sys
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    cities = conn.execute(text("SELECT id, name_en, slug FROM cities")).fetchall()
    print("Cities in DB:")
    for c in cities:
        print(f"  {c[0]} | {c[1]} | {c[2]}")

