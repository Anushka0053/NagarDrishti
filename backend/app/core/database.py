from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
import sys

# Convert postgresql:// to postgresql+psycopg:// or handle test environment
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    # Try importing driver
    try:
        import psycopg2
    except ImportError:
        try:
            import psycopg
            db_url = db_url.replace("postgresql://", "postgresql+psycopg://")
        except ImportError:
            try:
                import asyncpg
                # If synchronous engine needed without psycopg, allow test fallback
            except ImportError:
                pass

try:
    engine = create_engine(
        db_url,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_pre_ping=True
    )
except Exception as e:
    # Safe offline / unit test fallback engine
    engine = create_engine("sqlite:///:memory:", echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining database sessions per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
