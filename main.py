from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import time, logging

from config import settings
from security import SECURITY_HEADERS
from routers import home, auth, dashboard, parrainage

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("afrimarket")

app = FastAPI(title="AfriMarket", version="2.0.0", docs_url=None, redoc_url=None, openapi_url=None)

app.add_middleware(CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET","POST","PUT","DELETE"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    for k, v in SECURITY_HEADERS.items():
        response.headers[k] = v
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({round((time.time()-start)*1000)}ms)")
    return response

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.include_router(home.router)
app.include_router(auth.router,       prefix="/auth")
app.include_router(dashboard.router,  prefix="/dashboard")
app.include_router(parrainage.router, prefix="/parrainage")

@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}

@app.exception_handler(404)
async def not_found(request: Request, exc):
    return templates.TemplateResponse("errors/404.html", {"request": request}, status_code=404)

@app.exception_handler(500)
async def server_error(request: Request, exc):
    return templates.TemplateResponse("errors/500.html", {"request": request}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
