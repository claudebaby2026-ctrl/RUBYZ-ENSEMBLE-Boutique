"""Tiny, dependency-free "migrations" for the handful of schema tweaks made
after the initial launch.

The project intentionally has no Alembic setup — `Base.metadata.create_all`
handles brand new databases just fine, but it never alters existing tables.
This module patches that gap for the couple of columns we've added since,
so upgrading the code doesn't require anyone to manually touch their DB
(sqlite or Postgres/Neon).
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _has_column(engine: Engine, table: str, column: str) -> bool:
    inspector = inspect(engine)
    if table not in inspector.get_table_names():
        # Table doesn't exist yet — create_all will make it with the
        # column already in place, nothing to migrate.
        return True
    return any(col["name"] == column for col in inspector.get_columns(table))


def run_migrations(engine: Engine) -> None:
    if not _has_column(engine, "orders", "created_at"):
        is_sqlite = engine.dialect.name == "sqlite"
        with engine.begin() as conn:
            if is_sqlite:
                # SQLite refuses to ADD COLUMN with a non-constant default
                # (CURRENT_TIMESTAMP counts as one) once the table already
                # has rows — it would have to rewrite every row to fill it
                # in. So add the column bare, then backfill separately.
                conn.execute(text("ALTER TABLE orders ADD COLUMN created_at DATETIME"))
                conn.execute(
                    text(
                        "UPDATE orders SET created_at = CURRENT_TIMESTAMP "
                        "WHERE created_at IS NULL"
                    )
                )
            else:
                # Postgres has no such restriction.
                conn.execute(
                    text(
                        "ALTER TABLE orders ADD COLUMN created_at TIMESTAMPTZ "
                        "DEFAULT CURRENT_TIMESTAMP"
                    )
                )
                conn.execute(
                    text(
                        "UPDATE orders SET created_at = CURRENT_TIMESTAMP "
                        "WHERE created_at IS NULL"
                    )
                )

    if not _has_column(engine, "orders", "coupon_code"):
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR"))

    if not _has_column(engine, "orders", "discount"):
        with engine.begin() as conn:
            # Bare ADD COLUMN (no default) works the same way on SQLite and
            # Postgres for a plain integer, so no dialect branch needed here
            # — unlike created_at above, 0 is a constant default.
            conn.execute(text("ALTER TABLE orders ADD COLUMN discount INTEGER DEFAULT 0"))
            conn.execute(text("UPDATE orders SET discount = 0 WHERE discount IS NULL"))

    if not _has_column(engine, "orders", "payment_status"):
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE orders ADD COLUMN payment_status VARCHAR DEFAULT 'paid'")
            )
            conn.execute(
                text("UPDATE orders SET payment_status = 'paid' WHERE payment_status IS NULL")
            )

    if not _has_column(engine, "orders", "razorpay_order_id"):
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE orders ADD COLUMN razorpay_order_id VARCHAR"))

    if not _has_column(engine, "orders", "razorpay_payment_id"):
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE orders ADD COLUMN razorpay_payment_id VARCHAR"))
