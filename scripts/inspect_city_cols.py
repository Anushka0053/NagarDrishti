import sys
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    cols = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'cities'")).fetchall()
    print("cities columns:", [c[0] for c in cols])
    rows = conn.execute(text("SELECT * FROM cities LIMIT 2")).mappings().fetchall()
    for r in rows:
        print(dict(r))

