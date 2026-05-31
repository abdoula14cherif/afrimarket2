from fastapi import APIRouter, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from database import get_db
from security import create_access_token, get_current_user
from config import settings
import logging

router = APIRouter()
templates = Jinja2Templates(directory="templates")
logger = logging.getLogger("afrimarket.auth")

@router.get("/", response_class=HTMLResponse)
async def auth_page(request: Request, mode: str = "register"):
    if get_current_user(request):
        return RedirectResponse(url="/dashboard", status_code=302)
    return templates.TemplateResponse("auth.html", {"request": request, "mode": mode})

@router.post("/login")
async def login(request: Request, email: str = Form(...), password: str = Form(...)):
    try:
        db = get_db()
        result = db.auth.sign_in_with_password({"email": email.strip().lower(), "password": password})
        if not result.user:
            return JSONResponse({"success": False, "error": "Email ou mot de passe incorrect"}, status_code=401)
        token = create_access_token({"sub": result.user.id, "email": result.user.email})
        resp = JSONResponse({"success": True, "redirect": "/dashboard"})
        resp.set_cookie("access_token", token, httponly=True, secure=not settings.DEBUG, samesite="lax", max_age=3600)
        logger.info(f"Connexion: {email}")
        return resp
    except Exception as e:
        return JSONResponse({"success": False, "error": "Email ou mot de passe incorrect"}, status_code=401)

@router.post("/register")
async def register(request: Request, email: str = Form(...), password: str = Form(...),
                   full_name: str = Form(...), referral_code: str = Form(None)):
    try:
        if len(password) < 6:
            return JSONResponse({"success": False, "error": "Mot de passe trop court (min 6 caracteres)"}, status_code=400)
        db = get_db()
        result = db.auth.sign_up({
            "email": email.strip().lower(),
            "password": password,
            "options": {"data": {"full_name": full_name.strip()}}
        })
        if not result.user:
            return JSONResponse({"success": False, "error": "Email deja utilise"}, status_code=400)
        db.table("profiles").upsert({
            "id": result.user.id,
            "full_name": full_name.strip(),
            "email": email.strip().lower(),
            "referred_by": referral_code or None,
            "plan": "free",
            "is_premium": False,
        }).execute()
        logger.info(f"Inscription: {email}")
        return JSONResponse({"success": True, "message": "Compte cree !", "redirect": "/auth/verify"})
    except Exception as e:
        logger.error(f"Erreur inscription: {e}")
        return JSONResponse({"success": False, "error": "Erreur lors de l inscription"}, status_code=500)

@router.get("/logout")
async def logout():
    resp = RedirectResponse(url="/", status_code=302)
    resp.delete_cookie("access_token")
    return resp

@router.get("/verify", response_class=HTMLResponse)
async def verify_page(request: Request):
    return templates.TemplateResponse("verify.html", {"request": request})
