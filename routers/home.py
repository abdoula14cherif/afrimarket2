from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from security import get_current_user

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    if get_current_user(request):
        return RedirectResponse(url="/dashboard", status_code=302)
    return templates.TemplateResponse("index.html", {
        "request": request,
        "show_install_prompt": True,
    })
