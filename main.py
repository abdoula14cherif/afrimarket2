from flask import Flask, render_template, request, redirect, jsonify, make_response
from flask_cors import CORS
from dotenv import load_dotenv
from security import get_current_user, create_access_token
from database import get_db
import os, logging

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("afrimarket")

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = os.getenv("SECRET_KEY", "afrimarket_secret_2026")
CORS(app)

@app.route("/")
def home():
    if get_current_user(request):
        return redirect("/dashboard")
    return render_template("index.html", show_install_prompt=True)

@app.route("/auth")
def auth_page():
    if get_current_user(request):
        return redirect("/dashboard")
    return render_template("auth.html", mode=request.args.get("mode","register"))

@app.route("/auth/verify")
def verify():
    return render_template("verify.html")

@app.route("/auth/logout")
def logout():
    resp = make_response(redirect("/"))
    resp.delete_cookie("access_token")
    return resp

@app.route("/auth/login", methods=["POST"])
def login():
    try:
        email = request.form.get("email","").strip().lower()
        password = request.form.get("password","")
        result = get_db().auth.sign_in_with_password({"email":email,"password":password})
        if not result.user:
            return jsonify({"success":False,"error":"Email ou mot de passe incorrect"}),401
        token = create_access_token({"sub":result.user.id,"email":result.user.email})
        resp = make_response(jsonify({"success":True,"redirect":"/dashboard"}))
        resp.set_cookie("access_token",token,httponly=True,samesite="Lax",max_age=3600)
        return resp
    except:
        return jsonify({"success":False,"error":"Email ou mot de passe incorrect"}),401

@app.route("/auth/register", methods=["POST"])
def register():
    try:
        email = request.form.get("email","").strip().lower()
        password = request.form.get("password","")
        full_name = request.form.get("full_name","").strip()
        ref = request.form.get("referral_code",None)
        if len(password)<6:
            return jsonify({"success":False,"error":"Mot de passe trop court"}),400
        db = get_db()
        result = db.auth.sign_up({"email":email,"password":password,"options":{"data":{"full_name":full_name}}})
        if not result.user:
            return jsonify({"success":False,"error":"Email deja utilise"}),400
        db.table("profiles").upsert({"id":result.user.id,"full_name":full_name,"email":email,"referred_by":ref,"plan":"free","is_premium":False}).execute()
        return jsonify({"success":True,"redirect":"/auth/verify"})
    except Exception as e:
        return jsonify({"success":False,"error":"Erreur inscription"}),500

@app.route("/dashboard")
def dashboard():
    user = get_current_user(request)
    if not user: return redirect("/auth?mode=login")
    return render_template("dashboard.html", user=user)

@app.route("/parrainage")
def parrainage():
    user = get_current_user(request)
    if not user: return redirect("/auth?mode=login")
    return render_template("parrainage.html", user=user, ref=request.args.get("ref"))

@app.route("/profil")
def profil():
    user = get_current_user(request)
    if not user: return redirect("/auth?mode=login")
    return render_template("profil.html", user=user)

@app.route("/messages")
def messages():
    user = get_current_user(request)
    if not user: return redirect("/auth?mode=login")
    return render_template("messages.html", user=user)

@app.route("/gagner")
def gagner():
    user = get_current_user(request)
    if not user: return redirect("/auth?mode=login")
    return render_template("gagner.html", user=user)

@app.route("/formations")
def formations():
    user = get_current_user(request)
    if not user: return redirect("/auth?mode=login")
    return render_template("formations.html", user=user)

@app.route("/cashback")
def cashback():
    user = get_current_user(request)
    if not user: return redirect("/auth?mode=login")
    return render_template("cashback.html", user=user)

@app.route("/boutique")
def boutique():
    return render_template("boutique.html")

@app.route("/boutique-manager")
def boutique_manager():
    user = get_current_user(request)
    if not user: return redirect("/auth?mode=login")
    return render_template("boutique-manager.html", user=user)

@app.route("/pricing")
def pricing():
    return render_template("pricing.html")

@app.route("/historique")
def historique():
    user = get_current_user(request)
    if not user: return redirect("/auth?mode=login")
    return render_template("historique.html", user=user)

@app.route("/admin")
def admin():
    user = get_current_user(request)
    if not user: return redirect("/auth?mode=login")
    return render_template("admin.html", user=user)

@app.route("/health")
def health():
    return jsonify({"status":"ok","app":"AfriMarket"})

@app.errorhandler(404)
def not_found(e):
    return render_template("errors/404.html"),404

@app.errorhandler(500)
def server_error(e):
    return render_template("errors/500.html"),500

if __name__ == "__main__":
    port = int(os.getenv("PORT",8000))
    app.run(host="0.0.0.0",port=port,debug=True)
