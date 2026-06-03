from flask import Blueprint, request, redirect, render_template, jsonify, make_response
from database import get_db
from security import create_access_token, get_current_user
import os, logging

auth = Blueprint("auth", __name__)
logger = logging.getLogger("afrimarket.auth")

@auth.route("/login", methods=["POST"])
def login():
    try:
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        db = get_db()
        result = db.auth.sign_in_with_password({"email": email, "password": password})
        if not result.user:
            return jsonify({"success": False, "error": "Email ou mot de passe incorrect"}), 401
        token = create_access_token({"sub": result.user.id, "email": result.user.email})
        resp = make_response(jsonify({"success": True, "redirect": "/dashboard"}))
        resp.set_cookie("access_token", token, httponly=True, samesite="Lax", max_age=3600)
        logger.info(f"Connexion: {email}")
        return resp
    except Exception as e:
        return jsonify({"success": False, "error": "Email ou mot de passe incorrect"}), 401

@auth.route("/register", methods=["POST"])
def register():
    try:
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        full_name = request.form.get("full_name", "").strip()
        referral_code = request.form.get("referral_code", None)
        if len(password) < 6:
            return jsonify({"success": False, "error": "Mot de passe trop court"}), 400
        db = get_db()
        result = db.auth.sign_up({
            "email": email,
            "password": password,
            "options": {"data": {"full_name": full_name}}
        })
        if not result.user:
            return jsonify({"success": False, "error": "Email deja utilise"}), 400
        db.table("profiles").upsert({
            "id": result.user.id,
            "full_name": full_name,
            "email": email,
            "referred_by": referral_code or None,
            "plan": "free",
            "is_premium": False,
        }).execute()
        return jsonify({"success": True, "redirect": "/auth/verify"})
    except Exception as e:
        return jsonify({"success": False, "error": "Erreur inscription"}), 500

@auth.route("/logout")
def logout():
    resp = make_response(redirect("/"))
    resp.delete_cookie("access_token")
    return resp

@auth.route("/verify")
def verify():
    return render_template("verify.html")
