import os
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from models import get_sessionmaker, User

bp = Blueprint("auth", __name__)

login_manager = LoginManager()
login_manager.login_view = "auth.login"

SessionLocal = get_sessionmaker()

class LoginUser(UserMixin):
    def __init__(self, user: User):
        self.id = str(user.id)
        self.username = user.username

@login_manager.user_loader
def load_user(user_id):
    db = SessionLocal()
    u = db.get(User, int(user_id))
    db.close()
    return LoginUser(u) if u else None

def ensure_admin():
    db = SessionLocal()
    try:
        username = os.getenv("ADMIN_USER", "admin")
        password = os.getenv("ADMIN_PASSWORD", "change-me")
        u = db.query(User).filter(User.username == username).first()
        if not u:
            u = User(username=username, pw_hash=generate_password_hash(password))
            db.add(u)
            db.commit()
    finally:
        db.close()

@bp.route("/login", methods=["GET", "POST"])
def login():
    ensure_admin()
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        db = SessionLocal()
        try:
            u = db.query(User).filter(User.username == username).first()
            if u and check_password_hash(u.pw_hash, password):
                login_user(LoginUser(u))
                return redirect(url_for("dashboard"))
            flash("Identifiants invalides", "danger")
        finally:
            db.close()
    return render_template("login.html")

@bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))

