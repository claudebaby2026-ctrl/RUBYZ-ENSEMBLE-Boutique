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

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./rubyz.db")
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")

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


settings = Settings()
