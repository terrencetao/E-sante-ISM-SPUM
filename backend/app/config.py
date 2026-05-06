from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "E-Sante ISM SPUM Backend"
    app_env: str = "dev"
    api_prefix: str = "/api"

    db_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/e_sante_ism_spum"

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 60 * 24

    admin_seed_email: str = "admin-system@local.dev"
    admin_seed_pin: str = "1234"


settings = Settings()
