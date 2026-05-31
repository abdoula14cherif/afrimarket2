import os
from dotenv import load_dotenv
load_dotenv()

class Settings:
    APP_NAME = "AfriMarket"
    APP_URL = os.getenv("APP_URL", "http://localhost:8000")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SECRET_KEY = os.getenv("SECRET_KEY", "afrimarket_secret_2026")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8000").split(",")

settings = Settings()
