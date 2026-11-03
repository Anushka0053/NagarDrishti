import sys
sys.path.insert(0, 'backend')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    tables = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")).fetchall()
    print("Found tables:")
    for t in tables:
        tname = t[0]
        try:
            count = conn.execute(text(f'SELECT count(*) FROM "{tname}"')).scalar()
            print(f"  - {tname}: {count} rows")
        except Exception as e:
            print(f"  - {tname}: (error counting: {e})")

