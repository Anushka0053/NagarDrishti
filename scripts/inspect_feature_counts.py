import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    rows = conn.execute(text("""
        SELECT c.name_en as city, l.name_en as layer, count(f.id) as count
        FROM gis_features f
        JOIN cities c ON f.city_id = c.id
        JOIN gis_layers l ON f.layer_id = l.id
        GROUP BY c.name_en, l.name_en
        ORDER BY c.name_en, count DESC
    """)).mappings().fetchall()
    print("GIS features by city and layer:")
    for r in rows:
        print(f"  {r['city']} | {r['layer']} : {r['count']}")

