from flask import Flask, render_template, request, redirect, jsonify, make_response
from flask_cors import CORS
from dotenv import load_dotenv
import os, logging, time

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("afrimarket")

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = os.getenv("SECRET_KEY", "afrimarket_secret_2026")
CORS(app, origins=["http://localhost:8000"])

from security import get_current_user

@app.route("/")
def home():
    user = get_current_user(request)
    if user:
        return redirect("/dashboard")
    return render_template("index.html", show_install_prompt=True)

@app.route("/auth")
def auth_page():
    user = get_current_user(request)
    if user:
        return redirect("/dashboard")
    mode = request.args.get("mode", "register")
    return render_template("auth.html", mode=mode)

@app.route("/dashboard")
def dashboard():
    user = get_current_user(request)
    if not user:
        return redirect("/auth?mode=login")
    return render_template("dashboard.html", user=user)

@app.route("/parrainage")
def parrainage():
    user = get_current_user(request)
    if not user:
        return redirect("/auth?mode=login")
    ref = request.args.get("ref")
    return render_template("parrainage.html", user=user, ref=ref)

@app.route("/health")
def health():
    return jsonify({"status": "ok", "app": "AfriMarket"})

@app.errorhandler(404)
def not_found(e):
    return render_template("errors/404.html"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template("errors/500.html"), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)

from routers.auth import auth
app.register_blueprint(auth, url_prefix="/auth")
