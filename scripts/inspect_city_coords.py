import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    rows = conn.execute(text("SELECT id, name_en, slug, center_latitude, center_longitude FROM cities")).mappings().fetchall()
    for r in rows:
        print(f"{r['id']} | {r['name_en']} ({r['slug']}) | lat={r['center_latitude']}, lng={r['center_longitude']}")
