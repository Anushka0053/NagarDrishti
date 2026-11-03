import sys
import json
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    rows = conn.execute(text("SELECT id, slug, name_en, name_hi, geometry_type, is_active FROM gis_layers")).mappings().fetchall()
    print("All GIS Layers in DB:")
    for r in rows:
        print(f"  {r['id']} | slug={r['slug']} | geom={r['geometry_type']} | {r['name_en']} ({r['name_hi']})")
