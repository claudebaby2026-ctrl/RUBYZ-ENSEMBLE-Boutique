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


def _has_index(engine: Engine, table: str, index_name: str) -> bool:
    inspector = inspect(engine)
    if table not in inspector.get_table_names():
        # Table doesn't exist yet — create_all will make it (via the
        # column's index=True/unique=True) with the index already in
        # place, nothing to migrate.
        return True
    return any(ix["name"] == index_name for ix in inspector.get_indexes(table))


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

    # Payment-replay fix: a given Razorpay payment must only ever back one
    # order. This is the same index name SQLAlchemy's declarative model
    # (Column(..., unique=True, index=True)) auto-generates, so brand new
    # databases (create_all) and pre-existing ones patched here converge on
    # the exact same index instead of ending up with two redundant ones.
    #
    # A plain UNIQUE INDEX is enough — both SQLite and Postgres treat NULLs
    # as distinct for uniqueness purposes, so non-Razorpay/legacy rows with
    # a null razorpay_payment_id are never blocked by each other. The
    # syntax below is identical on SQLite and Postgres, so no dialect
    # branch is needed (like the `discount` column above).
    #
    # Note: if a database somehow already has duplicate non-null
    # razorpay_payment_id values (which shouldn't happen pre-fix, since
    # nothing wrote duplicates on purpose — the bug this closes is a
    # missing *guard*, not intentional duplicate writes), this CREATE
    # UNIQUE INDEX will fail loudly rather than silently leaving the gap
    # open, which is the right failure mode for a data-integrity issue.
    if not _has_index(engine, "orders", "ix_orders_razorpay_payment_id"):
        with engine.begin() as conn:
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS "
                    "ix_orders_razorpay_payment_id ON orders (razorpay_payment_id)"
                )
            )

    # --- Shiprocket integration ---
    # Structured billing address fields on orders.
    for column, coltype in (
        ("billing_pincode", "VARCHAR"),
        ("billing_city", "VARCHAR"),
        ("billing_state", "VARCHAR"),
        ("shiprocket_order_id", "VARCHAR"),
        ("shiprocket_shipment_id", "VARCHAR"),
        ("awb_code", "VARCHAR"),
        ("courier_name", "VARCHAR"),
    ):
        if not _has_column(engine, "orders", column):
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE orders ADD COLUMN {column} {coltype}"))

    if not _has_column(engine, "orders", "shipment_status"):
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE orders ADD COLUMN shipment_status VARCHAR "
                    "DEFAULT 'not_created'"
                )
            )
            conn.execute(
                text(
                    "UPDATE orders SET shipment_status = 'not_created' "
                    "WHERE shipment_status IS NULL"
                )
            )

    # Optional per-product shipping override columns.
    for column in ("weight", "length", "breadth", "height"):
        if not _has_column(engine, "products", column):
            with engine.begin() as conn:
                conn.execute(
                    text(f"ALTER TABLE products ADD COLUMN {column} FLOAT")
                )

    # shipping_defaults table itself is created by Base.metadata.create_all
    # on brand-new databases (see app/models/shipping_defaults.py); nothing
    # to hand-roll here for the table's existence on an upgrade, since
    # create_all also creates missing tables (not just missing columns) on
    # every startup. The seeded rows are handled in app/seed_data.py.
