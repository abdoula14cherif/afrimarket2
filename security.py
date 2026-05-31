"""
AfriMarket — Sécurité : JWT, hashing, validation
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Request
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── JWT ───────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_token_from_request(request: Request) -> Optional[str]:
    """Récupère le token depuis le cookie ou l'header Authorization"""
    # Cookie en priorité
    token = request.cookies.get("access_token")
    if token:
        return token
    # Sinon header
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None

def get_current_user(request: Request) -> Optional[dict]:
    """Retourne l'utilisateur courant ou None si non connecté"""
    token = get_token_from_request(request)
    if not token:
        return None
    try:
        return verify_token(token)
    except Exception:
        return None

def require_auth(request: Request) -> dict:
    """Exige une connexion - lève une exception si non connecté"""
    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Connexion requise"
        )
    return user

# ── HEADERS SÉCURITÉ ─────────────────────────────────────────────
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://leekpay.me https://fonts.googleapis.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://elgbvitijyjriozvzqpf.supabase.co https://leekpay.me; "
        "frame-ancestors 'none';"
    ),
}

