from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
res = db.execute(text("SELECT enum_range(NULL::source_authority_level)")).scalar()
print("source_authority_level enum values:", res)
db.close()
