"""
AfriMarket — Application FastAPI principale
"""
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time
import logging

from config import settings
from security import SECURITY_HEADERS
from routers import home, auth, dashboard, parrainage

# ── LOGGING ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger("afrimarket")

# ── RATE LIMITER ─────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── APP ───────────────────────────────────────────────────────────
app = FastAPI(
    title="AfriMarket API",
    version="2.0.0",
    docs_url=None,       # Désactiver Swagger en production
    redoc_url=None,
    openapi_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── MIDDLEWARES ───────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.DEBUG else [
        "afrimarket2.vercel.app",
        "afrimarket2-python.railway.app",
        "localhost",
        "127.0.0.1",
    ]
)

# ── MIDDLEWARE SÉCURITÉ + LOGS ─────────────────────────────────────
@app.middleware("http")
async def security_and_logging_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)

    # Ajouter tous les headers de sécurité
    for key, value in SECURITY_HEADERS.items():
        response.headers[key] = value

    # Log chaque requête
    logger.info(
        f"{request.method} {request.url.path} "
        f"→ {response.status_code} ({duration}ms) "
        f"[{request.client.host if request.client else 'unknown'}]"
    )
    return response

# ── FICHIERS STATIQUES ─────────────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")

# ── TEMPLATES ─────────────────────────────────────────────────────
templates = Jinja2Templates(directory="templates")

# ── ROUTERS ───────────────────────────────────────────────────────
app.include_router(home.router)
app.include_router(auth.router, prefix="/auth")
app.include_router(dashboard.router, prefix="/dashboard")
app.include_router(parrainage.router, prefix="/parrainage")

# ── HEALTH CHECK ─────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}

# ── ERREURS ───────────────────────────────────────────────────────
@app.exception_handler(404)
async def not_found(request: Request, exc):
    return templates.TemplateResponse(
        "errors/404.html",
        {"request": request},
        status_code=404
    )

@app.exception_handler(500)
async def server_error(request: Request, exc):
    logger.error(f"Erreur 500: {exc}")
    return templates.TemplateResponse(
        "errors/500.html",
        {"request": request},
        status_code=500
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )

