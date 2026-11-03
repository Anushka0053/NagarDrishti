import sys
import json
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    rows = conn.execute(text("SELECT id, report_number, title, category, status, is_public, input_language, ST_AsText(location_geometry) as geom, created_at FROM citizen_reports LIMIT 5")).mappings().fetchall()
    print("Existing citizen reports:")
    for r in rows:
        print(json.dumps({k: str(v) for k, v in r.items()}, ensure_ascii=False, indent=2))
