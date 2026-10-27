from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
res = db.execute(text("SELECT enum_range(NULL::data_provenance_type)")).scalar()
print("PostgreSQL data_provenance_type values:", res)
db.close()
