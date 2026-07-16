from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# SQLite needs this connect_arg for multithreaded FastAPI access; Postgres
# (Neon) ignores it, so the same code path works for both.
connect_args = {"check_same_thread": False} if is_sqlite else {}

# Neon's pooled connections get dropped/recycled server-side (e.g. behind
# pgbouncer or on scale-to-zero), so a connection that's been sitting idle
# in SQLAlchemy's pool can go stale. pool_pre_ping does a cheap liveness
# check before handing out a connection and transparently reconnects if
# it's gone, and pool_recycle proactively retires connections older than
# 5 minutes so we never hand out one Neon has already closed. Both are
# no-ops for SQLite (single file, no server-side pooling).
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()