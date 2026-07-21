import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Central app settings.

    DATABASE_URL defaults to a local SQLite file so the project runs with
    zero setup. To migrate to Neon Postgres later, just set DATABASE_URL to
    a postgres connection string (e.g. in a .env file) — no code changes
    needed anywhere else in the app.
    """

    # Neon (and some other providers) hand out connection strings prefixed
    # "postgres://", which SQLAlchemy's psycopg2 dialect rejects — it wants
    # "postgresql://". Normalize so pasting Neon's string as-is just works.
    _raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./rubyz.db")
    DATABASE_URL: str = (
        _raw_db_url.replace("postgres://", "postgresql://", 1)
        if _raw_db_url.startswith("postgres://")
        else _raw_db_url
    )
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")

    # Must match frontend/lib/cart.ts's DELIVERY_FEE constant. Kept here so
    # the backend can independently recompute an order's total server-side
    # (see app/crud/order.py::create_order) instead of trusting the client.
    DELIVERY_FEE: int = int(os.getenv("DELIVERY_FEE", "150"))

    # --- Auth ---
    # JWT_SECRET MUST be overridden in production via the environment / .env
    # file. The fallback below is only for zero-config local development.
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-only-insecure-secret-change-me")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080")  # 7 days
    )

    # Seeded on first startup so there's always an owner account able to log
    # in to the dashboard. Change these in backend/.env for real deployments.
    OWNER_EMAIL: str = os.getenv("OWNER_EMAIL", "owner@rubyzensemble.in")
    OWNER_PASSWORD: str = os.getenv("OWNER_PASSWORD", "RubyzOwner@123")
    OWNER_NAME: str = os.getenv("OWNER_NAME", "RUBYZ Owner")

    # --- Product image storage (Cloudflare R2) ---
    # All four must be set for uploads to go to R2. If any is missing, the
    # upload endpoint falls back to writing to local disk (backend/app/static/uploads)
    # exactly like before, so local dev with zero setup still works.
    R2_ACCOUNT_ID: str = os.getenv("R2_ACCOUNT_ID", "")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    R2_BUCKET_NAME: str = os.getenv("R2_BUCKET_NAME", "")
    # Public base URL the browser can load images from — either your R2.dev
    # subdomain or a custom domain you've mapped to the bucket. No trailing
    # slash.
    R2_PUBLIC_URL: str = os.getenv("R2_PUBLIC_URL", "").rstrip("/")

    @property
    def R2_ENABLED(self) -> bool:
        return bool(
            self.R2_ACCOUNT_ID
            and self.R2_ACCESS_KEY_ID
            and self.R2_SECRET_ACCESS_KEY
            and self.R2_BUCKET_NAME
            and self.R2_PUBLIC_URL
        )

    # --- Payments (Razorpay) ---
    # Use the "rzp_test_..." / test secret from the Razorpay Dashboard
    # (Test Mode) while developing. Swap for the live "rzp_live_..." pair
    # only once you're ready to accept real payments — no code changes
    # needed, the same client is used for both.
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")

    @property
    def RAZORPAY_ENABLED(self) -> bool:
        return bool(self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_SECRET)

    # Separate secret configured in the Razorpay Dashboard (Settings ->
    # Webhooks) when adding the payment.captured webhook endpoint. NOT the
    # same value as RAZORPAY_KEY_SECRET — used only to HMAC-verify the
    # X-Razorpay-Signature header on incoming webhook POSTs (see
    # app/routers/payments.py's webhook route).
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

    @property
    def RAZORPAY_WEBHOOK_ENABLED(self) -> bool:
        return bool(self.RAZORPAY_WEBHOOK_SECRET)

    # --- Shipping (Shiprocket) ---
    # There is no Shiprocket sandbox — these must be real (free-tier is
    # fine) seller-account credentials. Test against throwaway/cancellable
    # orders. Get SHIPROCKET_PICKUP_LOCATION from the Shiprocket panel
    # (Settings -> Company/Pickup Addresses) — it must match the pickup
    # location "nickname" exactly, or shipment creation calls fail.
    SHIPROCKET_EMAIL: str = os.getenv("SHIPROCKET_EMAIL", "")
    SHIPROCKET_PASSWORD: str = os.getenv("SHIPROCKET_PASSWORD", "")
    SHIPROCKET_PICKUP_LOCATION: str = os.getenv("SHIPROCKET_PICKUP_LOCATION", "")
    # The serviceability/rate-check endpoint needs the pickup location's
    # *pincode*, not its nickname (SHIPROCKET_PICKUP_LOCATION above). Get
    # this from the Shiprocket panel: Settings -> Company/Pickup Addresses
    # -> your pickup location's "Pin Code" column. If unset, live rate
    # lookups at checkout are skipped and the flat DELIVERY_FEE is used
    # instead (see app/services/shiprocket.py::get_serviceability) —
    # shipment creation itself still works without this.
    SHIPROCKET_PICKUP_PINCODE: str = os.getenv("SHIPROCKET_PICKUP_PINCODE", "")
    # Shared secret configured in both this app and Shiprocket's webhook
    # settings (Settings -> API -> webhook config) — used to verify that
    # incoming POST /webhooks/shiprocket requests actually come from
    # Shiprocket. See app/routers/shipping.py.
    SHIPROCKET_WEBHOOK_TOKEN: str = os.getenv("SHIPROCKET_WEBHOOK_TOKEN", "")

    @property
    def SHIPROCKET_ENABLED(self) -> bool:
        return bool(
            self.SHIPROCKET_EMAIL
            and self.SHIPROCKET_PASSWORD
            and self.SHIPROCKET_PICKUP_LOCATION
        )


settings = Settings()