import urllib.parse as urlparse
from urllib.parse import parse_qs
from cryptography.fernet import Fernet
import pyotp
from models import AlgoEnum

class SecretVault:
    def __init__(self, fernet_key: str):
        self.fernet = Fernet(fernet_key)

    def encrypt(self, raw: str) -> str:
        return self.fernet.encrypt(raw.encode()).decode()

    def decrypt(self, enc: str) -> str:
        return self.fernet.decrypt(enc.encode()).decode()

def parse_otpauth_uri(uri: str):
    # otpauth://totp/Issuer:account?secret=BASE32&issuer=Issuer&digits=6&period=30&algorithm=SHA1
    parsed = urlparse.urlparse(uri)
    if parsed.scheme != "otpauth" or parsed.netloc.lower() != "totp":
        raise ValueError("URI otpauth TOTP invalide")

    label = urlparse.unquote(parsed.path.lstrip("/"))  # "Issuer:account" or "account"
    qs = parse_qs(parsed.query)

    def get_one(key, default=None):
        v = qs.get(key)
        return v[0] if v else default

    secret = get_one("secret")
    if not secret:
        raise ValueError("Secret manquant dans l'URI")

    issuer_q = get_one("issuer")
    algorithm = (get_one("algorithm", "SHA1") or "SHA1").upper()
    digits = int(get_one("digits", 6))
    period = int(get_one("period", 30))

    issuer_l, account = None, None
    if ":" in label:
        issuer_l, account = label.split(":", 1)
    else:
        account = label

    issuer = issuer_q or issuer_l
    algo_enum = AlgoEnum[algorithm] if algorithm in ("SHA1","SHA256","SHA512") else AlgoEnum.SHA1

    return {
        "issuer": issuer,
        "account_name": account,
        "label": label,
        "secret": secret,
        "digits": digits,
        "period": period,
        "algorithm": algo_enum,
    }

