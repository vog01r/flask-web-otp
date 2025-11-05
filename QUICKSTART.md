# 🚀 Web OTP - Démarrage Rapide

## Lancement immédiat

```bash
cd flask-web-otp
./start.sh
```

Puis ouvre : **http://127.0.0.1:8000/login**

## Identifiants par défaut

- **Utilisateur** : `admin`
- **Mot de passe** : `TestPassword123!`

## Commandes utiles

### Démarrer l'app
```bash
./start.sh
```

### Générer une nouvelle clé Fernet
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Réinitialiser la DB
```bash
rm otp.db
python app.py  # Recrée automatiquement
```

### Activer l'environnement virtuel
```bash
source .venv/bin/activate
```

### Installer/mettre à jour les dépendances
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

## Configuration (.env)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `ADMIN_USER` | Nom d'utilisateur admin | `admin` |
| `ADMIN_PASSWORD` | Mot de passe admin | `VotreMdpSecurise123!` |
| `FLASK_SECRET_KEY` | Clé secrète Flask (32+ chars) | `cle-secrete-min-32-chars` |
| `FERNET_KEY` | Clé de chiffrement | Générer avec commande ci-dessus |
| `DATABASE_URL` | Chemin de la DB SQLite | `sqlite:///otp.db` |
| `HOST` | Hôte d'écoute | `127.0.0.1` (local) ou `0.0.0.0` (réseau) |
| `PORT` | Port d'écoute | `8000` |
| `DEBUG` | Mode debug (auto-reload) | `true` (dev) / `false` (prod) |

## Mode DEBUG

### Développement (DEBUG=true)
- ✅ Auto-reload activé (détecte les changements de code)
- ✅ Messages d'erreur détaillés
- ✅ Debugger intégré
- ⚠️ Ne JAMAIS utiliser en production !

### Production (DEBUG=false)
- ❌ Auto-reload désactivé
- ❌ Messages d'erreur minimalistes
- ✅ Plus sécurisé
- ✅ Utiliser avec Gunicorn ou uWSGI

## Utilisation

### 1. Importer un code OTP

**Option A : URI otpauth://**
```
otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub
```

**Option B : QR Code**
- Capture d'écran du QR code
- Upload via formulaire d'import

### 2. Voir les codes TOTP

- Dashboard affiche tous les codes
- Actualisation automatique chaque seconde
- Compte à rebours jusqu'au prochain code

### 3. Copier un code

- Clic sur "Copier"
- Code copié dans le presse-papier

## Dépannage

### L'app ne démarre pas
```bash
# Vérifier les dépendances
source .venv/bin/activate
pip install -r requirements.txt
```

### Erreur "FERNET_KEY manquant"
```bash
# Générer une clé et l'ajouter dans .env
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Erreur de lecture QR
```bash
# Installer libzbar0
sudo apt-get install -y libzbar0  # Ubuntu/Debian
brew install zbar                  # macOS
```

### Port 8000 déjà utilisé
```bash
# Changer le port dans .env
PORT=8001
```

## Structure des fichiers

```
flask-web-otp/
├─ app.py              # Point d'entrée
├─ auth.py             # Authentification
├─ models.py           # Base de données
├─ totp_utils.py       # TOTP + chiffrement
├─ .env                # Configuration (ne pas commit!)
├─ requirements.txt    # Dépendances Python
├─ start.sh            # Script de démarrage
├─ static/app.js       # JavaScript
└─ templates/          # HTML
```

## Sécurité

### ⚠️ À faire absolument

1. **Changer le mot de passe admin** dans `.env`
2. **Générer une nouvelle FERNET_KEY**
3. **Générer une nouvelle FLASK_SECRET_KEY**
4. **Ne JAMAIS committer `.env`** (déjà dans .gitignore)
5. **Sauvegarder FERNET_KEY** (perte = secrets irrécupérables)

### 🔒 Production

- Mettre `DEBUG=false`
- Utiliser HTTPS (Nginx/Traefik + Let's Encrypt)
- Utiliser un serveur WSGI (Gunicorn/uWSGI)
- Limiter l'accès réseau (firewall, VPN)
- Sauvegardes régulières de `otp.db`

## Commandes avancées

### Exécuter dans un screen (serveur distant)
```bash
screen -S webotp
./start.sh
# Ctrl+A puis D pour détacher
# screen -r webotp pour rattacher
```

### Logs avec horodatage
```bash
./start.sh 2>&1 | while read line; do echo "$(date '+%Y-%m-%d %H:%M:%S') $line"; done
```

### Export des codes (sauvegarde)
```bash
sqlite3 otp.db "SELECT issuer, account_name FROM tokens;" > backup.txt
```

---

**Besoin d'aide ?** Consulte `README.md` pour plus de détails.
