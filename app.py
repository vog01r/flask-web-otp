import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_from_directory
from flask_login import login_required, current_user
from auth import bp as auth_bp, login_manager, ensure_admin
from models import get_sessionmaker, Token
from totp_utils import SecretVault, parse_otpauth_uri
from PIL import Image
from pyzbar.pyzbar import decode as qr_decode
import pyotp

app = Flask(__name__)
app.register_blueprint(auth_bp)
login_manager.init_app(app)

app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change")
SessionLocal = get_sessionmaker()
FERNET_KEY = os.getenv("FERNET_KEY")
if not FERNET_KEY:
    raise RuntimeError("FERNET_KEY manquant dans l'environnement")
VAULT = SecretVault(FERNET_KEY)

@app.route("/")
@login_required
def dashboard():
    db = SessionLocal()
    try:
        tokens = db.query(Token).filter(Token.owner_id == int(current_user.id)).all()
        
        # Générer les codes TOTP côté serveur pour affichage immédiat
        tokens_with_codes = []
        for tok in tokens:
            secret = VAULT.decrypt(tok.secret_enc)
            totp = pyotp.TOTP(secret, digits=tok.digits, interval=tok.period, digest=tok.algorithm.value)
            code = totp.now()
            remaining = tok.period - (int(datetime.utcnow().timestamp()) % tok.period)
            
            tokens_with_codes.append({
                'token': tok,
                'code': code,
                'remaining': remaining
            })
        
        return render_template("dashboard.html", tokens_data=tokens_with_codes)
    finally:
        db.close()

@app.route("/import", methods=["GET", "POST"])
@login_required
def import_token():
    if request.method == "POST":
        db = SessionLocal()
        try:
            uri = (request.form.get("otpauth_uri") or "").strip()

            if not uri and "qr_image" in request.files:
                f = request.files["qr_image"]
                if f and f.filename:
                    img = Image.open(f.stream)
                    decoded = qr_decode(img)
                    if not decoded:
                        flash("Impossible de lire le QR code.", "warning")
                        return redirect(url_for("import_token"))
                    uri = decoded[0].data.decode()

            if not uri:
                flash("Fournis une URI otpauth ou un QR code.", "warning")
                return redirect(url_for("import_token"))

            try:
                meta = parse_otpauth_uri(uri)
            except Exception as e:
                flash(f"URI invalide: {e}", "danger")
                return redirect(url_for("import_token"))

            secret_enc = VAULT.encrypt(meta["secret"])
            tok = Token(
                owner_id=int(current_user.id),
                issuer=meta["issuer"],
                account_name=meta["account_name"],
                label=meta["label"],
                secret_enc=secret_enc,
                digits=meta["digits"],
                period=meta["period"],
                algorithm=meta["algorithm"],
            )
            db.add(tok)
            db.commit()
            flash("Jeton TOTP importé avec succès.", "success")
            return redirect(url_for("dashboard"))
        finally:
            db.close()

    return render_template("import.html")

@app.route("/api/code/<int:token_id>")
@login_required
def api_code(token_id: int):
    db = SessionLocal()
    try:
        tok = db.get(Token, token_id)
        if not tok or tok.owner_id != int(current_user.id):
            return jsonify({"error": "not found"}), 404

        secret = VAULT.decrypt(tok.secret_enc)
        totp = pyotp.TOTP(secret, digits=tok.digits, interval=tok.period, digest=tok.algorithm.value)
        code = totp.now()
        remaining = tok.period - (int(datetime.utcnow().timestamp()) % tok.period)
        return jsonify({"code": code, "remaining": remaining})
    finally:
        db.close()

@app.route("/api/token/<int:token_id>", methods=["DELETE"])
@login_required
def delete_token(token_id: int):
    db = SessionLocal()
    try:
        tok = db.get(Token, token_id)
        if not tok or tok.owner_id != int(current_user.id):
            return jsonify({"error": "not found"}), 404
        
        db.delete(tok)
        db.commit()
        return jsonify({"success": True})
    finally:
        db.close()

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    ensure_admin()
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    app.run(host=host, port=port, debug=debug)

